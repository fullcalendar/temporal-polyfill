import type { MonthCodeParts } from './calendarMonthCode'
import * as errorMessages from './errorMessages'
import type {
  CalendarDateFields,
  CalendarEraFields,
  CalendarYearMonthFields,
} from './fieldTypes'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export interface ExternalCalendar {
  id: string
  eraOrigins?: Record<string, number>
  eraRemaps?: Record<string, string>
  leapMonthMeta?: number
  plainMonthDayLeapMonthMaxDays?: Record<number, number>
  plainMonthDayCommonMonthMaxDay?: number
  monthDayReferenceYear?: number

  computeDateFields(isoDate: CalendarDateFields): CalendarDateFields
  computeDay(isoDate: CalendarDateFields): number
  computeIsoFieldsFromParts(
    year: number,
    month: number,
    day: number,
  ): CalendarDateFields
  computeEpochMilli(year: number, month?: number, day?: number): number
  computeMonthCodeParts(year: number, month: number): MonthCodeParts
  computeYearMonthFieldsForMonthDay(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): CalendarYearMonthFields | undefined
  computeInLeapYear(year: number): boolean
  computeMonthsInYear(year: number): number
  computeDaysInMonth(year: number, month: number): number
  computeDaysInYear(year: number): number
  computeLeapMonth(year: number): number | undefined
  computeEraFields(isoDate: CalendarDateFields): CalendarEraFields
  addMonths(
    year: number,
    month: number,
    monthDelta: number,
  ): CalendarYearMonthFields
  diffMonthSlots(
    year0: number,
    month0: number,
    year1: number,
    month1: number,
  ): number
  isConstrainedFinalIntercalaryMonthDiff(
    sign: number,
    year0: number,
    month0: number,
    day0: number,
    year1: number,
    month1: number,
    day1: number,
  ): boolean
}

export interface ExternalCalendarProvider {
  resolveCalendarId(id: string): string | undefined
  getCalendar(id: string): ExternalCalendar | undefined
}

const externalCalendarRegistryKey = Symbol.for(
  'temporal-polyfill.externalCalendarRegistry',
)

function queryExternalCalendarProvider(): ExternalCalendarProvider | undefined {
  const globalRecord = globalThis as unknown as Record<symbol, unknown>
  return globalRecord[externalCalendarRegistryKey] as
    | ExternalCalendarProvider
    | undefined
}

export function registerExternalCalendarProvider(
  provider: ExternalCalendarProvider,
): void {
  const globalRecord = globalThis as unknown as Record<symbol, unknown>
  globalRecord[externalCalendarRegistryKey] = provider
}

export function resolveExternalCalendarId(id: string): string | undefined {
  return queryExternalCalendarProvider()?.resolveCalendarId(id)
}

export function getExternalCalendar(id: string): ExternalCalendar {
  const calendar = queryExternalCalendarProvider()?.getCalendar(id)

  if (!calendar) {
    throwExternalCalendarError()
  }

  return calendar
}

export function throwExternalCalendarError(): never {
  throw new RangeError(errorMessages.externalCalendarRequired)
}

export function isCoreCalendarId(calendarId: string): boolean {
  return calendarId === isoCalendarId || calendarId === gregoryCalendarId
}
