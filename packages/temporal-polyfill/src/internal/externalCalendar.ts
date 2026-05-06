import type { MonthCodeParts } from './calendarMonthCode'
import * as errorMessages from './errorMessages'
import type {
  CalendarDateFields,
  CalendarEraFields,
  CalendarYearMonthFields,
} from './fieldTypes'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export const isoCalendar = undefined
export const gregoryCalendar = 0 as const

// Calendar ids remain the public/storage shape. Dense internal paths use this
// compact discriminant so repeated calendar operations can branch on a tiny
// local value: undefined for ISO, a falsy sentinel for gregory, or an external
// calendar object for non-core implementations. The `isoCalendar` alias keeps
// callers from passing a bare `undefined` when they intentionally mean ISO.
export type InternalCalendar =
  | typeof isoCalendar
  | typeof gregoryCalendar
  | ExternalCalendar

export interface ExternalCalendar {
  id: string
  eraOrigins?: Record<string, number>
  eraRemaps?: Record<string, string>
  leapMonthMeta?: number
  plainMonthDayLeapMonthMaxDays?: Record<number, number>
  plainMonthDayCommonMonthMaxDay?: number
  monthDayReferenceYear?: number
  removeEraFieldsOnMonthDayReplace?: boolean

  computeYearFromEra?(
    eraYear: number,
    normalizedEra: string,
    eraOrigin: number,
  ): number
  constrainPlainMonthDay?(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): number | undefined
  computeDateFields(isoDate: CalendarDateFields): CalendarDateFields
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

// Lowercased user-supplied Temporal calendar IDs. The returned calendar's `id`
// is the normalized public/storage ID, so this is both the validation hook and
// the calendar-object lookup for non-core calendars.
export type ExternalCalendarProvider = (
  lowerRawCalendarId: string,
) => ExternalCalendar | undefined

const externalCalendarRegistryKey = Symbol.for(
  'temporal-polyfill.externalCalendarRegistry',
)

function getExternalCalendarProvider(): ExternalCalendarProvider | undefined {
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

export function resolveExternalCalendarId(
  lowerRawCalendarId: string,
): string | undefined {
  const provider = getExternalCalendarProvider()
  const calendar = provider && provider(lowerRawCalendarId)
  return calendar && calendar.id
}

export function getExternalCalendar(normCalendarId: string): ExternalCalendar {
  const provider = getExternalCalendarProvider()
  const calendar = provider && provider(normCalendarId)

  if (!calendar) {
    throwExternalCalendarError()
  }

  return calendar
}

export function throwExternalCalendarError(): never {
  throw new RangeError(errorMessages.externalCalendarRequired)
}

export function getInternalCalendar(normCalendarId: string): InternalCalendar {
  return normCalendarId === isoCalendarId
    ? isoCalendar
    : normCalendarId === gregoryCalendarId
      ? gregoryCalendar
      : getExternalCalendar(normCalendarId)
}

export function getInternalCalendarId(calendar: InternalCalendar): string {
  return calendar === isoCalendar
    ? isoCalendarId
    : calendar === gregoryCalendar
      ? gregoryCalendarId
      : calendar.id
}
