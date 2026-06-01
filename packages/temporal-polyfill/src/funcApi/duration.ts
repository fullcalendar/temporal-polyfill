import type { Temporal } from 'temporal-spec'
import { DurationFields } from '../internal/durationFields'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { RelativeToRecord } from './commonTypes'
import * as Native from './native/duration'
import type {
  DurationRecord as Record,
  PlainDateRecord,
  PlainDateTimeRecord,
  ZonedDateTimeRecord,
} from './recordTypes'
import * as Shim from './shim/duration'
import { isDurationRecord } from './temporalRecords'

export type { Record }

type DurationRecord = Record
export type FromFields = Partial<DurationFields>
export type WithFields = Partial<DurationFields>
type RelativeTo = RelativeToRecord<
  ZonedDateTimeRecord,
  PlainDateTimeRecord,
  PlainDateRecord
>
type RelativeToOptions<R> = TemporalSpecHelpers.RelativeToOptions<R>
type DurationRoundingOptions<R> = TemporalSpecHelpers.DurationRoundingOptions<R>
type DurationTotalOptions<R> = TemporalSpecHelpers.DurationTotalOptions<R>
type RelativeOptions = RelativeToOptions<RelativeTo>
type RoundingOptions = DurationRoundingOptions<RelativeTo>
type ToStringOptions = Temporal.DurationToStringOptions

export const create: (
  years?: number,
  months?: number,
  weeks?: number,
  days?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number,
  microseconds?: number,
  nanoseconds?: number,
) => DurationRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isDurationRecord as (arg: unknown) => arg is Record

export const fromFields: (fields: FromFields) => DurationRecord = NativeTemporal
  ? Native.fromFields
  : Shim.fromFields

export const fromString: (s: string) => DurationRecord = NativeTemporal
  ? Native.fromString
  : Shim.fromString

export const sign: (duration: DurationRecord) => number = NativeTemporal
  ? Native.sign
  : Shim.sign

export const blank: (duration: DurationRecord) => boolean = NativeTemporal
  ? Native.blank
  : Shim.blank

export const withFields: (
  duration: DurationRecord,
  mod: WithFields,
) => DurationRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const negated: (duration: DurationRecord) => DurationRecord =
  NativeTemporal ? Native.negated : Shim.negated

export const abs: (duration: DurationRecord) => DurationRecord = NativeTemporal
  ? Native.abs
  : Shim.abs

export const add: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeOptions,
) => DurationRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeOptions,
) => DurationRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const round: (
  duration: DurationRecord,
  options: RoundingOptions,
) => DurationRecord = NativeTemporal ? Native.round : Shim.round

export const total: {
  (
    duration: DurationRecord,
    unit: Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
  ): number
  (duration: DurationRecord, options: DurationTotalOptions<RelativeTo>): number
} = NativeTemporal ? Native.total : Shim.total

export const compare: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeOptions,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toLocaleString: (
  duration: DurationRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  duration: DurationRecord,
  options?: ToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (duration: DurationRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
