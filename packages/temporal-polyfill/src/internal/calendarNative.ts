import {
  nativeDateFromFields,
  nativeFieldsMethod,
  nativeMergeFields,
  nativeMonthDayFromFields,
  nativeYearMonthFromFields,
} from './bagRefine'
import {
  eraOriginsByCalendarId,
  isoCalendarId,
  leapMonthMetas,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import {
  DateRefineOps,
  DayOp,
  DiffOps,
  MergeFieldsOp,
  MonthDayRefineOps,
  MoveOps,
  YearMonthRefineOps,
} from './calendarOps'
import { nativeDateUntil } from './diff'
import * as errorMessages from './errorMessages'
import { IsoDateFields } from './isoFields'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from './isoMath'
import { nativeDateAdd } from './move'
import { padNumber2 } from './utils'

// Struct Types
export type DateParts = [year: number, month: number, day: number]
export type EraParts = [era: string | undefined, eraYear: number | undefined]
export type MonthCodeParts = [monthCodeNumber: number, isLeapMonth: boolean]
export type YearMonthParts = [year: number, month: number]
export type WeekParts = [weekOfYear: number, yearOfWeek: number]

// Function Types
// (Must always be called from a CalendarOps object)
export type DatePartsOp = (isoFields: IsoDateFields) => DateParts
export type EraOp = (isoFields: IsoDateFields) => string | undefined
export type EraYearOp = (isoFields: IsoDateFields) => number | undefined
export type EraPartsOp = (isoFields: IsoDateFields) => EraParts
export type MonthCodeOp = (isoFields: IsoDateFields) => string
export type MonthCodePartsOp = (year: number, month: number) => MonthCodeParts
export type YearMonthForMonthDayOp = (
  // receives positive monthCode integer
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
) => YearMonthParts | undefined
export type InLeapYearOp = (isoFields: IsoDateFields) => boolean
export type InLeapYearPartOp = (year: number) => boolean
export type LeapMonthOp = (year: number) => number | undefined
export type MonthsInYearOp = (isoDateFields: IsoDateFields) => number
export type MonthsInYearPartOp = (year: number) => number
export type MonthsInYearSpanOp = (
  yearDelta: number,
  yearStart: number,
) => number
export type DaysInMonthOp = (isoFields: IsoDateFields) => number
export type DaysInMonthPartsOp = (year: number, month: number) => number
export type DaysInYearOp = (isoFields: IsoDateFields) => number
export type DaysInYearPartOp = (year: number) => number
export type DayOfYearOp = (isoFields: IsoDateFields) => number
export type WeekOfYearOp = (isoFields: IsoDateFields) => number | undefined
export type YearOfWeekOp = (isoFields: IsoDateFields) => number | undefined
export type WeekPartsOp = (isoFields: IsoDateFields) => WeekParts | []
export type EpochMilliOp = (
  year: number,
  month?: number,
  day?: number,
) => number
export type IsoFieldsOp = (
  year: number,
  month: number,
  day: number,
) => IsoDateFields
export type MonthAddOp = (
  year: number,
  month: number,
  monthDelta: number,
) => YearMonthParts
export type GetEraOrigins = () => Record<string, number> | undefined
export type GetLeapMonthMeta = () => number | undefined

// Internal State
export interface NativeCalendar {
  id?: string // if not defined, then iso calendar
}

// Refine
// -----------------------------------------------------------------------------

export type NativeYearMonthRefineDeps = NativeCalendar & {
  leapMonth: LeapMonthOp
  monthsInYearPart: MonthsInYearPartOp
  isoFields: IsoFieldsOp
}

export type NativeDateRefineDeps = NativeYearMonthRefineDeps & {
  daysInMonthParts: DaysInMonthPartsOp
}

export type NativeMonthDayRefineDeps = NativeDateRefineDeps & {
  yearMonthForMonthDay: YearMonthForMonthDayOp
}

export type NativeYearMonthRefineOps = YearMonthRefineOps<string> &
  NativeYearMonthRefineDeps
export type NativeDateRefineOps = DateRefineOps<string> & NativeDateRefineDeps
export type NativeMonthDayRefineOps = MonthDayRefineOps<string> &
  NativeMonthDayRefineDeps

// Base

export const nativeYearMonthRefineBase: YearMonthRefineOps<string> = {
  yearMonthFromFields: nativeYearMonthFromFields,
  fields: nativeFieldsMethod,
}

export const nativeDateRefineBase: DateRefineOps<string> = {
  dateFromFields: nativeDateFromFields,
  fields: nativeFieldsMethod,
}

export const nativeMonthDayRefineBase: MonthDayRefineOps<string> = {
  monthDayFromFields: nativeMonthDayFromFields,
  fields: nativeFieldsMethod,
}

// Mod
// -----------------------------------------------------------------------------

export type NativeYearMonthModOps = NativeYearMonthRefineOps & {
  mergeFields: MergeFieldsOp
}
export type NativeDateModOps = NativeDateRefineOps & {
  mergeFields: MergeFieldsOp
}
export type NativeMonthDayModOps = NativeMonthDayRefineOps & {
  mergeFields: MergeFieldsOp
}

// Math
// -----------------------------------------------------------------------------

export interface NativeMoveOpsOnly {
  dateParts: DatePartsOp
  monthCodeParts: MonthCodePartsOp
  monthsInYearPart: MonthsInYearPartOp
  daysInMonthParts: DaysInMonthPartsOp
  monthAdd: MonthAddOp
  leapMonth: LeapMonthOp
  epochMilli: EpochMilliOp
}

export type NativeMoveOps = MoveOps & NativeMoveOpsOnly

export type NativeDiffOps = DiffOps &
  NativeMoveOpsOnly & {
    monthsInYearSpan: MonthsInYearSpanOp
  }

export type NativeYearMonthMoveOps = NativeMoveOps & { day: DayOp }
export type NativeYearMonthDiffOps = NativeDiffOps & { day: DayOp }

// Base

export const nativeMoveBase: MoveOps = {
  dateAdd: nativeDateAdd,
}

export const nativeDiffBase: DiffOps = {
  dateAdd: nativeDateAdd,
  dateUntil: nativeDateUntil,
}

// Parts & Stats
// -----------------------------------------------------------------------------

export interface NativeEraOps {
  era: EraOp
  eraParts: EraPartsOp
}

export interface NativeEraYearOps {
  eraYear: EraYearOp
  eraParts: EraPartsOp
}

export interface NativeMonthCodeOps {
  monthCode: MonthCodeOp
  monthCodeParts: MonthCodePartsOp
  dateParts: DatePartsOp
}

export interface NativePartOps {
  dateParts: DatePartsOp
  eraParts: EraPartsOp
  monthCodeParts: MonthCodePartsOp
}

export interface NativeInLeapYearOps {
  inLeapYear: InLeapYearOp
  dateParts: DatePartsOp
  inLeapYearPart: InLeapYearPartOp
}

export interface NativeMonthsInYearOps {
  monthsInYear: MonthsInYearOp
  dateParts: DatePartsOp
  monthsInYearPart: MonthsInYearPartOp
}

export interface NativeDaysInMonthOps {
  daysInMonth: DaysInMonthOp
  dateParts: DatePartsOp
  daysInMonthParts: DaysInMonthPartsOp
}

export interface NativeDaysInYearOps {
  daysInYear: DaysInYearOp
  dateParts: DatePartsOp
  daysInYearPart: DaysInYearPartOp
}

export interface NativeDayOfYearOps {
  dayOfYear: DayOfYearOp
}

export interface NativeWeekOps {
  weekOfYear: WeekOfYearOp
  yearOfWeek: YearOfWeekOp
  weekParts: WeekPartsOp
}

export function computeNativeWeekOfYear(
  this: NativeWeekOps,
  isoFields: IsoDateFields,
): number | undefined {
  return this.weekParts(isoFields)[0]
}

export function computeNativeYearOfWeek(
  this: NativeWeekOps,
  isoFields: IsoDateFields,
): number | undefined {
  return this.weekParts(isoFields)[1]
}

// String Parsing
// -----------------------------------------------------------------------------

export interface NativeYearMonthParseOps {
  day: DayOp
}

export interface NativeMonthDayParseOps {
  dateParts: DatePartsOp
  monthCodeParts: MonthCodePartsOp
  yearMonthForMonthDay: YearMonthForMonthDayOp
  isoFields: IsoFieldsOp
}

// Standard
// -----------------------------------------------------------------------------

export type NativeStandardOps = NativeYearMonthRefineOps &
  NativeDateRefineOps &
  NativeMonthDayRefineOps &
  NativeMoveOps &
  NativeDiffOps &
  NativeYearMonthModOps &
  NativeYearMonthDiffOps &
  NativeInLeapYearOps &
  NativeMonthsInYearOps &
  NativeDaysInMonthOps &
  NativeDaysInYearOps &
  NativeDayOfYearOps &
  NativeEraOps &
  NativeEraYearOps &
  NativeMonthCodeOps &
  NativePartOps &
  NativeYearMonthParseOps &
  NativeMonthDayParseOps &
  NativeWeekOps & {
    mergeFields: MergeFieldsOp // for 'mod' ops

    dayOfWeek(isoFields: IsoDateFields): number
    daysInWeek(isoFields: IsoDateFields): number

    year(isoFields: IsoDateFields): number
    month(isoFields: IsoDateFields): number
    day(isoFields: IsoDateFields): number
  }

export const nativeStandardBase = {
  dateAdd: nativeDateAdd,
  dateUntil: nativeDateUntil,
  dateFromFields: nativeDateFromFields,
  yearMonthFromFields: nativeYearMonthFromFields,
  monthDayFromFields: nativeMonthDayFromFields,
  fields: nativeFieldsMethod,
  mergeFields: nativeMergeFields,

  inLeapYear: computeNativeInLeapYear,
  monthsInYear: computeNativeMonthsInYear,
  daysInMonth: computeNativeDaysInMonth,
  daysInYear: computeNativeDaysInYear,
  era: computeNativeEra,
  eraYear: computeNativeEraYear,
  monthCode: computeNativeMonthCode,

  dayOfWeek: computeIsoDayOfWeek,
  daysInWeek: computeIsoDaysInWeek,
}

// 'Super' methods that all native implementations use
// -----------------------------------------------------------------------------

export function computeNativeInLeapYear(
  this: NativeInLeapYearOps,
  isoFields: IsoDateFields,
): boolean {
  const [year] = this.dateParts(isoFields)
  return this.inLeapYearPart(year)
}

export function computeNativeMonthsInYear(
  this: NativeMonthsInYearOps,
  isoFields: IsoDateFields,
): number {
  const [year] = this.dateParts(isoFields)
  return this.monthsInYearPart(year)
}

export function computeNativeDaysInMonth(
  this: NativeDaysInMonthOps,
  isoFields: IsoDateFields,
): number {
  const [year, month] = this.dateParts(isoFields)
  return this.daysInMonthParts(year, month)
}

export function computeNativeDaysInYear(
  this: NativeDaysInYearOps,
  isoFields: IsoDateFields,
): number {
  const [year] = this.dateParts(isoFields)
  return this.daysInYearPart(year)
}

export function computeNativeEra(
  this: NativeEraOps,
  isoFields: IsoDateFields,
): string | undefined {
  return this.eraParts(isoFields)[0]
}

export function computeNativeEraYear(
  this: NativeEraYearOps,
  isoFields: IsoDateFields,
): number | undefined {
  return this.eraParts(isoFields)[1]
}

export function computeNativeMonthCode(
  this: NativeMonthCodeOps,
  isoFields: IsoDateFields,
): string {
  const [year, month] = this.dateParts(isoFields)
  const [monthCodeNumber, isLeapMonth] = this.monthCodeParts(year, month)
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}

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
