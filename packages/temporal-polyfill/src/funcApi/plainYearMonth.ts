import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { convertPlainYearMonthToDate } from '../internal/convert'
import { refinePlainYearMonthObjectLike } from '../internal/createFromFields'
import { diffPlainYearMonth, getCommonCalendar } from '../internal/diff'
import { getInternalCalendar } from '../internal/externalCalendar'
import { YearMonthLikeObject } from '../internal/fieldTypes'
import { YearMonthFields } from '../internal/fieldTypes'
import {
  createFormatPrepper,
  yearMonthConfig,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { mergePlainYearMonthFields } from '../internal/merge'
import { movePlainYearMonth } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsModel'
import { PlainYearMonthBranding, PlainYearMonthSlots } from '../internal/slots'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign, bindArgs, memoize } from '../internal/utils'
import {
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeYearMonthFields,
  getCalendarIdFromBag,
} from './calendarUtils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'

export type Record = PlainYearMonthSlots

export type Fields = YearMonthFields
export type FromFields = YearMonthLikeObject
export type WithFields = Partial<YearMonthFields>
export type ToPlainDateFields = { day: number }

export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<YearMonthUnitName>
export type ToStringOptions = CalendarDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructPlainYearMonthSlots as (
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarId = getCalendarIdFromBag(fields)
  const calendar = getInternalCalendar(calendarId)
  return refinePlainYearMonthObjectLike(calendar, fields, options)
}

export const fromString = parsePlainYearMonth as (s: string) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainYearMonthBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(computeYearMonthFields, WeakMap) as (
  record: Record,
) => Fields

export const daysInMonth = computeDaysInMonth as (record: Record) => number

export const daysInYear = computeDaysInYear as (record: Record) => number

export const monthsInYear = computeMonthsInYear as (record: Record) => number

export const inLeapYear = computeInLeapYear as (record: Record) => boolean

// Setters
// -----------------------------------------------------------------------------

export const withFields = mergePlainYearMonthFields as (
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainYearMonth, false) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(movePlainYearMonth, true) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export function until(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffPlainYearMonth(false, calendar, record0, record1, options)
}

export function since(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffPlainYearMonth(true, calendar, record0, record1, options)
}

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
  return convertPlainYearMonthToDate(record.calendar, getFields(record), fields)
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
