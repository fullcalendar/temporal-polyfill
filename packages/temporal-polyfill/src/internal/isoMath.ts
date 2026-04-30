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
import { parseIntlYear, queryCalendarIntlFormat } from './intlCalendar'
import { gregoryCalendarId, japaneseCalendarId } from './intlCalendarConfig'
import { formatEpochMilliToPartsRecord } from './intlFormatUtils'
import { Overflow } from './optionsModel'
import {
  isoArgsToEpochMilli,
  isoToEpochMilli,
  isoToLegacyDate,
} from './timeMath'
import { allPropsEqual, clampProp, memoize, modFloor, zipProps } from './utils'

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12

export function computeIsoDateFields(
  isoFields: CalendarDateFields,
): CalendarDateFields {
  return {
    year: isoFields.year,
    month: isoFields.month,
    day: isoFields.day,
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

export function computeIsoDayOfWeek(isoDateFields: CalendarDateFields): number {
  const [legacyDate, daysNudged] = isoToLegacyDate(
    isoDateFields.year,
    isoDateFields.month,
    isoDateFields.day,
  )

  return modFloor(legacyDate.getUTCDay() - daysNudged, 7) || 7
}

export function computeIsoWeekFields(
  queryDayOfYear: (isoFields: CalendarDateFields) => number,
  isoDateFields: CalendarDateFields,
): CalendarWeekFields {
  // ISO weeks always start on Monday, and week 1 is the first week with at
  // least four days in the calendar year. Non-ISO calendars report undefined
  // before reaching this helper.
  const startOfWeek = 1
  const minDaysInWeek = 4

  const isoDayOfWeek = computeIsoDayOfWeek(isoDateFields)
  const isoDayOfYear = queryDayOfYear(isoDateFields)

  // 0-based
  // analyze current date, relative to calendar-decided start-of-week
  const dayOfWeek = modFloor(isoDayOfWeek - startOfWeek, 7)
  const dayOfYear = isoDayOfYear - 1

  // 0-based
  // analyze current year-start
  const y0DayOfWeek = modFloor(dayOfWeek - dayOfYear, 7)
  const y0WeekShift = computeWeekShift(y0DayOfWeek)

  // 1-based
  // tentative result
  let weekOfYear = Math.floor((dayOfYear - y0WeekShift) / 7) + 1
  let yearOfWeek = isoDateFields.year
  let weeksInYear: number

  // Compute the day-of-year (0-based) where first week begins
  // Results can be negative indicating the first week begins in the prev year
  function computeWeekShift(yDayOfWeek: number): number {
    return (7 - yDayOfWeek < minDaysInWeek ? 7 : 0) - yDayOfWeek
  }

  // For a given year relative to `yearOfWeek`, compute the total # of weeks
  function computeWeeksInYear(delta: 0 | -1): number {
    const daysInYear = computeIsoDaysInYear(yearOfWeek + delta)
    const sign = delta || 1
    const y1DayOfWeek = modFloor(y0DayOfWeek + daysInYear * sign, 7)
    const y1WeekShift = computeWeekShift(y1DayOfWeek)
    return (weeksInYear = (daysInYear + (y1WeekShift - y0WeekShift) * sign) / 7)
  }

  if (!weekOfYear) {
    // in previous year's last week
    weekOfYear = computeWeeksInYear(-1)
    yearOfWeek--
  } else if (weekOfYear > computeWeeksInYear(0)) {
    // in next year's first week
    weekOfYear = 1
    yearOfWeek++
  }

  return { weekOfYear, yearOfWeek, weeksInYear: weeksInYear! }
}

// Era (complicated stuff)
// -----------------------------------------------------------------------------

// Temporal's Japanese era round-tripping follows the Gregorian-aligned era
// model used by test262, where dates before 1873 remain in CE/BCE.
const primaryJapaneseEraMilli = isoArgsToEpochMilli(1873, 1, 1)!
const queryJapaneseEraFields = memoize(computeJapaneseEraFields, WeakMap)

export function computeIsoEraFields(
  calendarId: string | undefined,
  isoFields: CalendarDateFields,
): CalendarEraFields {
  if (calendarId === gregoryCalendarId) {
    return computeGregoryEraFields(isoFields)
  }

  if (calendarId === japaneseCalendarId) {
    return queryJapaneseEraFields(isoFields)
  }

  return {}
}

function computeGregoryEraFields({
  year,
}: CalendarDateFields): CalendarEraFields {
  if (year < 1) {
    return { era: 'bce', eraYear: -year + 1 }
  }
  return { era: 'ce', eraYear: year }
}

function computeJapaneseEraFields(
  isoFields: CalendarDateFields,
): CalendarEraFields {
  const epochMilli = isoToEpochMilli(isoFields)!

  if (epochMilli < primaryJapaneseEraMilli) {
    // Pre-Meiji dates round-trip through generic CE/BCE in Temporal instead of
    // exposing ICU's large set of historical Japanese era names.
    return computeGregoryEraFields(isoFields)
  }

  const intlParts = formatEpochMilliToPartsRecord(
    queryCalendarIntlFormat(japaneseCalendarId),
    epochMilli,
  )

  const { era, eraYear } = parseIntlYear(intlParts, japaneseCalendarId)
  return { era, eraYear }
}

// Checking Fields
// -----------------------------------------------------------------------------
// Checks validity of month/day, but does NOT do bounds checking

export function checkIsoDateTimeFields<P extends CalendarDateTimeFields>(
  isoDateTimeFields: P,
): P {
  checkIsoDateFields(isoDateTimeFields)
  constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject)
  return isoDateTimeFields
}

export function checkIsoDateFields<P extends CalendarDateFields>(
  isoInternals: P,
): P {
  constrainIsoDateFields(isoInternals, Overflow.Reject)
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: CalendarDateFields): boolean {
  return allPropsEqual(
    calendarDateFieldNamesAsc,
    isoFields,
    constrainIsoDateFields(isoFields),
  )
}

// Constraining
// -----------------------------------------------------------------------------

function constrainIsoDateFields(
  isoFields: CalendarDateFields,
  overflow?: Overflow,
): CalendarDateFields {
  const { year } = isoFields
  const month = clampProp(isoFields, 'month', 1, isoMonthsInYear, overflow)
  const day = clampProp(
    isoFields,
    'day',
    1,
    computeIsoDaysInMonth(year, month),
    overflow,
  )
  return { year, month, day }
}

export function constrainIsoTimeFields(
  isoTimeFields: TimeFields,
  overflow?: Overflow,
): TimeFields {
  return zipProps(timeFieldNamesAsc, [
    clampProp(isoTimeFields, 'hour', 0, 23, overflow),
    clampProp(isoTimeFields, 'minute', 0, 59, overflow),
    clampProp(isoTimeFields, 'second', 0, 59, overflow),
    clampProp(isoTimeFields, 'millisecond', 0, 999, overflow),
    clampProp(isoTimeFields, 'microsecond', 0, 999, overflow),
    clampProp(isoTimeFields, 'nanosecond', 0, 999, overflow),
  ])
}
