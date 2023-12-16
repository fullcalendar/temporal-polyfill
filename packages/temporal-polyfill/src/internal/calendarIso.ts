import { NativeDateModOps, NativeDateRefineOps, NativeDayOfYearOps, NativeDiffOps, NativeMonthDayModOps, NativeMonthDayRefineOps, NativeMoveOps, NativePartOps, NativeStandardOps, NativeYearMonthModOps, NativeYearMonthRefineOps, LeapMonthOp, DateParts, GetEraOrigins, GetLeapMonthMeta, MonthCodeParts, YearMonthParts, nativeDateRefineBase, nativeDiffBase, nativeMonthDayRefineBase, nativeMoveBase, nativeYearMonthRefineBase, EraParts, nativeStandardBase, NativeDaysInMonthOps, NativeInLeapYearOps, NativeDaysInYearOps, NativeMonthsInYearOps, computeInLeapYear, computeMonthsInYear, computeDaysInMonth, computeDaysInYear, NativeYearMonthMoveOps, NativeYearMonthDiffOps, NativeYearMonthParseOps, NativeMonthDayParseOps } from './calendarNative'
import { isoArgsToEpochMilli, isoToEpochMilli, isoToLegacyDate } from './epochAndTime'
import { IsoDateFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { computeIsoMonthsInYearSpan, diffEpochMilliByDay } from './diff'
import { isoMonthAdd } from './move'
import { modFloor, noop } from './utils'
import { nativeMergeFields } from './bagNative'

// Refine
// -------------------------------------------------------------------------------------------------

const isoYearMonthRefineDeps = {
  leapMonth: noop as LeapMonthOp,
  monthsInYearPart: computeIsoMonthsInYear,
  isoFields: computeIsoFieldsFromParts,
  getEraOrigins: noop as GetEraOrigins,
  getLeapMonthMeta: noop as GetLeapMonthMeta,
}

const isoDateRefineDeps = {
  ...isoYearMonthRefineDeps,
  daysInMonthParts: computeIsoDaysInMonth,
}

const isoMonthDayRefineDeps = {
  ...isoDateRefineDeps,
  yearMonthForMonthDay: computeIsoYearMonthForMonthDay,
}

export const isoYearMonthRefineOps: NativeYearMonthRefineOps = {
  ...nativeYearMonthRefineBase,
  ...isoYearMonthRefineDeps,
}

export const isoDateRefineOps: NativeDateRefineOps = {
  ...nativeDateRefineBase,
  ...isoMonthDayRefineDeps,
}

export const isoMonthDayRefineOps: NativeMonthDayRefineOps = {
  ...nativeMonthDayRefineBase,
  ...isoMonthDayRefineDeps,
}

// Mod
// -------------------------------------------------------------------------------------------------

export const isoYearMonthModOps: NativeYearMonthModOps = {
  ...isoYearMonthRefineOps,
  mergeFields: nativeMergeFields,
}

export const isoDateModOps: NativeDateModOps = {
  ...isoDateRefineOps,
  mergeFields: nativeMergeFields,
}

export const isoMonthDayModOps: NativeMonthDayModOps = {
  ...isoMonthDayRefineOps,
  mergeFields: nativeMergeFields,
}

// Math
// -------------------------------------------------------------------------------------------------

const isoMathOps = {
  dateParts: computeIsoDateParts,
  monthCodeParts: computeIsoMonthCodeParts,
  monthsInYearPart: computeIsoMonthsInYear,
  daysInMonthParts: computeIsoDaysInMonth,
  monthAdd: isoMonthAdd,
}

export const isoMoveOps: NativeMoveOps = {
  ...nativeMoveBase,
  ...isoMathOps,
  leapMonth: noop as LeapMonthOp,
  epochMilli: computeIsoEpochMilli,
}

export const isoDiffOps: NativeDiffOps = {
  ...nativeDiffBase,
  ...isoMathOps,
  monthsInYearSpan: computeIsoMonthsInYearSpan,
}

export const isoYearMonthMoveOps: NativeYearMonthMoveOps = {
  ...isoMoveOps,
  day: computeIsoDay,
}

export const isoYearMonthDiffOps: NativeYearMonthDiffOps = {
  ...isoDiffOps,
  day: computeIsoDay,
}

// Parts & Stats
// -------------------------------------------------------------------------------------------------

export const isoPartOps: NativePartOps = {
  dateParts: computeIsoDateParts,
  eraParts: computeIsoEraParts,
  monthCodeParts: computeIsoMonthCodeParts,
}

export const isoInLeapYearOps: NativeInLeapYearOps = {
  inLeapYear: computeInLeapYear,
  dateParts: computeIsoDateParts,
  inLeapYearPart: computeIsoInLeapYear,
}

export const isoMonthsInYearOps: NativeMonthsInYearOps = {
  monthsInYear: computeMonthsInYear,
  dateParts: computeIsoDateParts,
  monthsInYearPart: computeIsoMonthsInYear,
}

export const isoDaysInMonthOps: NativeDaysInMonthOps = {
  daysInMonth: computeDaysInMonth,
  dateParts: computeIsoDateParts,
  daysInMonthParts: computeIsoDaysInMonth,
}

export const isoDaysInYearOps: NativeDaysInYearOps = {
  daysInYear: computeDaysInYear,
  dateParts: computeIsoDateParts,
  daysInYearPart: computeIsoDaysInYear,
}

export const isoDayOfYearOps: NativeDayOfYearOps = {
  dayOfYear: computeIsoDayOfYear,
}

// String Parsing
// -------------------------------------------------------------------------------------------------

export const isoYearMonthParseOps: NativeYearMonthParseOps = {
  day: computeIsoDay,
}

export const isoMonthDayParseOps: NativeMonthDayParseOps = {
  dateParts: computeIsoDateParts,
  monthCodeParts: computeIsoMonthCodeParts,
  yearMonthForMonthDay: computeIsoYearMonthForMonthDay,
  isoFields: computeIsoFieldsFromParts,
}

// Standard
// -------------------------------------------------------------------------------------------------

export const isoStandardOps: NativeStandardOps = {
  ...nativeStandardBase,
  dateParts: computeIsoDateParts,
  eraParts: computeIsoEraParts,
  monthCodeParts: computeIsoMonthCodeParts,
  yearMonthForMonthDay: computeIsoYearMonthForMonthDay,
  inLeapYearPart: computeIsoInLeapYear,
  leapMonth: noop as LeapMonthOp,
  monthsInYearPart: computeIsoMonthsInYear,
  monthsInYearSpan: computeIsoMonthsInYearSpan,
  daysInMonthParts: computeIsoDaysInMonth,
  daysInYearPart: computeIsoDaysInYear,
  dayOfYear: computeIsoDayOfYear,
  isoFields: computeIsoFieldsFromParts,
  epochMilli: computeIsoEpochMilli,
  monthAdd: isoMonthAdd,
  getEraOrigins: noop as GetEraOrigins,
  getLeapMonthMeta: noop as GetLeapMonthMeta,
  year: computeIsoYear,
  month: computeIsoMonth,
  day: computeIsoDay,
}

// -------------------------------------------------------------------------------------------------

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12
export const isoDaysInWeek = 7

function computeIsoYear(isoFields: IsoDateFields): number {
  return isoFields.isoYear
}

function computeIsoMonth(isoFields: IsoDateFields): number {
  return isoFields.isoMonth
}

function computeIsoDay(isoFields: IsoDateFields): number {
  return isoFields.isoDay
}

function computeIsoEraParts(): EraParts {
  return [undefined, undefined]
}

function computeIsoDateParts(isoFields: IsoDateFields): DateParts {
  return [isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay]
}

function computeIsoMonthCodeParts(isoYear: number, isoMonth: number): MonthCodeParts {
  return [isoMonth, false]
}

export function computeIsoYearMonthForMonthDay(monthCodeNumber: number): YearMonthParts {
  return [isoEpochFirstLeapYear, monthCodeNumber]
}

function computeIsoFieldsFromParts(year: number, month: number, day: number): IsoDateFields {
  return { isoYear: year, isoMonth: month, isoDay: day }
}

function computeIsoEpochMilli(year: number, month?: number, day?: number): number {
  const epochMilli = isoArgsToEpochMilli(year, month, day)
  if (epochMilli === undefined) { // YUCK!!!
    throw new RangeError('Out of range')
  }
  return epochMilli
}

export function computeIsoDaysInWeek(isoDateFields: IsoDateFields) {
  return isoDaysInWeek
}

export function computeIsoMonthsInYear(isoYear: number): number { // for methods
  return isoMonthsInYear
}

export function computeIsoDaysInMonth(isoYear: number, isoMonth: number): number {
  switch (isoMonth) {
    case 2:
      return computeIsoInLeapYear(isoYear) ? 29 : 28
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
  }
  return 31
}

function computeIsoDaysInYear(isoYear: number): number {
  return computeIsoInLeapYear(isoYear) ? 366 : 365
}

function computeIsoInLeapYear(isoYear: number): boolean {
  // % is dangerous, but comparing 0 with -0 is fine
  return isoYear % 4 === 0 && (isoYear % 100 !== 0 || isoYear % 400 === 0)
}

function computeIsoDayOfYear(isoDateFields: IsoDateFields): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(isoDateYearStart(isoDateFields))!,
    isoToEpochMilli(isoDateFields)!,
  ) + 1
}

export function computeIsoDayOfWeek(isoDateFields: IsoDateFields): number {
  const [legacyDate, nudge] = isoToLegacyDate(
    isoDateFields.isoYear,
    isoDateFields.isoMonth,
    isoDateFields.isoDay,
  )

  return modFloor(legacyDate.getDay() + 1 - nudge, 7) || 7
}

export function computeIsoYearOfWeek(isoDateFields: IsoDateFields): number {
  return computeIsoWeekParts(isoDateFields)[0]
}

export function computeIsoWeekOfYear(isoDateFields: IsoDateFields): number {
  return computeIsoWeekParts(isoDateFields)[1]
}

type WeekParts = [
  isoYear: number,
  isoWeek: number,
]

function computeIsoWeekParts(isoDateFields: IsoDateFields): WeekParts {
  const doy = computeIsoDayOfYear(isoDateFields)
  const dow = computeIsoDayOfWeek(isoDateFields)
  const doj = computeIsoDayOfWeek(isoDateYearStart(isoDateFields))
  const isoWeek = Math.floor((doy - dow + 10) / isoDaysInWeek)
  const { isoYear } = isoDateFields

  if (isoWeek < 1) {
    return [
      isoYear - 1,
      (doj === 5 || (doj === 6 && computeIsoInLeapYear(isoYear - 1))) ? 53 : 52,
    ]
  }
  if (isoWeek === 53) {
    if (computeIsoDaysInYear(isoYear) - doy < 4 - dow) {
      return [
        isoYear + 1,
        1,
      ]
    }
  }

  return [isoYear, isoWeek]
}

function isoDateYearStart(isoDateFields: IsoDateFields): IsoDateFields {
  return {
    ...isoDateFields,
    isoMonth: 1,
    isoDay: 1,
    ...isoTimeFieldDefaults, // needed?
  }
}
