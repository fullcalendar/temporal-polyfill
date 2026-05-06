import { formatMonthCode } from './calendarMonthCode'
import {
  type InternalCalendar,
  getInternalCalendarId,
} from './externalCalendar'
import type { CalendarDateFields } from './fieldTypes'
import {
  computeIsoDateFields,
  computeIsoDayOfYear,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoEraFields,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  isoMonthsInYear,
} from './isoMath'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from './timeMath'

export function computeCalendarDateFields(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): ReturnType<typeof computeIsoDateFields> {
  return calendar
    ? calendar.computeDateFields(isoDate)
    : computeIsoDateFields(isoDate)
}

export function computeCalendarMonthCodeParts(
  calendar: InternalCalendar,
  year: number,
  month: number,
): ReturnType<typeof computeIsoMonthCodeParts> {
  return calendar
    ? calendar.computeMonthCodeParts(year, month)
    : computeIsoMonthCodeParts(month)
}

export function computeCalendarEraFields(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): ReturnType<typeof computeIsoEraFields> {
  return calendar
    ? calendar.computeEraFields(isoDate)
    : computeIsoEraFields(getInternalCalendarId(calendar), isoDate)
}

export function computeCalendarIsoFieldsFromParts(
  calendar: InternalCalendar,
  year: number,
  month: number,
  day: number,
): ReturnType<typeof computeIsoFieldsFromParts> {
  return calendar
    ? calendar.computeIsoFieldsFromParts(year, month, day)
    : computeIsoFieldsFromParts(year, month, day)
}

export function computeCalendarEpochMilli(
  calendar: InternalCalendar,
  year: number,
  month?: number,
  day?: number,
): number {
  return calendar
    ? calendar.computeEpochMilli(year, month, day)
    : isoArgsToEpochMilli(year, month, day)!
}

export function computeCalendarMonthsInYearForYear(
  calendar: InternalCalendar,
  year: number,
): number {
  return calendar ? calendar.computeMonthsInYear(year) : isoMonthsInYear
}

export function computeCalendarDaysInMonthForYearMonth(
  calendar: InternalCalendar,
  year: number,
  month: number,
): number {
  return calendar
    ? calendar.computeDaysInMonth(year, month)
    : computeIsoDaysInMonth(year, month)
}

export function computeCalendarMonthCode(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): string {
  const { year, month } = computeCalendarDateFields(calendar, isoDate)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}

export function computeCalendarInLeapYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): boolean {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeInLeapYear(year)
    : computeIsoInLeapYear(year)
}

export function computeCalendarMonthsInYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarMonthsInYearForYear(calendar, year)
}

export function computeCalendarDaysInMonth(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): number {
  const { year, month } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarDaysInMonthForYearMonth(calendar, year, month)
}

export function computeCalendarDaysInYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeDaysInYear(year)
    : computeIsoDaysInYear(year)
}

export function computeCalendarDayOfYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
): number {
  if (!calendar) {
    return computeIsoDayOfYear(isoDate)
  }
  const { year } = computeCalendarDateFields(calendar, isoDate)
  const milli0 = computeCalendarEpochMilli(calendar, year)
  return diffEpochMilliDays(milli0!, isoDateToEpochMilli(isoDate)!) + 1
}
