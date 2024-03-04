import {
  isoTimeFieldsToCal,
  plainTimeWithFields,
  refinePlainTimeBag,
} from '../internal/bagRefine'
import { DiffOps } from '../internal/calendarOps'
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
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { movePlainTime } from '../internal/move'
import {
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../internal/optionsRefine'
import { roundPlainTime } from '../internal/round'
import { PlainDateSlots, PlainTimeSlots } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { UnitName } from '../internal/units'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import { refineTimeZoneIdString } from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = Readonly<PlainTimeSlots>
export type Fields = TimeFields
export type Bag = TimeBag
// for creation... PlainTimeBag

export const create = constructPlainTimeSlots as (
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
  isoMicrosecond?: number,
  isoNanosecond?: number,
) => Record

export const fromString = parsePlainTime as (s: string) => Record

export const fromFields = refinePlainTimeBag as (
  bag: Bag,
  options?: OverflowOptions,
) => Record

export const getFields = memoize(isoTimeFieldsToCal, WeakMap) as (
  record: Record,
) => Fields

export function withFields(
  record: Record,
  mod: Bag,
  options?: OverflowOptions,
): Record {
  return plainTimeWithFields(getFields(record), mod, options)
}

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
  options?: DiffOps,
) => DurationFns.Record

export const since = bindArgs(diffPlainTimes, true) as (
  record0: Record,
  record1: Record,
  options?: DiffOps,
) => DurationFns.Record

export const round = roundPlainTime as (
  record: Record,
  options: RoundingOptions | UnitName,
) => Record

export const equals = plainTimesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoTimeFields as (
  record0: Record,
  record1: Record,
) => NumberSign

export const toPlainDateTime = plainTimeToPlainDateTime<string> as (
  plainTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => PlainDateTimeFns.Record

export const toZonedDateTime = bindArgs(
  plainTimeToZonedDateTime<string, string, string, PlainDateSlots<string>>,
  refineTimeZoneIdString,
  identity,
  queryNativeTimeZone,
) as (
  plainTimeRecord: Record,
  options: { timeZone: string; plainDate: PlainDateFns.Record },
) => ZonedDateTimeFns.Record

export const toString = formatPlainTimeIso as (
  record: Record,
  options?: TimeDisplayOptions,
) => string

// Intl Formatting
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
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

// TODO: should be range-format types. others too!!!
export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
