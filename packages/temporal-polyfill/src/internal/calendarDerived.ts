import {
  type CalendarImpl,
  gregoryCalendarImpl,
  isoCalendarImpl,
} from './calendarImpl'
import { MonthCodeParts, formatMonthCode } from './calendarMonthCode'
import { isoDateArgsToEpochMilli, isoDateToEpochDays } from './epochMath'
import { type CalendarDateFields, CalendarEraFields } from './fieldTypes'
import {
  computeGregoryEraFields,
  computeIsoDayOfYear,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoWeekFields,
  isoMonthsInYear,
} from './isoCalendarMath'

export function computeCalendarDateFields(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): CalendarDateFields {
  return calendar ? calendar.computeDateFields(isoDate) : isoDate
}

export function computeCalendarMonthCodeParts(
  calendar: CalendarImpl,
  year: number,
  month: number,
): MonthCodeParts {
  return calendar
    ? calendar.computeMonthCodeParts(year, month)
    : computeIsoMonthCodeParts(month)
}

export function computeCalendarEraFields(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  return calendar === gregoryCalendarImpl
    ? computeGregoryEraFields(isoDate)
    : calendar
      ? calendar.computeEraFields(isoDate)
      : {}
}

export function computeCalendarIsoFieldsFromParts(
  calendar: CalendarImpl,
  year: number,
  month: number,
  day: number,
): CalendarDateFields {
  return calendar
    ? calendar.computeIsoFieldsFromParts(year, month, day)
    : computeIsoFieldsFromParts(year, month, day)
}

export function computeCalendarEpochMilli(
  calendar: CalendarImpl,
  year: number,
  month?: number,
  day?: number,
): number {
  return calendar
    ? calendar.computeEpochMilli(year, month, day)
    : isoDateArgsToEpochMilli(year, month, day)
}

export function computeCalendarMonthsInYearForYear(
  calendar: CalendarImpl,
  year: number,
): number {
  return calendar ? calendar.computeMonthsInYear(year) : isoMonthsInYear
}

export function computeCalendarDaysInMonthForYearMonth(
  calendar: CalendarImpl,
  year: number,
  month: number,
): number {
  return calendar
    ? calendar.computeDaysInMonth(year, month)
    : computeIsoDaysInMonth(year, month)
}

export function computeCalendarMonthCode(
  calendar: CalendarImpl,
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
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): boolean {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeInLeapYear(year)
    : computeIsoInLeapYear(year)
}

export function computeCalendarMonthsInYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarMonthsInYearForYear(calendar, year)
}

export function computeCalendarDaysInMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number {
  const { year, month } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarDaysInMonthForYearMonth(calendar, year, month)
}

export function computeCalendarDaysInYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeDaysInYear(year)
    : computeIsoDaysInYear(year)
}

export function computeCalendarDayOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number {
  if (!calendar) {
    return computeIsoDayOfYear(isoDate)
  }
  const { year } = computeCalendarDateFields(calendar, isoDate)
  const yearStartIsoDate = computeCalendarIsoFieldsFromParts(
    calendar,
    year,
    1,
    1,
  )
  return isoDateToEpochDays(isoDate) - isoDateToEpochDays(yearStartIsoDate) + 1
}

export function computeCalendarWeekOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number | undefined {
  return calendar === isoCalendarImpl
    ? computeIsoWeekFields(isoDate).weekOfYear
    : undefined
}

export function computeCalendarYearOfWeek(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): number | undefined {
  return calendar === isoCalendarImpl
    ? computeIsoWeekFields(isoDate).yearOfWeek
    : undefined
}
