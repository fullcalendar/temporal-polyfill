import type { Temporal } from 'temporal-spec'
import { normalizeNumberInRange, toIntegerWithTruncation } from './utils.js'

const isoCalendarId = 'iso8601'

export function withDayOfYear<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, dayOfYear: number, options?: Temporal.OverflowOptions): T {
  const normDayOfYear = normalizeNumberInRange(
    toIntegerWithTruncation(dayOfYear),
    1,
    date.daysInYear,
    options,
  )
  return date.add({
    days: normDayOfYear - date.dayOfYear,
  }) as T
}

export function withDayOfWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, dayOfWeek: number, options?: Temporal.OverflowOptions): T {
  const normDayOfWeek = normalizeNumberInRange(
    toIntegerWithTruncation(dayOfWeek),
    1,
    date.daysInWeek,
    options,
  )
  return date.add({
    days: normDayOfWeek - date.dayOfWeek,
  }) as T
}

export function withWeekOfYear<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, weekOfYear: number, options?: Temporal.OverflowOptions): T {
  if (date.calendarId !== isoCalendarId) {
    throw new RangeError('Week numbers not supported')
  }

  const currentWeekOfYear = date.weekOfYear!
  const currentYearOfWeek = date.yearOfWeek!
  const normWeekOfYear = normalizeNumberInRange(
    toIntegerWithTruncation(weekOfYear),
    1,
    computeIsoWeeksInYear(currentYearOfWeek),
    options,
  )

  return date.add({
    weeks: normWeekOfYear - currentWeekOfYear,
  }) as T
}

// Week Number Utils
// TODO: make DRY with temporal-polyfill

function computeIsoWeeksInYear(year: number): number {
  const y0DayOfWeek = computeIsoDayOfWeek(year, 1, 1)
  return y0DayOfWeek === 4 || (y0DayOfWeek === 3 && computeIsoInLeapYear(year))
    ? 53
    : 52
}

function computeIsoDayOfWeek(year: number, month: number, day: number): number {
  const legacyDate = new Date(0)
  legacyDate.setUTCHours(0, 0, 0, 0)
  legacyDate.setUTCFullYear(year, month - 1, day)
  const dayOfWeek = legacyDate.getUTCDay()
  return dayOfWeek || 7
}

function computeIsoInLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
