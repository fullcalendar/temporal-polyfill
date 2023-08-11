import { CalendarImpl } from './calendarImpl'
import { CalendarOps } from './calendarOps'
import {
  DurationFields,
  durationFieldsToNano,
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToIso,
  durationTimeFieldsToIsoStrict,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateTimeFields, IsoDateFields, IsoTimeFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import {
  epochMilliToIso,
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { LargeInt } from './largeInt'
import { Overflow } from './options'
import { TimeZoneOps, getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { Unit, milliInDay, nanoInUtcDay } from './units'
import { clamp } from './utils'

// Epoch
// -------------------------------------------------------------------------------------------------

export function moveZonedEpochNano(
  calendar: CalendarOps,
  timeZone: TimeZoneOps,
  epochNano: LargeInt,
  durationFields: DurationFields,
  overflow?: Overflow,
): LargeInt {
  const durationTimeNano = isoTimeFieldsToNano(durationTimeFieldsToIso(durationFields))

  if (!durationHasDateParts(durationFields)) {
    epochNano = epochNano.addNumber(durationTimeNano)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZone, epochNano)
    const movedIsoDateFields = calendar.dateAdd(
      isoDateTimeFields,
      updateDurationFieldsSign({ // does CalendarOps really need sign?
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      }),
      overflow,
    )
    const movedIsoDateTimeFields = {
      ...isoDateTimeFields, // time parts
      ...movedIsoDateFields, // date parts
    }
    epochNano = getSingleInstantFor(timeZone, movedIsoDateTimeFields)
      .addNumber(durationTimeNano)
  }

  return epochNano
}

export function moveEpochNano(epochNano: LargeInt, durationFields: DurationFields): LargeInt {
  return epochNano.addNumber(
    isoTimeFieldsToNano(
      durationTimeFieldsToIsoStrict(durationFields)
    )
  )
}

// Date & Time
// -------------------------------------------------------------------------------------------------

export function moveDateTime(
  calendar: CalendarOps,
  isoDateTimeFields: IsoDateTimeFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateTimeFields {
  const [movedIsoTimeFields, dayDelta] = moveTime(isoDateTimeFields, durationFields)

  const movedIsoDateFields = calendar.dateAdd(
    isoDateTimeFields, // only date parts will be used
    updateDurationFieldsSign({ // does CalendarOps really need sign?
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    }),
    overflow,
  )

  return {
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  }
}

export function moveDate(
  calendar: CalendarImpl,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateInternals {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  // convert time fields to days
  days += durationFieldsToNano(durationFields, Unit.Hour)
    .divTruncMod(nanoInUtcDay)[0].toNumber()

  if (years || months) {
    let [year, month, day] = calendar.queryYearMonthDay(isoDateFields)

    if (years) {
      year += years
      month = clamp(month, 1, calendar.computeMonthsInYear(year), overflow, 'month')
    }

    if (months) {
      ([year, month] = calendar.addMonths(year, month, months))
    }

    day = clamp(day, 1, calendar.queryDaysInMonth(year, month), overflow, 'day')

    epochMilli = calendar.queryDateStart(year, month, day)
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return { // TODO: not nice
      calendar,
      ...isoDateFields
    }
  }

  epochMilli! += (weeks * isoDaysInWeek + days) * milliInDay

  return {
    calendar,
    ...epochMilliToIso(epochMilli!),
  }
}

export function moveDateByDays( // TODO: rename moveDateDays?
  isoDateFields: IsoDateFields,
  days: number,
): IsoDateFields {
  if (days) {
    isoDateFields = epochMilliToIso(isoToEpochMilli(isoDateFields)! + days * milliInDay)
  }
  return isoDateFields
}

export function moveTime(
  isoTimeFields: IsoTimeFields,
  durationFields: DurationFields,
  strict?: boolean,
): [IsoTimeFields, number] {
  return nanoToIsoTimeAndDay(
    isoTimeFieldsToNano(isoTimeFields) +
    isoTimeFieldsToNano(
      // TODO: less hacky
      strict
        ? durationTimeFieldsToIsoStrict(durationFields)
        : durationTimeFieldsToIso(durationFields)
    ),
  )
}

// Calendar-related Utils
// -------------------------------------------------------------------------------------------------

export function moveByIsoMonths(year: number, month: number, monthDelta: number): [
  year: number,
  month: number,
] {
  year += Math.trunc(monthDelta / isoMonthsInYear)
  month += monthDelta % isoMonthsInYear

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

  return [year, month]
}
