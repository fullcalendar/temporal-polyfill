import { NativeDateModOps, NativeDateRefineOps, NativeDayOfYearOps, NativeDiffOps, NativeMonthDayModOps, NativeMonthDayRefineOps, NativeMoveOps, NativePartOps, NativeStandardOps, NativeYearMonthModOps, NativeYearMonthRefineOps, LeapMonthOp, DateParts, GetEraOrigins, GetLeapMonthMeta, MonthCodeParts, YearMonthParts, nativeDateRefineBase, nativeDiffBase, nativeMonthDayRefineBase, nativeMoveBase, nativeYearMonthRefineBase, EraParts, nativeStandardBase, NativeDaysInMonthOps, NativeInLeapYearOps, NativeDaysInYearOps, NativeMonthsInYearOps, computeInLeapYear, computeMonthsInYear, computeDaysInMonth, computeDaysInYear } from './calendarNative'
import { computeIsoDayOfYear, computeIsoDaysInMonth, computeIsoDaysInYear, computeIsoInLeapYear, computeIsoMonthsInYear, isoArgsToEpochMilli, isoEpochFirstLeapYear } from './isoMath'
import { IsoDateFields } from './isoFields'
import { computeIsoMonthsInYearSpan } from './diff'
import { isoMonthAdd } from './move'
import { noop } from './utils'
import { nativeMergeFields } from './bag'

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

// Refine
// -------------------------------------------------------------------------------------------------

const isoYearMonthRefineDeps = {
  leapMonth: noop as LeapMonthOp,
  monthsInYearPart: computeIsoMonthsInYear,
  isoFields: isoFields,
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

// Standard (Native-only)
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
  isoFields: isoFields,
  epochMilli: computeIsoEpochMilli,
  monthAdd: isoMonthAdd,
  getEraOrigins: noop as GetEraOrigins,
  getLeapMonthMeta: noop as GetLeapMonthMeta,
  year: computeIsoYear,
  month: computeIsoMonth,
  day: computeIsoDay,
}

// Parts & Stats (Native-only)
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

// -------------------------------------------------------------------------------------------------

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

function isoFields(year: number, month: number, day: number): IsoDateFields {
  return { isoYear: year, isoMonth: month, isoDay: day }
}

function computeIsoEpochMilli(year: number, month?: number, day?: number): number {
  const epochMilli = isoArgsToEpochMilli(year, month, day)
  if (epochMilli === undefined) { // YUCK!!!
    throw new RangeError('Out of range')
  }
  return epochMilli
}
