import { MonthCodeParts, formatMonthCode } from './calendarMonthCode'
import { type CalendarSlot, gregoryCalendar, isoCalendar } from './calendarSlot'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from './epochMath'
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
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): CalendarDateFields {
  return calendar ? calendar.computeDateFields(isoDate) : isoDate
}

export function computeCalendarMonthCodeParts(
  calendar: CalendarSlot,
  year: number,
  month: number,
): MonthCodeParts {
  return calendar
    ? calendar.computeMonthCodeParts(year, month)
    : computeIsoMonthCodeParts(month)
}

export function computeCalendarEraFields(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  return calendar === gregoryCalendar
    ? computeGregoryEraFields(isoDate)
    : calendar
      ? calendar.computeEraFields(isoDate)
      : {}
}

export function computeCalendarIsoFieldsFromParts(
  calendar: CalendarSlot,
  year: number,
  month: number,
  day: number,
): CalendarDateFields {
  return calendar
    ? calendar.computeIsoFieldsFromParts(year, month, day)
    : computeIsoFieldsFromParts(year, month, day)
}

export function computeCalendarEpochMilli(
  calendar: CalendarSlot,
  year: number,
  month?: number,
  day?: number,
): number {
  return calendar
    ? calendar.computeEpochMilli(year, month, day)
    : isoArgsToEpochMilli(year, month, day)!
}

export function computeCalendarMonthsInYearForYear(
  calendar: CalendarSlot,
  year: number,
): number {
  return calendar ? calendar.computeMonthsInYear(year) : isoMonthsInYear
}

export function computeCalendarDaysInMonthForYearMonth(
  calendar: CalendarSlot,
  year: number,
  month: number,
): number {
  return calendar
    ? calendar.computeDaysInMonth(year, month)
    : computeIsoDaysInMonth(year, month)
}

export function computeCalendarMonthCode(
  calendar: CalendarSlot,
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
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): boolean {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeInLeapYear(year)
    : computeIsoInLeapYear(year)
}

export function computeCalendarMonthsInYear(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarMonthsInYearForYear(calendar, year)
}

export function computeCalendarDaysInMonth(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number {
  const { year, month } = computeCalendarDateFields(calendar, isoDate)
  return computeCalendarDaysInMonthForYearMonth(calendar, year, month)
}

export function computeCalendarDaysInYear(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number {
  const { year } = computeCalendarDateFields(calendar, isoDate)
  return calendar
    ? calendar.computeDaysInYear(year)
    : computeIsoDaysInYear(year)
}

export function computeCalendarDayOfYear(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number {
  if (!calendar) {
    return computeIsoDayOfYear(isoDate)
  }
  const { year } = computeCalendarDateFields(calendar, isoDate)
  const milli0 = computeCalendarEpochMilli(calendar, year)
  return diffEpochMilliDays(milli0!, isoDateToEpochMilli(isoDate)!) + 1
}

export function computeCalendarWeekOfYear(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number | undefined {
  return calendar === isoCalendar
    ? computeIsoWeekFields(isoDate).weekOfYear
    : undefined
}

export function computeCalendarYearOfWeek(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
): number | undefined {
  return calendar === isoCalendar
    ? computeIsoWeekFields(isoDate).yearOfWeek
    : undefined
}
