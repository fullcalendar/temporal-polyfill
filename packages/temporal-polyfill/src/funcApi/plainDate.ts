import {
  PlainDateBag,
  plainDateWithFields,
  refinePlainDateBag,
} from '../internal/bagRefine'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructPlainDateSlots } from '../internal/construct'
import {
  plainDateToPlainDateTime,
  plainDateToPlainMonthDay,
  plainDateToPlainYearMonth,
  plainDateToZonedDateTime,
} from '../internal/convert'
import { diffPlainDates } from '../internal/diff'
import { DateBag, DateFields } from '../internal/fields'
import { createFormatPrepper, dateConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateFields } from '../internal/isoFields'
import { formatPlainDateIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { slotsWithCalendar } from '../internal/modify'
import { movePlainDate } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsRefine'
import { BrandingSlots, PlainDateBranding } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DateUnitName } from '../internal/units'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  computeDateFields,
  computeDayOfYear,
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeWeekOfYear,
  computeYearOfWeek,
  getCalendarId,
  getCalendarIdFromBag,
  refineCalendarIdString,
  refineTimeZoneIdString,
} from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof PlainDateBranding

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

export type Fields = DateFields
export type FromFields = PlainDateBag<string>
export type WithFields = DateBag
export type ISOFields = IsoDateFields

export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<DateUnitName>
export type ToStringOptions = CalendarDisplayOptions
export type ToZonedDateTimeOptions = {
  timeZone: string
  plainTime?: PlainTimeFns.Record
}

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructPlainDateSlots<string, string>,
  refineCalendarIdString,
) as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  return refinePlainDateBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const fromString = parsePlainDate as (s: string) => Record

export function isInstance(record: BrandingSlots): boolean {
  return record.branding === PlainDateBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(computeDateFields, WeakMap) as (
  record: Record,
) => Fields

export const getISOFields = identity as (record: Record) => ISOFields

export const calendarId = getCalendarId as (record: Record) => string

export const dayOfWeek = computeIsoDayOfWeek as (record: Record) => number

export const daysInWeek = computeIsoDaysInWeek as (record: Record) => number

export const weekOfYear = computeWeekOfYear as (
  record: Record,
) => number | undefined

export const yearOfWeek = computeYearOfWeek as (
  record: Record,
) => number | undefined

export const dayOfYear = computeDayOfYear as (record: Record) => number

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
  return plainDateWithFields(
    createNativeDateModOps,
    record,
    getFields(record),
    fields,
    options,
  )
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendar(record, refineCalendarIdString(calendar))
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  movePlainDate<string>,
  createNativeMoveOps,
  false,
) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  movePlainDate<string>,
  createNativeMoveOps,
  true,
) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffPlainDates<string>,
  createNativeDiffOps,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffPlainDates<string>,
  createNativeDiffOps,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const equals = plainDatesEqual<string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toZonedDateTime(
  record: Record,
  options: string | ToZonedDateTimeOptions,
): ZonedDateTimeFns.Record {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options

  return plainDateToZonedDateTime(
    refineTimeZoneIdString,
    identity,
    queryNativeTimeZone,
    record,
    optionsObj,
  )
}

export const toPlainDateTime = plainDateToPlainDateTime as (
  plainDateRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => PlainDateTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  dateConfig,
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

export const toString = formatPlainDateIso<string> as (
  record: Record,
  options?: ToStringOptions,
) => string
