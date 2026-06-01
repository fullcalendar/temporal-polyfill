import type { Temporal } from 'temporal-spec'
import { DurationFields } from '../internal/durationFields'
import { LocalesArg } from '../internal/intlFormatUtils'
import type {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
} from '../internal/temporalSpecHelpers'
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
type RelativeTo = RelativeToRecord<
  ZonedDateTimeRecord,
  PlainDateTimeRecord,
  PlainDateRecord
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
) => DurationRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isDurationRecord as (arg: unknown) => arg is Record

export const fromFields: (fields: Partial<DurationFields>) => DurationRecord =
  NativeTemporal ? Native.fromFields : Shim.fromFields

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
  mod: Partial<DurationFields>,
) => DurationRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const negated: (duration: DurationRecord) => DurationRecord =
  NativeTemporal ? Native.negated : Shim.negated

export const abs: (duration: DurationRecord) => DurationRecord = NativeTemporal
  ? Native.abs
  : Shim.abs

export const add: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeToOptions<RelativeTo>,
) => DurationRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeToOptions<RelativeTo>,
) => DurationRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const round: (
  duration: DurationRecord,
  options: DurationRoundingOptions<RelativeTo>,
) => DurationRecord = NativeTemporal ? Native.round : Shim.round

export const total: (
  duration: DurationRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<RelativeTo>,
) => number = NativeTemporal ? Native.total : Shim.total

export const compare: (
  duration: DurationRecord,
  otherDuration: DurationRecord,
  options?: RelativeToOptions<RelativeTo>,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toLocaleString: (
  duration: DurationRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  duration: DurationRecord,
  options?: Temporal.DurationToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (duration: DurationRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
