import { computeCalendarIdBase } from './calendarId'
import { formatMonthCode } from './calendarMonthCode'
import type { CalendarWeekFields } from './fieldTypes'
import {
  IntlCalendar,
  computeIntlDateFields,
  computeIntlDay,
  computeIntlDaysInMonth,
  computeIntlDaysInYear,
  computeIntlEpochMilli,
  computeIntlEraFields,
  computeIntlInLeapYear,
  computeIntlLeapMonth,
  computeIntlMonthCodeParts,
  computeIntlMonthsInYear,
  computeIntlYearMonthFieldsForMonthDay,
  computeIsoFieldsFromIntlParts,
  queryIntlCalendar,
} from './intlCalendar'
import {
  eraOriginsByCalendarId,
  gregoryCalendarId,
  isoCalendarId,
  isoYearOffsetsByCalendarId,
  japaneseCalendarId,
  leapMonthMetas,
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
  isoMonthsInYear,
} from './isoMath'
import {
  diffEpochMilliDays,
  isoArgsToEpochMilli,
  isoToEpochMilli,
} from './timeMath'

export function queryCalendarDateFields(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): ReturnType<typeof computeIsoDateFields> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return {
      year: isoFields.isoYear + isoYearOffset,
      month: isoFields.isoMonth,
      day: isoFields.isoDay,
    }
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDateFields(isoFields)
    : computeIntlDateFields(queryIntlCalendar(calendarId), isoFields)
}

export function queryCalendarDay(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): number {
  if (queryIsoYearOffset(calendarId) !== undefined) {
    return isoFields.isoDay
  }

  return isIsoBasedCalendarId(calendarId)
    ? isoFields.isoDay
    : computeIntlDay(queryIntlCalendar(calendarId), isoFields)
}

export function queryCalendarEpochMilli(
  calendarId: string,
  year: number,
  month?: number,
  day?: number,
): number {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return isoArgsToEpochMilli(year - isoYearOffset, month, day)!
  }

  return isIsoBasedCalendarId(calendarId)
    ? isoArgsToEpochMilli(year, month, day)!
    : computeIntlEpochMilli(queryIntlCalendar(calendarId), year, month, day)
}

export function queryCalendarEraFields(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoEraFields>[1],
): ReturnType<typeof computeIsoEraFields> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const year = isoFields.isoYear + isoYearOffset

    if (calendarId === 'buddhist') {
      return { era: 'be', eraYear: year }
    }

    if (calendarId === 'roc') {
      return year < 1
        ? { era: 'broc', eraYear: 1 - year }
        : { era: 'roc', eraYear: year }
    }
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoEraFields(queryIsoCalendarId(calendarId), isoFields)
    : computeIntlEraFields(queryIntlCalendar(calendarId), isoFields)
}

export function queryCalendarMonthCodeParts(
  calendarId: string,
  year: number,
  month: number,
): ReturnType<typeof computeIsoMonthCodeParts> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoMonthCodeParts(month)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoMonthCodeParts(month)
    : computeIntlMonthCodeParts(queryIntlCalendar(calendarId), year, month)
}

export function queryCalendarMonthCode(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): string {
  const { year, month } = queryCalendarDateFields(calendarId, isoFields)
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
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const res = computeIsoYearMonthFieldsForMonthDay(
      monthCodeNumber,
      isLeapMonth,
    )
    return res && { year: res.year + isoYearOffset, month: res.month }
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth)
    : computeIntlYearMonthFieldsForMonthDay(
        queryIntlCalendar(calendarId),
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
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoFieldsFromParts(year - isoYearOffset, month, day)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoFieldsFromParts(year, month, day)
    : computeIsoFieldsFromIntlParts(
        queryIntlCalendar(calendarId),
        year,
        month,
        day,
      )
}

export function queryCalendarInLeapYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): boolean {
  const { year } = queryCalendarDateFields(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoInLeapYear(year - isoYearOffset)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoInLeapYear(year)
    : computeIntlInLeapYear(queryIntlCalendar(calendarId), year)
}

export function queryCalendarMonthsInYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoFields)
  return queryCalendarMonthsInYearPart(calendarId, year)
}

export function queryCalendarMonthsInYearPart(
  calendarId: string,
  year: number,
): number {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return isoMonthsInYear
  }

  return isIsoBasedCalendarId(calendarId)
    ? isoMonthsInYear
    : computeIntlMonthsInYear(queryIntlCalendar(calendarId), year)
}

export function queryCalendarDaysInMonth(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year, month } = queryCalendarDateFields(calendarId, isoFields)
  return queryCalendarDaysInMonthPart(calendarId, year, month)
}

export function queryCalendarDaysInMonthPart(
  calendarId: string,
  year: number,
  month: number,
): number {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoDaysInMonth(year - isoYearOffset, month)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDaysInMonth(year, month)
    : computeIntlDaysInMonth(queryIntlCalendar(calendarId), year, month)
}

export function queryCalendarDaysInYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoDaysInYear(year - isoYearOffset)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDaysInYear(year)
    : computeIntlDaysInYear(queryIntlCalendar(calendarId), year)
}

export function queryCalendarLeapMonth(
  calendarId: string,
  year: number,
): number | undefined {
  if (queryIsoYearOffset(calendarId) !== undefined) {
    return undefined
  }

  return isIsoBasedCalendarId(calendarId)
    ? undefined
    : computeIntlLeapMonth(queryIntlCalendar(calendarId), year)
}

export function queryCalendarDayOfYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateFields>[0],
): number {
  const { year } = queryCalendarDateFields(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  const milli0 =
    isoYearOffset !== undefined
      ? isoArgsToEpochMilli(year - isoYearOffset)
      : isIsoBasedCalendarId(calendarId)
        ? isoArgsToEpochMilli(year)
        : computeIntlEpochMilli(queryIntlCalendar(calendarId), year)
  const milli1 = isoToEpochMilli(isoFields)!
  return diffEpochMilliDays(milli0!, milli1) + 1
}

export function queryCalendarWeekFields(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekFields>[1],
): CalendarWeekFields {
  if (calendarId !== isoCalendarId) {
    return {}
  }

  return computeIsoWeekFields(
    (innerIsoFields) => queryCalendarDayOfYear(calendarId, innerIsoFields),
    isoFields,
  )
}

export function queryCalendarWeekOfYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekFields>[1],
): number | undefined {
  return queryCalendarWeekFields(calendarId, isoFields).weekOfYear
}

export function queryCalendarYearOfWeek(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekFields>[1],
): number | undefined {
  return queryCalendarWeekFields(calendarId, isoFields).yearOfWeek
}

export function isIsoBasedCalendarId(calendarId: string): boolean {
  return (
    calendarId === isoCalendarId ||
    calendarId === gregoryCalendarId ||
    calendarId === japaneseCalendarId
  )
}

export function queryIntlCalendarMaybe(
  calendarId: string,
): IntlCalendar | undefined {
  return isIsoBasedCalendarId(calendarId)
    ? undefined
    : queryIntlCalendar(calendarId)
}

export function queryIsoCalendarId(calendarId: string): string | undefined {
  return calendarId === isoCalendarId ? undefined : calendarId
}

export function queryIsoYearOffset(calendarId: string): number | undefined {
  return isoYearOffsetsByCalendarId[calendarId]
}

export function getCalendarEraOrigins(
  calendarId: string,
): Record<string, number> | undefined {
  return eraOriginsByCalendarId[computeCalendarIdBase(calendarId)]
}

export function getCalendarLeapMonthMeta(
  calendarId: string,
): number | undefined {
  return leapMonthMetas[computeCalendarIdBase(calendarId)]
}
