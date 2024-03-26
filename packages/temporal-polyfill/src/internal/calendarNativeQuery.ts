import {
  nativeDateFromFields,
  nativeFieldsMethod,
  nativeMergeFields,
  nativeMonthDayFromFields,
  nativeYearMonthFromFields,
} from './bagRefine'
import {
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId,
} from './calendarConfig'
import {
  EpochMilliOp,
  LeapMonthOp,
  NativeCalendar,
  NativeConvertOps,
  NativeDateModOps,
  NativeDateRefineOps,
  NativeDayOfYearOps,
  NativeDaysInMonthOps,
  NativeDaysInYearOps,
  NativeDiffOps,
  NativeInLeapYearOps,
  NativeMonthDayModOps,
  NativeMonthDayParseOps,
  NativeMonthDayRefineOps,
  NativeMonthsInYearOps,
  NativeMoveOps,
  NativeMoveOpsOnly,
  NativePartOps,
  NativeStandardOps,
  NativeWeekOps,
  NativeYearMonthDiffOps,
  NativeYearMonthModOps,
  NativeYearMonthMoveOps,
  NativeYearMonthParseOps,
  NativeYearMonthRefineOps,
  WeekParts,
  computeNativeDaysInMonth,
  computeNativeDaysInYear,
  computeNativeEra,
  computeNativeEraYear,
  computeNativeInLeapYear,
  computeNativeMonthCode,
  computeNativeMonthsInYear,
  computeNativeWeekOfYear,
  computeNativeYearOfWeek,
} from './calendarNative'
import {
  DateRefineOps,
  DiffOps,
  MonthDayRefineOps,
  MoveOps,
  YearMonthRefineOps,
} from './calendarOps'
import {
  computeIntlMonthsInYearSpan,
  computeIsoMonthsInYearSpan,
  nativeDateUntil,
} from './diff'
import {
  computeIntlDateParts,
  computeIntlDay,
  computeIntlDayOfYear,
  computeIntlDaysInMonth,
  computeIntlDaysInYear,
  computeIntlEpochMilli,
  computeIntlEraParts,
  computeIntlInLeapYear,
  computeIntlLeapMonth,
  computeIntlMonth,
  computeIntlMonthCodeParts,
  computeIntlMonthsInYear,
  computeIntlYear,
  computeIntlYearMonthForMonthDay,
  computeIsoFieldsFromIntlParts,
  queryIntlCalendar,
} from './intlMath'
import {
  computeIsoDateParts,
  computeIsoDay,
  computeIsoDayOfWeek,
  computeIsoDayOfYear,
  computeIsoDaysInMonth,
  computeIsoDaysInWeek,
  computeIsoDaysInYear,
  computeIsoEraParts,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonth,
  computeIsoMonthCodeParts,
  computeIsoMonthsInYear,
  computeIsoWeekParts,
  computeIsoYear,
  computeIsoYearMonthForMonthDay,
} from './isoMath'
import { intlMonthAdd, isoMonthAdd, nativeDateAdd } from './move'
import { isoArgsToEpochMilli } from './timeMath'
import { noop } from './utils'

// Common
// -----------------------------------------------------------------------------

const nativeYearMonthRefineBase: YearMonthRefineOps<string> = {
  yearMonthFromFields: nativeYearMonthFromFields,
  fields: nativeFieldsMethod,
}

const nativeDateRefineBase: DateRefineOps<string> = {
  dateFromFields: nativeDateFromFields,
  fields: nativeFieldsMethod,
}

const nativeMonthDayRefineBase: MonthDayRefineOps<string> = {
  monthDayFromFields: nativeMonthDayFromFields,
  fields: nativeFieldsMethod,
}

const nativeMoveBase: MoveOps = {
  dateAdd: nativeDateAdd,
}

const nativeDiffBase: DiffOps = {
  dateAdd: nativeDateAdd,
  dateUntil: nativeDateUntil,
}

const nativeStandardBase = {
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

// ISO
// -----------------------------------------------------------------------------

// Refine
// ------

const isoYearMonthRefineDeps = {
  leapMonth: noop as LeapMonthOp,
  monthsInYearPart: computeIsoMonthsInYear,
  isoFields: computeIsoFieldsFromParts,
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

const isoConvertOps: NativeConvertOps = {
  dateParts: computeIsoDateParts,
  epochMilli: isoArgsToEpochMilli as EpochMilliOp,
  monthAdd: isoMonthAdd,
}

const isoMoveOpsOnly: NativeMoveOpsOnly = {
  ...isoConvertOps,
  monthCodeParts: computeIsoMonthCodeParts,
  monthsInYearPart: computeIsoMonthsInYear,
  daysInMonthParts: computeIsoDaysInMonth,
  leapMonth: noop as LeapMonthOp,
}

export const isoMoveOps: NativeMoveOps = {
  ...nativeMoveBase,
  ...isoMoveOpsOnly,
}

export const isoDiffOps: NativeDiffOps = {
  ...nativeDiffBase,
  ...isoMoveOpsOnly,
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
  inLeapYear: computeNativeInLeapYear,
  dateParts: computeIsoDateParts,
  inLeapYearPart: computeIsoInLeapYear,
}

export const isoMonthsInYearOps: NativeMonthsInYearOps = {
  monthsInYear: computeNativeMonthsInYear,
  dateParts: computeIsoDateParts,
  monthsInYearPart: computeIsoMonthsInYear,
}

export const isoDaysInMonthOps: NativeDaysInMonthOps = {
  daysInMonth: computeNativeDaysInMonth,
  dateParts: computeIsoDateParts,
  daysInMonthParts: computeIsoDaysInMonth,
}

export const isoDaysInYearOps: NativeDaysInYearOps = {
  daysInYear: computeNativeDaysInYear,
  dateParts: computeIsoDateParts,
  daysInYearPart: computeIsoDaysInYear,
}

export const isoDayOfYearOps: NativeDayOfYearOps = {
  dayOfYear: computeIsoDayOfYear,
}

export const isoWeekOps: NativeWeekOps = {
  weekOfYear: computeNativeWeekOfYear,
  yearOfWeek: computeNativeYearOfWeek,
  weekParts: computeIsoWeekParts,
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
  ...isoWeekOps,
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
  epochMilli: isoArgsToEpochMilli as EpochMilliOp,
  monthAdd: isoMonthAdd,
  year: computeIsoYear,
  month: computeIsoMonth,
  day: computeIsoDay,
}

// Intl
// -----------------------------------------------------------------------------

// Refine
// ------

const intlYearMonthRefineDeps = {
  leapMonth: computeIntlLeapMonth,
  monthsInYearPart: computeIntlMonthsInYear,
  isoFields: computeIsoFieldsFromIntlParts,
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

const intlConvertOps: NativeConvertOps = {
  dateParts: computeIntlDateParts,
  epochMilli: computeIntlEpochMilli,
  monthAdd: intlMonthAdd,
}

const intlMoveOpsOnly: NativeMoveOpsOnly = {
  ...intlConvertOps,
  monthCodeParts: computeIntlMonthCodeParts,
  monthsInYearPart: computeIntlMonthsInYear,
  daysInMonthParts: computeIntlDaysInMonth,
  leapMonth: computeIntlLeapMonth,
}

export const intlMoveOps: NativeMoveOps = {
  ...nativeMoveBase,
  ...intlMoveOpsOnly,
}

export const intlDiffOps: NativeDiffOps = {
  ...nativeDiffBase,
  ...intlMoveOpsOnly,
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

export const intlPartOps: NativePartOps = {
  dateParts: computeIntlDateParts,
  eraParts: computeIntlEraParts,
  monthCodeParts: computeIntlMonthCodeParts,
}

export const intlInLeapYearOps: NativeInLeapYearOps = {
  inLeapYear: computeNativeInLeapYear,
  dateParts: computeIntlDateParts,
  inLeapYearPart: computeIntlInLeapYear,
}

export const intlMonthsInYearOps: NativeMonthsInYearOps = {
  monthsInYear: computeNativeMonthsInYear,
  dateParts: computeIntlDateParts,
  monthsInYearPart: computeIntlMonthsInYear,
}

export const intlDaysInMonthOps: NativeDaysInMonthOps = {
  daysInMonth: computeNativeDaysInMonth,
  dateParts: computeIntlDateParts,
  daysInMonthParts: computeIntlDaysInMonth,
}

export const intlDaysInYearOps: NativeDaysInYearOps = {
  daysInYear: computeNativeDaysInYear,
  dateParts: computeIntlDateParts,
  daysInYearPart: computeIntlDaysInYear,
}

export const intlDayOfYearOps: NativeDayOfYearOps = {
  dayOfYear: computeIntlDayOfYear,
}

export const intlWeekOps: NativeWeekOps = {
  weekOfYear: computeNativeWeekOfYear,
  yearOfWeek: computeNativeYearOfWeek,
  weekParts: () => [] as unknown as WeekParts,
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
  ...intlWeekOps,
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
  year: computeIntlYear,
  month: computeIntlMonth,
  day: computeIntlDay,
}

// -----------------------------------------------------------------------------

/*
All functions expect realized/normalized calendarId
*/

// Refine
export const createNativeYearMonthRefineOps = createNativeOpsCreator(
  isoYearMonthRefineOps,
  intlYearMonthRefineOps,
)
export const createNativeDateRefineOps = createNativeOpsCreator(
  isoDateRefineOps,
  intlDateRefineOps,
)
export const createNativeMonthDayRefineOps = createNativeOpsCreator(
  isoMonthDayRefineOps,
  intlMonthDayRefineOps,
)

// Mod
export const createNativeYearMonthModOps = createNativeOpsCreator(
  isoYearMonthModOps,
  intlYearMonthModOps,
)
export const createNativeDateModOps = createNativeOpsCreator(
  isoDateModOps,
  intlDateModOps,
)
export const createNativeMonthDayModOps = createNativeOpsCreator(
  isoMonthDayModOps,
  intlMonthDayModOps,
)

// Math
export const createNativeConvertOps = createNativeOpsCreator(
  isoConvertOps,
  intlConvertOps,
)
export const createNativeMoveOps = createNativeOpsCreator(
  isoMoveOps,
  intlMoveOps,
)
export const createNativeDiffOps = createNativeOpsCreator(
  isoDiffOps,
  intlDiffOps,
)
export const createNativeYearMonthMoveOps = createNativeOpsCreator(
  isoYearMonthMoveOps,
  intlYearMonthMoveOps,
)
export const createNativeYearMonthDiffOps = createNativeOpsCreator(
  isoYearMonthDiffOps,
  intlYearMonthDiffOps,
)

// Parts & Stats
export const createNativePartOps = createNativeOpsCreator(
  isoPartOps,
  intlPartOps,
)
export const createNativeInLeapYearOps = createNativeOpsCreator(
  isoInLeapYearOps,
  intlInLeapYearOps,
)
export const createNativeMonthsInYearOps = createNativeOpsCreator(
  isoMonthsInYearOps,
  intlMonthsInYearOps,
)
export const createNativeDaysInMonthOps = createNativeOpsCreator(
  isoDaysInMonthOps,
  intlDaysInMonthOps,
)
export const createNativeDaysInYearOps = createNativeOpsCreator(
  isoDaysInYearOps,
  intlDaysInYearOps,
)
export const createNativeDayOfYearOps = createNativeOpsCreator(
  isoDayOfYearOps,
  intlDayOfYearOps,
)
export const createNativeWeekOps = createNativeOpsCreator(
  isoWeekOps,
  intlWeekOps,
)

// String Parsing
export const createNativeYearMonthParseOps = createNativeOpsCreator(
  isoYearMonthParseOps,
  intlYearMonthParseOps,
)
export const createNativeMonthDayParseOps = createNativeOpsCreator(
  isoMonthDayParseOps,
  intlMonthDayParseOps,
)

// Standard
export const createNativeStandardOps = createNativeOpsCreator(
  isoStandardOps,
  intlStandardOps,
)

function createNativeOpsCreator<O extends {}>(
  isoOps: O,
  intlOps: O,
): (calendarId: string) => O & NativeCalendar {
  return (calendarId) => {
    if (calendarId === isoCalendarId) {
      return isoOps
    }
    if (calendarId === gregoryCalendarId || calendarId === japaneseCalendarId) {
      return Object.assign(Object.create(isoOps), { id: calendarId })
    }
    return Object.assign(Object.create(intlOps), queryIntlCalendar(calendarId))
  }
}
