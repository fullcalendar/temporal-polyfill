import {
  gregoryCalendarId,
  isoCalendarId,
  isoYearOffsetsByCalendarId,
  japaneseCalendarId,
} from './calendarConfig'
import { WeekParts, formatMonthCode } from './calendarNative'
import {
  diffEpochMilliByDay,
  intlMonthAdd,
  isoMonthAdd,
  monthAdd,
} from './calendarNativeMath'
import {
  computeIntlDateParts,
  computeIntlDay,
  computeIntlDaysInMonth,
  computeIntlDaysInYear,
  computeIntlEpochMilli,
  computeIntlEraParts,
  computeIntlInLeapYear,
  computeIntlLeapMonth,
  computeIntlMonthCodeParts,
  computeIntlMonthsInYear,
  computeIntlYearMonthForMonthDay,
  computeIsoFieldsFromIntlParts,
  queryIntlCalendar,
} from './intlMath'
import {
  computeIsoDateParts,
  computeIsoDay,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoEraParts,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoMonthsInYear,
  computeIsoWeekParts,
  computeIsoYearMonthForMonthDay,
} from './isoMath'
import { isoArgsToEpochMilli, isoToEpochMilli } from './timeMath'

export function queryNativeDateParts(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): ReturnType<typeof computeIsoDateParts> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return [
      isoFields.isoYear + isoYearOffset,
      isoFields.isoMonth,
      isoFields.isoDay,
    ]
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDateParts(isoFields)
    : computeIntlDateParts(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeDay(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDay>[0],
): ReturnType<typeof computeIsoDay> {
  if (queryIsoYearOffset(calendarId) !== undefined) {
    return computeIsoDay(isoFields)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDay(isoFields)
    : computeIntlDay(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeEpochMilli(
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

export function queryNativeMonthAdd(
  calendarId: string,
  year: number,
  month: number,
  monthDelta: number,
): ReturnType<typeof isoMonthAdd> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const res = isoMonthAdd(year - isoYearOffset, month, monthDelta)
    return [res[0] + isoYearOffset, res[1]]
  }

  return isIsoBasedCalendarId(calendarId)
    ? isoMonthAdd(year, month, monthDelta)
    : intlMonthAdd(queryIntlCalendar(calendarId), year, month, monthDelta)
}

export function queryNativeYearMonthAdd(
  calendarId: string,
  isoFields: Parameters<typeof monthAdd>[1],
  years: Parameters<typeof monthAdd>[2],
  months: Parameters<typeof monthAdd>[3],
  overflow: Parameters<typeof monthAdd>[4],
): ReturnType<typeof monthAdd> {
  return monthAdd(calendarId, isoFields, years, months, overflow)
}

export function queryNativeEraParts(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoEraParts>[1],
): ReturnType<typeof computeIsoEraParts> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const year = isoFields.isoYear + isoYearOffset

    if (calendarId === 'buddhist') {
      return ['be', year]
    }

    if (calendarId === 'roc') {
      return year < 1 ? ['broc', 1 - year] : ['roc', year]
    }
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoEraParts(queryIsoCalendarId(calendarId), isoFields)
    : computeIntlEraParts(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeMonthCodeParts(
  calendarId: string,
  year: Parameters<typeof computeIsoMonthCodeParts>[0],
  month: Parameters<typeof computeIsoMonthCodeParts>[1],
): ReturnType<typeof computeIsoMonthCodeParts> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoMonthCodeParts(year - isoYearOffset, month)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoMonthCodeParts(year, month)
    : computeIntlMonthCodeParts(queryIntlCalendar(calendarId), year, month)
}

export function queryNativeMonthCode(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): string {
  const [year, month] = queryNativeDateParts(calendarId, isoFields)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    calendarId,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}

export function queryNativeYearMonthForMonthDay(
  calendarId: string,
  monthCodeNumber: Parameters<typeof computeIsoYearMonthForMonthDay>[0],
  isLeapMonth: Parameters<typeof computeIsoYearMonthForMonthDay>[1],
  day: Parameters<typeof computeIsoYearMonthForMonthDay>[2],
): ReturnType<typeof computeIsoYearMonthForMonthDay> {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const res = computeIsoYearMonthForMonthDay(
      monthCodeNumber,
      isLeapMonth,
      day,
    )
    return res && [res[0] + isoYearOffset, res[1]]
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoYearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
    : computeIntlYearMonthForMonthDay(
        queryIntlCalendar(calendarId),
        monthCodeNumber,
        isLeapMonth,
        day,
      )
}

export function queryNativeIsoFieldsFromParts(
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

export function queryNativeInLeapYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): boolean {
  const [year] = queryNativeDateParts(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoInLeapYear(year - isoYearOffset)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoInLeapYear(year)
    : computeIntlInLeapYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeMonthsInYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
  const [year] = queryNativeDateParts(calendarId, isoFields)
  return queryNativeMonthsInYearPart(calendarId, year)
}

export function queryNativeMonthsInYearPart(
  calendarId: string,
  year: number,
): number {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoMonthsInYear(year - isoYearOffset)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoMonthsInYear(year)
    : computeIntlMonthsInYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeDaysInMonth(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
  const [year, month] = queryNativeDateParts(calendarId, isoFields)
  return queryNativeDaysInMonthPart(calendarId, year, month)
}

export function queryNativeDaysInMonthPart(
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

export function queryNativeDaysInYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
  const [year] = queryNativeDateParts(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    return computeIsoDaysInYear(year - isoYearOffset)
  }

  return isIsoBasedCalendarId(calendarId)
    ? computeIsoDaysInYear(year)
    : computeIntlDaysInYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeLeapMonth(
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

export function queryNativeDayOfYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
  const [year] = queryNativeDateParts(calendarId, isoFields)
  const isoYearOffset = queryIsoYearOffset(calendarId)
  const milli0 =
    isoYearOffset !== undefined
      ? isoArgsToEpochMilli(year - isoYearOffset)
      : isIsoBasedCalendarId(calendarId)
        ? isoArgsToEpochMilli(year)
        : computeIntlEpochMilli(queryIntlCalendar(calendarId), year)
  const milli1 = isoToEpochMilli(isoFields)!
  return diffEpochMilliByDay(milli0!, milli1) + 1
}

export function queryNativeWeekParts(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekParts>[2],
): WeekParts {
  if (calendarId !== isoCalendarId) {
    return [] as unknown as WeekParts
  }

  return computeIsoWeekParts(
    queryIsoCalendarId(calendarId),
    (innerIsoFields) => queryNativeDayOfYear(calendarId, innerIsoFields),
    isoFields,
  )
}

export function queryNativeWeekOfYear(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekParts>[2],
): number | undefined {
  return queryNativeWeekParts(calendarId, isoFields)[0]
}

export function queryNativeYearOfWeek(
  calendarId: string,
  isoFields: Parameters<typeof computeIsoWeekParts>[2],
): number | undefined {
  return queryNativeWeekParts(calendarId, isoFields)[1]
}

function isIsoBasedCalendarId(calendarId: string): boolean {
  return (
    calendarId === isoCalendarId ||
    calendarId === gregoryCalendarId ||
    calendarId === japaneseCalendarId
  )
}

function queryIsoCalendarId(calendarId: string): string | undefined {
  return calendarId === isoCalendarId ? undefined : calendarId
}

function queryIsoYearOffset(calendarId: string): number | undefined {
  return isoYearOffsetsByCalendarId[calendarId]
}
