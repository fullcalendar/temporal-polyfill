import { CalendarImpl, refineMonthCodeNumber } from './calendarImpl'
import { CalendarSlot, calendarDateAdd } from './calendarSlot'
import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldNamesAsc,
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToLargeNanoStrict,
  updateDurationFieldsSign,
  durationFieldsToDayTimeNano,
  DurationInternals,
} from './durationFields'
import { IsoDateTimeFields, IsoDateFields, IsoTimeFields, pluckIsoTimeFields } from './isoFields'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  epochMilliToIso,
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { Overflow, OverflowOptions, refineOverflowOptions } from './options'
import { IsoDateTimeSlots, ZonedEpochSlots } from './slots'
import { TimeZoneOps, getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { Unit, givenFieldsToDayTimeNano, milliInDay } from './units'
import { clampEntity, divTrunc, modTrunc } from './utils'

// High-level
// -------------------------------------------------------------------------------------------------

export function movePlainDateTime(
  internals: IsoDateTimeSlots,
  durationInternals: DurationInternals,
  options: OverflowOptions | undefined,
): IsoDateTimeSlots {
  return {
    calendar: internals.calendar, // TODO: make this nicer
    ...moveDateTime(
      internals.calendar,
      internals,
      durationInternals,
      refineOverflowOptions(options),
    ),
  }
}

export function moveZonedDateTime(
  internals: ZonedEpochSlots,
  durationFields: DurationFields,
  overflow?: Overflow
): ZonedEpochSlots {
  const epochNano = moveZonedEpochNano(
    internals.calendar,
    internals.timeZone,
    internals.epochNanoseconds,
    durationFields,
    overflow,
  )
  return {
    ...internals,
    epochNanoseconds: epochNano,
  }
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function moveZonedEpochNano(
  calendar: CalendarSlot,
  timeZone: TimeZoneOps,
  epochNano: DayTimeNano,
  durationFields: DurationFields,
  overflow?: Overflow,
): DayTimeNano {
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Hour)

  if (!durationHasDateParts(durationFields)) {
    epochNano = addDayTimeNanos(epochNano, dayTimeNano)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZone, epochNano)
    const movedIsoDateFields = calendarDateAdd(
      calendar,
      isoDateTimeFields,
      updateDurationFieldsSign({
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      }),
      overflow,
    )
    const movedIsoDateTimeFields = {
      ...movedIsoDateFields, // date parts (could be a superset)
      ...pluckIsoTimeFields(isoDateTimeFields), // time parts
    }
    epochNano = addDayTimeNanos(
      getSingleInstantFor(timeZone, movedIsoDateTimeFields),
      dayTimeNano
    )
  }

  return checkEpochNanoInBounds(epochNano)
}

export function moveEpochNano(epochNano: DayTimeNano, durationFields: DurationFields): DayTimeNano {
  return checkEpochNanoInBounds(
    addDayTimeNanos(
      epochNano,
      durationTimeFieldsToLargeNanoStrict(durationFields),
    ),
  )
}

// Date & Time
// -------------------------------------------------------------------------------------------------

export function moveDateTime(
  calendar: CalendarSlot,
  isoDateTimeFields: IsoDateTimeFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateTimeFields {
  // could have over 24 hours!!!
  const [movedIsoTimeFields, dayDelta] = moveTime(isoDateTimeFields, durationFields)

  const movedIsoDateFields = calendarDateAdd(
    calendar,
    isoDateTimeFields, // only date parts will be used
    updateDurationFieldsSign({
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    }),
    overflow,
  )

  return checkIsoDateTimeInBounds({
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  })
}

export function moveDate(
  calendar: CalendarImpl,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateFields {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  // convert time fields to days
  days += givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  if (years || months) {
    let [year, month, day] = calendar.queryYearMonthDay(isoDateFields)

    if (years) {
      const [monthCodeNumber, isLeapMonth] = calendar.queryMonthCode(year, month)
      year += years
      month = refineMonthCodeNumber(monthCodeNumber, isLeapMonth, calendar.queryLeapMonth(year))
      month = clampEntity('month', month, 1, calendar.computeMonthsInYear(year), overflow)
    }

    if (months) {
      ([year, month] = calendar.addMonths(year, month, months))
    }

    day = clampEntity('day', day, 1, calendar.queryDaysInMonth(year, month), overflow)

    epochMilli = calendar.queryDateStart(year, month, day)
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  epochMilli! += (weeks * isoDaysInWeek + days) * milliInDay

  // TODO: use epochMilli for in-bounds-ness instead?
  // TODO: inefficient that PlainDateTime will call in-bounds twice?
  return checkIsoDateInBounds(epochMilliToIso(epochMilli!))
}

export function moveTime(
  isoFields: IsoTimeFields,
  durationFields: DurationFields,
): [IsoTimeFields, number] {
  const [durDays, durTimeNano] = givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)
  const [newIsoFields, overflowDays] = nanoToIsoTimeAndDay(isoTimeFieldsToNano(isoFields) + durTimeNano)

  return [
    newIsoFields,
    durDays + overflowDays,
  ]
}

// Calendar-related Utils
// -------------------------------------------------------------------------------------------------

export function moveByIsoMonths(year: number, month: number, monthDelta: number): [
  year: number,
  month: number,
] {
  year += divTrunc(monthDelta, isoMonthsInYear)
  month += modTrunc(monthDelta, isoMonthsInYear)

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return [year, month]
}

export function moveByIntlMonths(
  year: number,
  month: number,
  monthDelta: number,
  calendarImpl: CalendarImpl
): [
  year: number,
  month: number,
] {
  if (monthDelta) {
    month += monthDelta

    if (monthDelta < 0) {
      if (month < Number.MIN_SAFE_INTEGER) {
        throw new RangeError('Months out of range')
      }
      while (month < 1) {
        month += calendarImpl.computeMonthsInYear(--year)
      }
    } else {
      if (month > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Months out of range')
      }
      let monthsInYear
      while (month > (monthsInYear = calendarImpl.computeMonthsInYear(year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return [year, month]
}
