import { CalendarImpl, refineMonthCodeNumber } from './calendarImpl'
import { CalendarDateAddFunc } from './calendarRecordTypes'
import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldNamesAsc,
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToLargeNanoStrict,
  updateDurationFieldsSign,
  durationFieldsToDayTimeNano,
} from './durationFields'
import { IsoDateTimeFields, IsoDateFields, IsoTimeFields, isoTimeFieldNamesDesc } from './isoFields'
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
import { Overflow } from './optionEnums'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneMath'
import { Unit, givenFieldsToDayTimeNano, milliInDay } from './units'
import { clampEntity, divTrunc, modTrunc, pluckProps } from './utils'
import { isoCalendarId } from './calendarConfig'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'

// Epoch
// -------------------------------------------------------------------------------------------------

export function moveZonedEpochNano(
  calendarRecord: {
    dateAdd: CalendarDateAddFunc
  },
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  epochNano: DayTimeNano,
  durationFields: DurationFields,
  overflow: Overflow,
): DayTimeNano {
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Hour) // better name: timed nano

  if (!durationHasDateParts(durationFields)) {
    epochNano = addDayTimeNanos(epochNano, dayTimeNano)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZoneRecord, epochNano)
    const movedIsoDateFields = moveDateEasy(
      calendarRecord,
      isoDateTimeFields,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      },
      overflow,
    )
    const movedIsoDateTimeFields = {
      ...movedIsoDateFields, // date parts (could be a superset)
      ...pluckProps(isoTimeFieldNamesDesc, isoDateTimeFields), // time parts
      calendar: isoCalendarId, // NOT USED but whatever
    }
    epochNano = addDayTimeNanos(
      getSingleInstantFor(timeZoneRecord, movedIsoDateTimeFields),
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
  calendarRecord: { dateAdd: CalendarDateAddFunc },
  isoDateTimeFields: IsoDateTimeFields,
  durationFields: DurationFields,
  overflow: Overflow,
): IsoDateTimeFields {
  // could have over 24 hours!!!
  const [movedIsoTimeFields, dayDelta] = moveTime(isoDateTimeFields, durationFields)

  const movedIsoDateFields = moveDateEasy(
    calendarRecord,
    isoDateTimeFields, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    overflow,
  )

  return checkIsoDateTimeInBounds({
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  })
}

export function moveDateEasy(
  calendarRecord: { dateAdd: CalendarDateAddFunc },
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): IsoDateFields {
  if (durationFields.years || durationFields.months || durationFields.weeks) {
    return calendarRecord.dateAdd(
      isoDateFields,
      updateDurationFieldsSign(durationFields),
      overflow
    )
  }

  // don't need calendar going forward...

  // TODO: DRY
  const days = durationFields.days + givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  // TODO: better utility for adding days
  if (days) {
    let epochMilli = isoToEpochMilli(isoDateFields)!
    epochMilli += days * milliInDay
    return checkIsoDateInBounds(epochMilliToIso(epochMilli!))
  }

  return isoDateFields
}

/*
Called by CalendarImpl, that's why it accepts refined overflow
*/
export function moveDate(
  calendarImpl: CalendarImpl,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateFields {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  // convert time fields to days
  days += givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  if (years || months) {
    let [year, month, day] = calendarImpl.queryYearMonthDay(isoDateFields)

    if (years) {
      const [monthCodeNumber, isLeapMonth] = calendarImpl.queryMonthCode(year, month)
      year += years
      month = refineMonthCodeNumber(monthCodeNumber, isLeapMonth, calendarImpl.queryLeapMonth(year))
      month = clampEntity('month', month, 1, calendarImpl.computeMonthsInYear(year), overflow)
    }

    if (months) {
      ([year, month] = calendarImpl.addMonths(year, month, months))
    }

    day = clampEntity('day', day, 1, calendarImpl.queryDaysInMonth(year, month), overflow)

    epochMilli = calendarImpl.queryDateStart(year, month, day)
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
