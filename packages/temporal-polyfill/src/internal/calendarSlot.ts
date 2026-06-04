import type { MonthCodeParts } from './calendarMonthCode'
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
export type CalendarSlot =
  | typeof isoCalendar
  | typeof gregoryCalendar
  | ExoticCalendar

export interface ExoticCalendar {
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
}

export function getCalendarSlotId(calendar: CalendarSlot): string {
  return calendar === isoCalendar
    ? isoCalendarId
    : calendar === gregoryCalendar
      ? gregoryCalendarId
      : calendar.id
}
