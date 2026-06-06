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
export type ToStringOptions = Temporal.DurationToStringOptions
export type RoundingUnit = Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
export type RoundingOptions =
  TemporalSpecHelpers.DurationRoundingOptions<RelativeTo>
export type TotalUnit = Temporal.PluralizeUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
export type DurationTotalOptions =
  TemporalSpecHelpers.DurationTotalOptions<RelativeTo>
export type RelativeToOptions =
  TemporalSpecHelpers.RelativeToOptions<RelativeTo>

type RelativeTo = RelativeToRecord<
  ZonedDateTimeFns.Record,
  PlainDateTimeFns.Record,
  PlainDateFns.Record
>

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

export const add: (duration: Record, otherDuration: Record) => Record =
  NativeTemporal ? Native.add : Shim.add

export const subtract: (duration: Record, otherDuration: Record) => Record =
  NativeTemporal ? Native.subtract : Shim.subtract

export const round: {
  (duration: Record, unit: RoundingUnit): Record
  (duration: Record, options: RoundingOptions): Record
} = NativeTemporal ? Native.round : Shim.round

export const total: {
  (duration: Record, unit: TotalUnit): number
  (duration: Record, options: DurationTotalOptions): number
} = NativeTemporal ? Native.total : Shim.total

export const compare: (
  duration: Record,
  otherDuration: Record,
  options?: RelativeToOptions,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toLocaleString: (
  duration: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (duration: Record, options?: ToStringOptions) => string =
  NativeTemporal ? Native.toString : Shim.toString

export const toBasicString: (duration: Record) => string = NativeTemporal
  ? Native.toBasicString
  : Shim.toBasicString
