import {
  PlainTimeBag,
  isoTimeFieldsToCal,
  plainTimeWithFields,
  refinePlainTimeBag,
} from '../internal/bagRefine'
import { compareIsoTimeFields, plainTimesEqual } from '../internal/compare'
import { constructPlainTimeSlots } from '../internal/construct'
import {
  plainTimeToPlainDateTime,
  plainTimeToZonedDateTime,
} from '../internal/convert'
import { diffPlainTimes } from '../internal/diff'
import { TimeBag, TimeFields } from '../internal/fields'
import { createFormatPrepper, timeConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoTimeFields } from '../internal/isoFields'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { movePlainTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../internal/optionsRefine'
import { roundPlainTime } from '../internal/round'
import {
  BrandingSlots,
  PlainDateSlots,
  PlainTimeBranding,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { TimeUnitName } from '../internal/units'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import { refineTimeZoneIdString } from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  branding: typeof PlainTimeBranding

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoHour: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMinute: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoSecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMillisecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMicrosecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoNanosecond: number
}

export type Fields = TimeFields
export type FromFields = PlainTimeBag
export type WithFields = TimeBag
export type ISOFields = IsoTimeFields

export type AssignmentOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<TimeUnitName>
export type RoundOptions = RoundingOptions<TimeUnitName>
export type ToStringOptions = TimeDisplayOptions
export type ToZonedDateTimeOptions = {
  timeZone: string
  plainDate: PlainDateFns.Record
}

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructPlainTimeSlots as (
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
  isoMicrosecond?: number,
  isoNanosecond?: number,
) => Record

export const fromFields = refinePlainTimeBag as (
  fields: FromFields,
  options?: AssignmentOptions,
) => Record

export const fromString = parsePlainTime as (s: string) => Record

export function isInstance(record: BrandingSlots): boolean {
  return record.branding === PlainTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(isoTimeFieldsToCal, WeakMap) as (
  record: Record,
) => Fields

export const getISOFields = identity as (record: Record) => ISOFields

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return plainTimeWithFields(getFields(record), fields, options)
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainTime, false) as (
  plainTimeRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const subtract = bindArgs(movePlainTime, true) as (
  plainTimeRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const until = bindArgs(diffPlainTimes, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffPlainTimes, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = roundPlainTime as (
  record: Record,
  options: TimeUnitName | RoundOptions,
) => Record

export const equals = plainTimesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoTimeFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export const toZonedDateTime = bindArgs(
  plainTimeToZonedDateTime<string, string, string, PlainDateSlots<string>>,
  refineTimeZoneIdString,
  identity,
  queryNativeTimeZone,
) as (
  plainTimeRecord: Record,
  options: ToZonedDateTimeOptions,
) => ZonedDateTimeFns.Record

export const toPlainDateTime = plainTimeToPlainDateTime<string> as (
  plainTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => PlainDateTimeFns.Record

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  timeConfig,
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

export const toString = formatPlainTimeIso as (
  record: Record,
  options?: ToStringOptions,
) => string
