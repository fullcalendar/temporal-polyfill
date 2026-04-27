import {
  eraOriginsByCalendarId,
  isoCalendarId,
  leapMonthMetas,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import * as errorMessages from './errorMessages'
import { padNumber2 } from './utils'

// Struct Types
export type DateParts = [year: number, month: number, day: number]
export type EraParts = [era: string | undefined, eraYear: number | undefined]
export type MonthCodeParts = [monthCodeNumber: number, isLeapMonth: boolean]
export type YearMonthParts = [year: number, month: number]
export type WeekParts = [
  weekOfYear: number | undefined,
  yearOfWeek: number | undefined,
  weeksInYear: number | undefined,
]

// Internal State
export interface NativeCalendar {
  id?: string // if not defined, then iso calendar
}

// String Parsing
// -----------------------------------------------------------------------------

// Month Code Utils
// -----------------------------------------------------------------------------

const monthCodeRegExp = /^M(\d{2})(L?)$/

export function parseMonthCode(
  monthCode: string,
): [monthCodeNumber: number, isLeapMonth: boolean] {
  const m = monthCodeRegExp.exec(monthCode)
  if (!m) {
    throw new RangeError(errorMessages.invalidMonthCode(monthCode))
  }

  return [
    parseInt(m[1]), // monthCodeNumber
    Boolean(m[2]),
  ]
}

export function formatMonthCode(
  monthCodeNumber: number,
  isLeapMonth: boolean,
): string {
  return 'M' + padNumber2(monthCodeNumber) + (isLeapMonth ? 'L' : '')
}

export function monthCodeNumberToMonth(
  monthCodeNumber: number,
  isLeapMonth: boolean | undefined,
  leapMonth: number | undefined,
): number {
  return (
    monthCodeNumber +
    (isLeapMonth || (leapMonth && monthCodeNumber >= leapMonth) ? 1 : 0)
  )
}

export function monthToMonthCodeNumber(
  month: number,
  leapMonth?: number,
): number {
  return month - (leapMonth && month >= leapMonth ? 1 : 0)
}

// Utils
// -----------------------------------------------------------------------------

export function eraYearToYear(eraYear: number, eraOrigin: number): number {
  // see the origin format in calendarConfig
  // ||0 protects against -0
  return (eraOrigin + eraYear) * (Math.sign(eraOrigin) || 1) || 0
}

export function getCalendarEraOrigins(
  native: NativeCalendar,
): Record<string, number> | undefined {
  return eraOriginsByCalendarId[getCalendarIdBase(native)]
}

export function getCalendarLeapMonthMeta(
  native: NativeCalendar,
): number | undefined {
  return leapMonthMetas[getCalendarIdBase(native)]
}

function getCalendarIdBase(native: NativeCalendar): string {
  return computeCalendarIdBase(native.id || isoCalendarId)
}
