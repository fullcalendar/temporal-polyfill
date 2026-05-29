import { TimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../internal/optionsModel'
import { TimeUnitName } from '../internal/units'
import { NumberSign } from '../internal/utils'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainTime'
import type { DurationRecord, PlainTimeRecord as Record } from './recordTypes'
import * as Shim from './shim/plainTime'
import { getPlainTimeSlotsIfPresent } from './temporalRecords'

export type { Record }

type PlainTimeRecord = Record

export const create: (
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
) => PlainTimeRecord = NativeTemporal ? Native.create : Shim.create

export function isRecord(arg: unknown): arg is Record {
  return !!getPlainTimeSlotsIfPresent(arg)
}

export const fromFields: (
  fields: Partial<TimeFields>,
  options?: OverflowOptions,
) => PlainTimeRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (s: string) => PlainTimeRecord = NativeTemporal
  ? Native.fromString
  : Shim.fromString

export const withFields: (
  record: PlainTimeRecord,
  mod: Partial<TimeFields>,
  options?: OverflowOptions,
) => PlainTimeRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const add: (
  record: PlainTimeRecord,
  duration: DurationRecord,
) => PlainTimeRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: PlainTimeRecord,
  duration: DurationRecord,
) => PlainTimeRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: PlainTimeRecord,
  otherRecord: PlainTimeRecord,
  options?: DiffOptions<TimeUnitName>,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const round: (
  record: PlainTimeRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
) => PlainTimeRecord = NativeTemporal ? Native.round : Shim.round

export const equals: (
  record: PlainTimeRecord,
  otherRecord: PlainTimeRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: PlainTimeRecord,
  otherRecord: PlainTimeRecord,
) => NumberSign = NativeTemporal ? Native.compare : Shim.compare

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<PlainTimeRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: PlainTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: PlainTimeRecord,
  options?: TimeDisplayOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainTimeRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
