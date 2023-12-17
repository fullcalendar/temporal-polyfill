import { nativeMergeFields } from './bagNative'
import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import { computeGregoryEraParts, getGregoryEraOrigins } from './calendarGregory'
import { computeIntlDateParts, computeIntlDay, computeIntlDayOfYear, computeIntlDaysInMonth, computeIntlDaysInYear, computeIntlEpochMilli, computeIntlEraParts, computeIntlInLeapYear, computeIntlLeapMonth, computeIntlMonth, computeIntlMonthCodeParts, computeIntlMonthsInYear, computeIntlYear, computeIntlYearMonthForMonthDay, computeIsoFieldsFromIntlParts, createCalendarIntlOps, getIntlEraOrigins, getIntlLeapMonthMeta } from './calendarIntl'
import { computeIsoDateParts, computeIsoDay, computeIsoDayOfYear, computeIsoDaysInMonth, computeIsoDaysInYear, computeIsoEpochMilli, computeIsoEraParts, computeIsoFieldsFromParts, computeIsoInLeapYear, computeIsoMonth, computeIsoMonthCodeParts, computeIsoMonthsInYear, computeIsoYear, computeIsoYearMonthForMonthDay } from './calendarIso'
import { GetEraOrigins, GetLeapMonthMeta, LeapMonthOp, NativeDateModOps, NativeDateRefineOps, NativeDayOfYearOps, NativeDaysInMonthOps, NativeDaysInYearOps, NativeDiffOps, NativeEraOps, NativeEraYearOps, NativeInLeapYearOps, NativeMonthCodeOps, NativeMonthDayModOps, NativeMonthDayParseOps, NativeMonthDayRefineOps, NativeMonthsInYearOps, NativeMoveOps, NativePartOps, NativeStandardOps, NativeYearMonthDiffOps, NativeYearMonthModOps, NativeYearMonthMoveOps, NativeYearMonthParseOps, NativeYearMonthRefineOps, computeDaysInMonth, computeDaysInYear, computeEra, computeEraYear, computeInLeapYear, computeMonthCode, computeMonthsInYear, nativeDateRefineBase, nativeDiffBase, nativeMonthDayRefineBase, nativeMoveBase, nativeStandardBase, nativeYearMonthRefineBase } from './calendarNative'
import { computeIntlMonthsInYearSpan, computeIsoMonthsInYearSpan } from './diff'
import { intlMonthAdd, isoMonthAdd } from './move'
import { noop } from './utils'

// ISO
// -------------------------------------------------------------------------------------------------

// Refine
// ------

const isoYearMonthRefineDeps = {
  id: isoCalendarId,
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
// ---

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
// ----

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
// -------------

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
// --------------

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
// --------

export const isoStandardOps: NativeStandardOps = {
  ...nativeStandardBase,
  id: isoCalendarId,
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

// Gregory
// -------------------------------------------------------------------------------------------------

export const gregoryPartOps: NativePartOps = {
  ...isoPartOps,
  eraParts: computeGregoryEraParts,
}

export const gregoryYearMonthRefineOps: NativeYearMonthRefineOps = {
  ...isoYearMonthRefineOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryDateRefineOps: NativeDateRefineOps = {
  ...isoDateRefineOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryMonthDayRefineOps: NativeMonthDayRefineOps = {
  ...isoMonthDayRefineOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryYearMonthModOps: NativeYearMonthModOps = {
  ...isoYearMonthModOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryDateModOps: NativeDateModOps = {
  ...isoDateModOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryMonthDayModOps: NativeMonthDayModOps = {
  ...isoMonthDayModOps,
  id: gregoryCalendarId,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryStandardOps: NativeStandardOps = {
  ...isoStandardOps,
  id: gregoryCalendarId,
  eraParts: computeGregoryEraParts,
  getEraOrigins: getGregoryEraOrigins,
}

// Intl
// -------------------------------------------------------------------------------------------------

// Refine
// ------

const intlYearMonthRefineDeps = {
  leapMonth: computeIntlLeapMonth,
  monthsInYearPart: computeIntlMonthsInYear,
  isoFields: computeIsoFieldsFromIntlParts,
  getEraOrigins: getIntlEraOrigins,
  getLeapMonthMeta: getIntlLeapMonthMeta,
}

const intlDateRefineDeps = {
  ...intlYearMonthRefineDeps,
  daysInMonthParts: computeIntlDaysInMonth,
}

const intlMonthDayRefineDeps = {
  ...intlDateRefineDeps,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
}

export const intlYearMonthRefineOps: Omit<NativeYearMonthRefineOps, 'id'> = {
  ...nativeYearMonthRefineBase,
  ...intlYearMonthRefineDeps,
}

export const intlDateRefineOps: Omit<NativeDateRefineOps, 'id'> = {
  ...nativeDateRefineBase,
  ...intlDateRefineDeps,
}

export const intlMonthDayRefineOps: Omit<NativeMonthDayRefineOps, 'id'> = {
  ...nativeMonthDayRefineBase,
  ...intlMonthDayRefineDeps,
}

// Mod
// ---

export const intlYearMonthModOps: Omit<NativeYearMonthModOps, 'id'> = {
  ...intlYearMonthRefineOps,
  mergeFields: nativeMergeFields,
}

export const intlDateModOps: Omit<NativeDateModOps, 'id'> = {
  ...intlDateRefineOps,
  mergeFields: nativeMergeFields,
}

export const intlMonthDayModOps: Omit<NativeMonthDayModOps, 'id'> = {
  ...intlMonthDayRefineOps,
  mergeFields: nativeMergeFields,
}

// Math
// ----

const intlMathOps = {
  dateParts: computeIntlDateParts,
  monthCodeParts: computeIntlMonthCodeParts,
  monthsInYearPart: computeIntlMonthsInYear,
  daysInMonthParts: computeIntlDaysInMonth,
  monthAdd: intlMonthAdd,
}

export const intlMoveOps: NativeMoveOps = {
  ...nativeMoveBase,
  ...intlMathOps,
  leapMonth: computeIntlLeapMonth,
  epochMilli: computeIntlEpochMilli,
}

export const intlDiffOps: NativeDiffOps = {
  ...nativeDiffBase,
  ...intlMathOps,
  monthsInYearSpan: computeIntlMonthsInYearSpan,
}

export const intlYearMonthMoveOps: NativeYearMonthMoveOps = {
  ...intlMoveOps,
  day: computeIntlDay,
}

export const intlYearMonthDiffOps: NativeYearMonthDiffOps = {
  ...intlDiffOps,
  day: computeIntlDay,
}

// Parts & Stats
// -------------

export const intlInLeapYearOps: NativeInLeapYearOps = {
  inLeapYear: computeInLeapYear,
  dateParts: computeIntlDateParts,
  inLeapYearPart: computeIntlInLeapYear,
}

export const intlMonthsInYearOps: NativeMonthsInYearOps = {
  monthsInYear: computeMonthsInYear,
  dateParts: computeIntlDateParts,
  monthsInYearPart: computeIntlMonthsInYear,
}

export const intlDaysInMonthOps: NativeDaysInMonthOps = {
  daysInMonth: computeDaysInMonth,
  dateParts: computeIntlDateParts,
  daysInMonthParts: computeIntlDaysInMonth,
}

export const intlDaysInYearOps: NativeDaysInYearOps = {
  daysInYear: computeDaysInYear,
  dateParts: computeIntlDateParts,
  daysInYearPart: computeIntlDaysInYear,
}

export const intlDayOfYearOps: NativeDayOfYearOps = {
  dayOfYear: computeIntlDayOfYear,
}

export const intlEraOps: NativeEraOps = {
  era: computeEra,
  eraParts: computeIntlEraParts,
}

export const intlEraYearOps: NativeEraYearOps = {
  eraYear: computeEraYear,
  eraParts: computeIntlEraParts,
}

export const intlMonthCodeOps: NativeMonthCodeOps = {
  monthCode: computeMonthCode,
  monthCodeParts: computeIntlMonthCodeParts,
  dateParts: computeIntlDateParts,
}

export const intlPartOps: NativePartOps = {
  dateParts: computeIntlDateParts,
  eraParts: computeIntlEraParts,
  monthCodeParts: computeIntlMonthCodeParts,
}

// String Parsing
// --------------

export const intlYearMonthParseOps: NativeYearMonthParseOps = {
  day: computeIntlDay,
}

export const intlMonthDayParseOps: NativeMonthDayParseOps = {
  dateParts: computeIntlDateParts,
  monthCodeParts: computeIntlMonthCodeParts,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
  isoFields: computeIsoFieldsFromIntlParts,
}

// Standard
// --------

export const intlStandardOps: Omit<NativeStandardOps, 'id'> = {
  ...nativeStandardBase,
  dateParts: computeIntlDateParts,
  eraParts: computeIntlEraParts,
  monthCodeParts: computeIntlMonthCodeParts,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
  inLeapYearPart: computeIntlInLeapYear,
  leapMonth: computeIntlLeapMonth,
  monthsInYearPart: computeIntlMonthsInYear,
  monthsInYearSpan: computeIntlMonthsInYearSpan,
  daysInMonthParts: computeIntlDaysInMonth,
  daysInYearPart: computeIntlDaysInYear,
  dayOfYear: computeIntlDayOfYear,
  isoFields: computeIsoFieldsFromIntlParts,
  epochMilli: computeIntlEpochMilli,
  monthAdd: intlMonthAdd,
  getEraOrigins: getIntlEraOrigins,
  getLeapMonthMeta: getIntlLeapMonthMeta,
  year: computeIntlYear,
  month: computeIntlMonth,
  day: computeIntlDay,
}

// -------------------------------------------------------------------------------------------------

/*
All functions expect realized/normalized calendarId
*/

// Refine
export const createNativeYearMonthRefineOps = createNativeOpsCreator(isoYearMonthRefineOps, intlYearMonthRefineOps, gregoryYearMonthRefineOps)
export const createNativeDateRefineOps = createNativeOpsCreator(isoDateRefineOps, intlDateRefineOps, gregoryDateRefineOps)
export const createNativeMonthDayRefineOps = createNativeOpsCreator(isoMonthDayRefineOps, intlMonthDayRefineOps, gregoryMonthDayRefineOps)

// Mod
export const createNativeYearMonthModOps = createNativeOpsCreator(isoYearMonthModOps, intlYearMonthModOps, gregoryYearMonthModOps)
export const createNativeDateModOps = createNativeOpsCreator(isoDateModOps, intlDateModOps, gregoryDateModOps)
export const createNativeMonthDayModOps = createNativeOpsCreator(isoMonthDayModOps, intlMonthDayModOps, gregoryMonthDayModOps)

// Math
export const createNativeMoveOps = createNativeOpsCreator(isoMoveOps, intlMoveOps)
export const createNativeDiffOps = createNativeOpsCreator(isoDiffOps, intlDiffOps)
export const createNativeYearMonthMoveOps = createNativeOpsCreator(isoYearMonthMoveOps, intlYearMonthMoveOps)
export const createNativeYearMonthDiffOps = createNativeOpsCreator(isoYearMonthDiffOps, intlYearMonthDiffOps)

// Parts & Stats
export const createNativeInLeapYearOps = createNativeOpsCreator(isoInLeapYearOps, intlInLeapYearOps)
export const createNativeMonthsInYearOps = createNativeOpsCreator(isoMonthsInYearOps, intlMonthsInYearOps)
export const createNativeDaysInMonthOps = createNativeOpsCreator(isoDaysInMonthOps, intlDaysInMonthOps)
export const createNativeDaysInYearOps = createNativeOpsCreator(isoDaysInYearOps, intlDaysInYearOps)
export const createNativeDayOfYearOps = createNativeOpsCreator(isoDayOfYearOps, intlDayOfYearOps)
export const createNativePartOps = createNativeOpsCreator(isoPartOps, intlPartOps, gregoryPartOps)

// String Parsing
export const createNativeYearMonthParseOps = createNativeOpsCreator(isoYearMonthParseOps, intlYearMonthParseOps)
export const createNativeMonthDayParseOps = createNativeOpsCreator(isoMonthDayParseOps, intlMonthDayParseOps)

// Standard
export const createNativeStandardOps = createNativeOpsCreator(isoStandardOps, intlStandardOps, gregoryStandardOps)

function createNativeOpsCreator<O extends {}>(
  isoOps: O,
  intlOps: O,
  gregoryOps?: O,
): (
  (calendarId: string) => O
) {
  return (calendarId) => {
    if (calendarId === isoCalendarId) {
      return isoOps
    } else if (calendarId === gregoryCalendarId) {
      return gregoryOps || isoOps
    }
    return createCalendarIntlOps(calendarId, intlOps)
  }
}
