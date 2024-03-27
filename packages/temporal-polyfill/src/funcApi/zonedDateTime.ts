import {
  ZonedDateTimeBag,
  isoTimeFieldsToCal,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine'
import { BigNano } from '../internal/bigNano'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainMonthDay,
  zonedDateTimeToPlainTime,
  zonedDateTimeToPlainYearMonth,
} from '../internal/convert'
import { diffZonedDateTimes } from '../internal/diff'
import { DateTimeBag } from '../internal/fields'
import { createFormatPrepper, zonedConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parseZonedDateTime } from '../internal/isoParse'
import {
  slotsWithCalendar,
  slotsWithTimeZone,
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../internal/optionsRefine'
import {
  computeDayFloor,
  computeZonedEdge,
  computeZonedHoursInDay,
  roundZonedDateTime,
} from '../internal/round'
import {
  DateSlots,
  ZonedDateTimeBranding,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import {
  ZonedDateTimeFields,
  ZonedIsoFields,
  buildZonedIsoFields,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneOps'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, bindArgs, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
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

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof ZonedDateTimeBranding

  /**
   * @deprecated Use the calendarId() function instead.
   */
  readonly calendar: string

  /**
   * @deprecated Use the timeZoneId() function instead.
   */
  readonly timeZone: string

  /**
   * @deprecated Use the epochNanoseconds() function instead.
   */
  readonly epochNanoseconds: BigNano
}

export type Fields = ZonedDateTimeFields
export type FromFields = ZonedDateTimeBag<string, string>
export type WithFields = DateTimeBag
export type ISOFields = ZonedIsoFields<string, string>

export type AssignmentOptions = ZonedFieldOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToStringOptions = ZonedDateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructZonedDateTimeSlots<string, string, string, string>,
  refineCalendarIdString,
  refineTimeZoneIdString,
) as (epochNanoseconds: bigint, timeZone: string, calendar?: string) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarId = getCalendarIdFromBag(fields)
  return refineZonedDateTimeBag(
    refineTimeZoneIdString,
    queryNativeTimeZone,
    createNativeDateRefineOps(calendarId),
    calendarId,
    fields,
    options,
  )
}

export const fromString = parseZonedDateTime as (
  s: string,
  options?: AssignmentOptions,
) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === ZonedDateTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize((record: Record): Fields => {
  const isoFields = zonedEpochSlotsToIso(record, queryNativeTimeZone)
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  return {
    ...computeDateFields(isoFields),
    ...isoTimeFieldsToCal(isoFields),
    offset: offsetString,
  }
}, WeakMap)

export const getISOFields = bindArgs(
  buildZonedIsoFields<string, string>,
  queryNativeTimeZone,
) as (record: Record) => ISOFields

export const calendarId = getCalendarId as (record: Record) => string

export function timeZoneId(record: Record): string {
  return record.timeZone
}

export const epochSeconds = getEpochSec as (record: Record) => number

export const epochMilliseconds = getEpochMilli as (record: Record) => number

export const epochMicroseconds = getEpochMicro as (record: Record) => bigint

export const epochNanoseconds = getEpochNano as (record: Record) => bigint

export function offsetNanoseconds(record: Record): number {
  return zonedEpochSlotsToIso(record, queryNativeTimeZone).offsetNanoseconds
}

export function offset(record: Record): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export const dayOfWeek = adaptDateFunc(computeIsoDayOfWeek) as (
  record: Record,
) => number

export const daysInWeek = adaptDateFunc(computeIsoDaysInWeek) as (
  record: Record,
) => number

export const weekOfYear = adaptDateFunc(computeWeekOfYear) as (
  record: Record,
) => number | undefined

export const yearOfWeek = adaptDateFunc(computeYearOfWeek) as (
  record: Record,
) => number | undefined

export const dayOfYear = adaptDateFunc(computeDayOfYear) as (
  record: Record,
) => number

export const daysInMonth = adaptDateFunc(computeDaysInMonth) as (
  record: Record,
) => number

export const daysInYear = adaptDateFunc(computeDaysInYear) as (
  record: Record,
) => number

export const monthsInYear = adaptDateFunc(computeMonthsInYear) as (
  record: Record,
) => number

export const inLeapYear = adaptDateFunc(computeInLeapYear) as (
  record: Record,
) => boolean

export const hoursInDay = bindArgs(
  computeZonedHoursInDay<string, string>,
  queryNativeTimeZone,
) as (record: Record) => number

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return zonedDateTimeWithFields(
    createNativeDateModOps,
    queryNativeTimeZone,
    record,
    getFields(record),
    fields,
    options,
  )
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendar(record, refineCalendarIdString(calendar))
}

export function withTimeZone(record: Record, timeZone: string): Record {
  return slotsWithTimeZone(record, refineTimeZoneIdString(timeZone))
}

export const withPlainDate = bindArgs(
  zonedDateTimeWithPlainDate<string, string>,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export const withPlainTime = bindArgs(
  zonedDateTimeWithPlainTime<string, string>,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  false,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  true,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = bindArgs(
  roundZonedDateTime<string, string>,
  queryNativeTimeZone,
) as (record: Record, options: DayTimeUnitName | RoundOptions) => Record

export const startOfDay = bindArgs(
  computeZonedEdge<string, string>,
  queryNativeTimeZone,
  computeDayFloor,
) as (record: Record) => Record

export const equals = zonedDateTimesEqual<string, string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareZonedDateTimes<string, string> as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export const toInstant = zonedDateTimeToInstant as (
  record: Record,
) => InstantFns.Record

export const toPlainDateTime = bindArgs(
  zonedDateTimeToPlainDateTime<string, string>,
  queryNativeTimeZone,
) as (record: Record) => PlainDateTimeFns.Record

export const toPlainDate = bindArgs(
  zonedDateTimeToPlainDate<string, string>,
  queryNativeTimeZone,
) as (record: Record) => PlainDateFns.Record

export const toPlainTime = bindArgs(
  zonedDateTimeToPlainTime<string, string>,
  queryNativeTimeZone,
) as (record: Record) => PlainTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return zonedDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return zonedDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  zonedConfig,
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

export const toString = bindArgs(
  formatZonedDateTimeIso<string, string>,
  queryNativeTimeZone,
) as (record: Record, options?: ToStringOptions) => string

// Internal Utils
// -----------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: DateSlots<string>) => R,
): (record: Record) => R {
  return (record: Record) => {
    return dateFunc(zonedEpochSlotsToIso(record, queryNativeTimeZone))
  }
}
