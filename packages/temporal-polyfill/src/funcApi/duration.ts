import type { Temporal } from 'temporal-spec'
import { DurationFields } from '../internal/durationFields'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { RelativeToRecord } from './commonTypes'
import * as Native from './native/duration'
import type * as PlainDateFns from './plainDate'
import type * as PlainDateTimeFns from './plainDateTime'
import type { DurationRecord as Record } from './recordTypes'
import * as Shim from './shim/duration'
import { isDurationRecord } from './temporalRecords'
import type * as ZonedDateTimeFns from './zonedDateTime'

export type { Record }

export type FromFields = Partial<DurationFields>
export type WithFields = Partial<DurationFields>
type RelativeTo = RelativeToRecord<
  ZonedDateTimeFns.Record,
  PlainDateTimeFns.Record,
  PlainDateFns.Record
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
) => Record = NativeTemporal ? Native.create : Shim.create

export const isRecord = isDurationRecord as (arg: unknown) => arg is Record

export const fromFields: (fields: FromFields) => Record = NativeTemporal
  ? Native.fromFields
  : Shim.fromFields

export const fromString: (s: string) => Record = NativeTemporal
  ? Native.fromString
  : Shim.fromString

export const sign: (duration: Record) => number = NativeTemporal
  ? Native.sign
  : Shim.sign

export const blank: (duration: Record) => boolean = NativeTemporal
  ? Native.blank
  : Shim.blank

export const withFields: (duration: Record, mod: WithFields) => Record =
  NativeTemporal ? Native.withFields : Shim.withFields

export const negated: (duration: Record) => Record = NativeTemporal
  ? Native.negated
  : Shim.negated

export const abs: (duration: Record) => Record = NativeTemporal
  ? Native.abs
  : Shim.abs

export const add: (
  duration: Record,
  otherDuration: Record,
  options?: RelativeOptions,
) => Record = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  duration: Record,
  otherDuration: Record,
  options?: RelativeOptions,
) => Record = NativeTemporal ? Native.subtract : Shim.subtract

export const round: (duration: Record, options: RoundingOptions) => Record =
  NativeTemporal ? Native.round : Shim.round

export const total: {
  (
    duration: Record,
    unit: Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
  ): number
  (duration: Record, options: DurationTotalOptions<RelativeTo>): number
} = NativeTemporal ? Native.total : Shim.total

export const compare: (
  duration: Record,
  otherDuration: Record,
  options?: RelativeOptions,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toLocaleString: (
  duration: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (duration: Record, options?: ToStringOptions) => string =
  NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (duration: Record) => string = NativeTemporal
  ? Native.toSimpleString
  : Shim.toSimpleString
