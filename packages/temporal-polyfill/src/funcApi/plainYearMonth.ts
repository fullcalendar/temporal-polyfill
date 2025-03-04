import {
  PlainYearMonthBag,
  plainYearMonthWithFields,
  refinePlainYearMonthBag,
} from '../internal/bagRefine'
import { refineCalendarId } from '../internal/calendarId'
import {
  createNativeDateModOps,
  createNativeDayOps,
  createNativeYearMonthDiffOps,
  createNativeYearMonthModOps,
  createNativeYearMonthMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { plainYearMonthToPlainDate } from '../internal/convert'
import { diffPlainYearMonth } from '../internal/diff'
import { YearMonthBag, YearMonthFields } from '../internal/fields'
import {
  createFormatPrepper,
  yearMonthConfig,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateFields } from '../internal/isoFields'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { movePlainYearMonth } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsRefine'
import { PlainYearMonthBranding } from '../internal/slots'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import {
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeYearMonthFields,
  getCalendarId,
  getCalendarIdFromBag,
} from './calendarUtils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof PlainYearMonthBranding

  /**
   * @deprecated Use the calendarId() function instead.
   */
  readonly calendar: string

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoYear: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMonth: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoDay: number
}

export type Fields = YearMonthFields
export type FromFields = PlainYearMonthBag
export type WithFields = YearMonthBag
export type ISOFields = IsoDateFields
export type ToPlainDateFields = { day: number }

export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<YearMonthUnitName>
export type ToStringOptions = CalendarDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructPlainYearMonthSlots,
  refineCalendarId,
) as (
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  return refinePlainYearMonthBag(
    createNativeYearMonthRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const fromString = bindArgs(parsePlainYearMonth, createNativeDayOps) as (
  s: string,
) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainYearMonthBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(computeYearMonthFields, WeakMap) as (
  record: Record,
) => Fields

export const getISOFields = identity as (record: Record) => ISOFields

export const calendarId = getCalendarId as (record: Record) => string

export const daysInMonth = computeDaysInMonth as (record: Record) => number

export const daysInYear = computeDaysInYear as (record: Record) => number

export const monthsInYear = computeMonthsInYear as (record: Record) => number

export const inLeapYear = computeInLeapYear as (record: Record) => boolean

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return plainYearMonthWithFields(
    createNativeYearMonthModOps,
    record,
    fields,
    options,
  )
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  movePlainYearMonth,
  createNativeYearMonthMoveOps,
  false,
) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  movePlainYearMonth,
  createNativeYearMonthMoveOps,
  true,
) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffPlainYearMonth,
  createNativeYearMonthDiffOps,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffPlainYearMonth,
  createNativeYearMonthDiffOps,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const equals = plainYearMonthsEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toPlainDate(
  record: Record,
  fields: ToPlainDateFields,
): PlainDateFns.Record {
  return plainYearMonthToPlainDate(
    createNativeDateModOps,
    record,
    getFields(record),
    fields,
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  yearMonthConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRangeToParts(epochMilli0, epochMilli1!)
}

export const toString = formatPlainYearMonthIso as (
  record: Record,
  options?: ToStringOptions,
) => string
