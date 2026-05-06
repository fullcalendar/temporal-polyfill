import type { MonthCodeParts } from './calendarMonthCode'
import { calendarDateFieldNamesAsc, timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import type {
  CalendarEraFields,
  CalendarWeekFields,
  CalendarYearMonthFields,
} from './fieldTypes'
import { gregoryCalendarId } from './intlCalendarConfig'
import { Overflow } from './optionsModel'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
  isoToLegacyDate,
} from './timeMath'
import {
  allPropsEqual,
  clampProp,
  divTrunc,
  modFloor,
  modTrunc,
  zipProps,
} from './utils'

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12

export function computeIsoDateFields(
  isoDate: CalendarDateFields,
): CalendarDateFields {
  return {
    year: isoDate.year,
    month: isoDate.month,
    day: isoDate.day,
  }
}

export function computeIsoMonthCodeParts(month: number): MonthCodeParts {
  return [month, false]
}

export function computeIsoYearMonthFieldsForMonthDay(
  monthCodeNumber: number,
  isLeapMonth: boolean,
): CalendarYearMonthFields | undefined {
  if (!isLeapMonth) {
    return { year: isoEpochFirstLeapYear, month: monthCodeNumber }
  }
}

export function computeIsoFieldsFromParts(
  year: number,
  month: number,
  day: number,
): CalendarDateFields {
  return { year: year, month: month, day: day }
}

export function computeIsoDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return computeIsoInLeapYear(year) ? 29 : 28
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
  }
  return 31
}

export function computeIsoDaysInYear(year: number): number {
  return computeIsoInLeapYear(year) ? 366 : 365
}

export function computeIsoInLeapYear(year: number): boolean {
  // % is dangerous, but comparing 0 with -0 is fine
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function addIsoMonths(
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  year += divTrunc(monthDelta, isoMonthsInYear)
  month += modTrunc(monthDelta, isoMonthsInYear)

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return { year, month }
}

export function diffIsoMonthSlots(
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  return (year1 - year0) * isoMonthsInYear + month1 - month0
}

export function computeIsoDayOfWeek(isoDateFields: CalendarDateFields): number {
  const [legacyDate, daysNudged] = isoToLegacyDate(
    isoDateFields.year,
    isoDateFields.month,
    isoDateFields.day,
  )

  return modFloor(legacyDate.getUTCDay() - daysNudged, 7) || 7
}

export function computeIsoDayOfYear(isoDateFields: CalendarDateFields): number {
  return (
    diffEpochMilliDays(
      isoArgsToEpochMilli(isoDateFields.year)!,
      isoDateToEpochMilli(isoDateFields)!,
    ) + 1
  )
}

export function computeIsoWeekFields(
  isoDateFields: CalendarDateFields,
): CalendarWeekFields {
  let yearOfWeek = isoDateFields.year
  // ISO week 1 is the week containing Jan 4, equivalently the week containing
  // the year's first Thursday. With Monday=1..Sunday=7, this gives the
  // tentative ISO week number directly for most dates.
  let weekOfYear = Math.floor(
    (computeIsoDayOfYear(isoDateFields) -
      computeIsoDayOfWeek(isoDateFields) +
      10) /
      7,
  )
  let weeksInYear = computeIsoWeeksInYear(yearOfWeek)

  if (weekOfYear < 1) {
    // Early January can still belong to the previous ISO week-year.
    weekOfYear = weeksInYear = computeIsoWeeksInYear(--yearOfWeek)
  } else if (weekOfYear > weeksInYear) {
    // Late December can already belong to the next ISO week-year.
    weekOfYear = 1
    weeksInYear = computeIsoWeeksInYear(++yearOfWeek)
  }

  return { weekOfYear, yearOfWeek, weeksInYear }
}

function computeIsoWeeksInYear(year: number): number {
  const y0DayOfWeek = computeIsoDayOfWeek({ year, month: 1, day: 1 })
  // An ISO year has 53 weeks exactly when Jan 1 is Thursday, or when Jan 1 is
  // Wednesday in a leap year. All other ISO years have 52 weeks.
  return y0DayOfWeek === 4 || (y0DayOfWeek === 3 && computeIsoInLeapYear(year))
    ? 53
    : 52
}

// Era (complicated stuff)
// -----------------------------------------------------------------------------

export function computeIsoEraFields(
  calendarId: string | undefined,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  if (calendarId === gregoryCalendarId) {
    return computeGregoryEraFields(isoDate)
  }

  return {}
}

export function computeGregoryEraFields({
  year,
}: CalendarDateFields): CalendarEraFields {
  if (year < 1) {
    return { era: 'bce', eraYear: -year + 1 }
  }
  return { era: 'ce', eraYear: year }
}

// Checking Fields
// -----------------------------------------------------------------------------
// Checks validity of month/day, but does NOT do bounds checking

export function checkIsoDateTimeFields(
  isoDateTime: CalendarDateTimeFields,
): void {
  checkIsoDateFields(isoDateTime)
  checkTimeFields(isoDateTime)
}

export function checkIsoDateFields<P extends CalendarDateFields>(
  isoInternals: P,
): P {
  constrainIsoDateFields(isoInternals, Overflow.Reject)
  return isoInternals
}

export function isIsoDateFieldsValid(isoDate: CalendarDateFields): boolean {
  return allPropsEqual(
    calendarDateFieldNamesAsc,
    isoDate,
    constrainIsoDateFields(isoDate),
  )
}

// Constraining
// -----------------------------------------------------------------------------

function constrainIsoDateFields(
  isoDate: CalendarDateFields,
  overflow?: Overflow,
): CalendarDateFields {
  const { year } = isoDate
  const month = clampProp(isoDate, 'month', 1, isoMonthsInYear, overflow)
  const day = clampProp(
    isoDate,
    'day',
    1,
    computeIsoDaysInMonth(year, month),
    overflow,
  )
  return { year, month, day }
}

export function checkTimeFields<P extends TimeFields>(timeFields: P): P {
  constrainTimeFields(timeFields, Overflow.Reject)
  return timeFields
}

export function constrainTimeFields(
  timeFields: TimeFields,
  overflow?: Overflow,
): TimeFields {
  return zipProps(timeFieldNamesAsc, [
    clampProp(timeFields, 'hour', 0, 23, overflow),
    clampProp(timeFields, 'minute', 0, 59, overflow),
    clampProp(timeFields, 'second', 0, 59, overflow),
    clampProp(timeFields, 'millisecond', 0, 999, overflow),
    clampProp(timeFields, 'microsecond', 0, 999, overflow),
    clampProp(timeFields, 'nanosecond', 0, 999, overflow),
  ])
}
