import { formatMonthCode } from './calendarMonthCode'
import { getExternalCalendar, isCoreCalendarId } from './externalCalendar'
import type { CalendarWeekFields } from './fieldTypes'
import {
  gregoryCalendarId,
  gregoryEraOrigins,
  isoCalendarId,
} from './intlCalendarConfig'
import {
  computeIsoDateFields,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoEraFields,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoWeekFields,
  computeIsoYearMonthFieldsForMonthDay,
  isoEpochFirstLeapYear,
  isoMonthsInYear,
} from './isoMath'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from './timeMath'

export function queryCalendarDateFields(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): ReturnType<typeof computeIsoDateFields> {
  return isCoreCalendarId(calendarId)
    ? computeIsoDateFields(isoDate)
    : getExternalCalendar(calendarId).computeDateFields(isoDate)
}

export function queryCalendarDay(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): number {
  return isCoreCalendarId(calendarId)
    ? isoDate.day
    : getExternalCalendar(calendarId).computeDay(isoDate)
}

export function queryCalendarEpochMilli(
  calendarId: string,
  year: number,
  month?: number,
  day?: number,
): number {
  return isCoreCalendarId(calendarId)
    ? isoArgsToEpochMilli(year, month, day)!
    : getExternalCalendar(calendarId).computeEpochMilli(year, month, day)
}

export function queryCalendarEraFields(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoEraFields>[1],
): ReturnType<typeof computeIsoEraFields> {
  return isCoreCalendarId(calendarId)
    ? computeIsoEraFields(calendarId, isoDate)
    : getExternalCalendar(calendarId).computeEraFields(isoDate)
}

export function queryCalendarMonthCodeParts(
  calendarId: string,
  year: number,
  month: number,
): ReturnType<typeof computeIsoMonthCodeParts> {
  return isCoreCalendarId(calendarId)
    ? computeIsoMonthCodeParts(month)
    : getExternalCalendar(calendarId).computeMonthCodeParts(year, month)
}

export function queryCalendarMonthCode(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): string {
  const { year, month } = queryCalendarDateFields(calendarId, isoDate)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    calendarId,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}

export function queryCalendarYearMonthForMonthDay(
  calendarId: string,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): ReturnType<typeof computeIsoYearMonthFieldsForMonthDay> {
  return isCoreCalendarId(calendarId)
    ? computeIsoYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth)
    : getExternalCalendar(calendarId).computeYearMonthFieldsForMonthDay(
        monthCodeNumber,
        isLeapMonth,
        day,
      )
}

export function queryCalendarIsoFieldsFromParts(
  calendarId: string,
  year: Parameters<typeof computeIsoFieldsFromParts>[0],
  month: Parameters<typeof computeIsoFieldsFromParts>[1],
  day: Parameters<typeof computeIsoFieldsFromParts>[2],
): ReturnType<typeof computeIsoFieldsFromParts> {
  return isCoreCalendarId(calendarId)
    ? computeIsoFieldsFromParts(year, month, day)
    : getExternalCalendar(calendarId).computeIsoFieldsFromParts(
        year,
        month,
        day,
      )
}

export function queryCalendarInLeapYear(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): boolean {
  const { year } = queryCalendarDateFields(calendarId, isoDate)
  return isCoreCalendarId(calendarId)
    ? computeIsoInLeapYear(year)
    : getExternalCalendar(calendarId).computeInLeapYear(year)
}

export function queryCalendarMonthsInYear(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoDate)
  return queryCalendarMonthsInYearPart(calendarId, year)
}

export function queryCalendarMonthsInYearPart(
  calendarId: string,
  year: number,
): number {
  return isCoreCalendarId(calendarId)
    ? isoMonthsInYear
    : getExternalCalendar(calendarId).computeMonthsInYear(year)
}

export function queryCalendarDaysInMonth(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year, month } = queryCalendarDateFields(calendarId, isoDate)
  return queryCalendarDaysInMonthPart(calendarId, year, month)
}

export function queryCalendarDaysInMonthPart(
  calendarId: string,
  year: number,
  month: number,
): number {
  return isCoreCalendarId(calendarId)
    ? computeIsoDaysInMonth(year, month)
    : getExternalCalendar(calendarId).computeDaysInMonth(year, month)
}

export function queryCalendarDaysInYear(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoDate)
  return isCoreCalendarId(calendarId)
    ? computeIsoDaysInYear(year)
    : getExternalCalendar(calendarId).computeDaysInYear(year)
}

export function queryCalendarLeapMonth(
  calendarId: string,
  year: number,
): number | undefined {
  return isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId).computeLeapMonth(year)
}

export function queryCalendarDayOfYear(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoDate)
  const milli0 = isCoreCalendarId(calendarId)
    ? isoArgsToEpochMilli(year)
    : getExternalCalendar(calendarId).computeEpochMilli(year)
  const milli1 = isoDateToEpochMilli(isoDate)!
  return diffEpochMilliDays(milli0!, milli1) + 1
}

export function queryCalendarWeekFields(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoWeekFields>[1],
): CalendarWeekFields {
  if (calendarId !== isoCalendarId) {
    return {}
  }

  return computeIsoWeekFields(
    (innerIsoDate) => queryCalendarDayOfYear(calendarId, innerIsoDate),
    isoDate,
  )
}

export function queryCalendarWeekOfYear(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoWeekFields>[1],
): number | undefined {
  return queryCalendarWeekFields(calendarId, isoDate).weekOfYear
}

export function queryCalendarYearOfWeek(
  calendarId: string,
  isoDate: Parameters<typeof computeIsoWeekFields>[1],
): number | undefined {
  return queryCalendarWeekFields(calendarId, isoDate).yearOfWeek
}

export function getCalendarEraOrigins(
  calendarId: string,
): Record<string, number> | undefined {
  if (calendarId === gregoryCalendarId) {
    return gregoryEraOrigins
  }
  if (calendarId === isoCalendarId) {
    return undefined
  }
  return getExternalCalendar(calendarId).eraOrigins
}

export function getCalendarLeapMonthMeta(
  calendarId: string,
): number | undefined {
  return isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId).leapMonthMeta
}

export function getCalendarEraRemaps(
  calendarId: string,
): Record<string, string> | undefined {
  return isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId).eraRemaps
}

export function getCalendarMonthDayReferenceYear(
  calendarId: string,
): number | undefined {
  return isCoreCalendarId(calendarId)
    ? isoEpochFirstLeapYear
    : getExternalCalendar(calendarId).monthDayReferenceYear
}

export function getPlainMonthDayLeapMonthMaxDays(
  calendarId: string,
): Record<number, number> | undefined {
  return isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId).plainMonthDayLeapMonthMaxDays
}

export function getPlainMonthDayCommonMonthMaxDay(
  calendarId: string,
): number | undefined {
  return isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId).plainMonthDayCommonMonthMaxDay
}
