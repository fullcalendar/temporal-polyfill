import { formatMonthCode } from './calendarMonthCode'
import {
  type InternalCalendar,
  getInternalCalendarId,
} from './externalCalendar'
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
import type { AbstractDateSlots } from './slots'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from './timeMath'

export function computeCalendarDateFields(
  isoDate: AbstractDateSlots,
): ReturnType<typeof computeIsoDateFields> {
  const { calendar } = isoDate
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
  isoDate: AbstractDateSlots,
): ReturnType<typeof computeIsoEraFields> {
  const { calendar } = isoDate
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

export function computeCalendarMonthCode(isoDate: AbstractDateSlots): string {
  const { calendar } = isoDate
  const { year, month } = computeCalendarDateFields(isoDate)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}

export function computeCalendarInLeapYear(isoDate: AbstractDateSlots): boolean {
  const { calendar } = isoDate
  const { year } = computeCalendarDateFields(isoDate)
  return calendar
    ? calendar.computeInLeapYear(year)
    : computeIsoInLeapYear(year)
}

export function computeCalendarMonthsInYear(
  isoDate: AbstractDateSlots,
): number {
  const { year } = computeCalendarDateFields(isoDate)
  return computeCalendarMonthsInYearForYear(isoDate.calendar, year)
}

export function computeCalendarDaysInMonth(isoDate: AbstractDateSlots): number {
  const { year, month } = computeCalendarDateFields(isoDate)
  return computeCalendarDaysInMonthForYearMonth(isoDate.calendar, year, month)
}

export function computeCalendarDaysInYear(isoDate: AbstractDateSlots): number {
  const { calendar } = isoDate
  const { year } = computeCalendarDateFields(isoDate)
  return calendar
    ? calendar.computeDaysInYear(year)
    : computeIsoDaysInYear(year)
}

export function computeCalendarDayOfYear(isoDate: AbstractDateSlots): number {
  const { calendar } = isoDate
  if (!calendar) {
    return computeIsoDayOfYear(isoDate)
  }
  const { year } = computeCalendarDateFields(isoDate)
  const milli0 = computeCalendarEpochMilli(calendar, year)
  return diffEpochMilliDays(milli0!, isoDateToEpochMilli(isoDate)!) + 1
}
