import { LocalesArg } from '../internal/intlFormatUtils'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../internal/optionsModel'
import { TimeUnitName } from '../internal/units'
import { NumberSign } from '../internal/utils'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/instant'
import type {
  DurationRecord,
  InstantRecord as Record,
  ZonedDateTimeRecord,
} from './recordTypes'
import * as Shim from './shim/instant'
import { getInstantRecordIfPresent } from './temporalRecords'

export type { Record }

type InstantRecord = Record

export const create: (epochNanoseconds: bigint) => InstantRecord =
  NativeTemporal ? Native.create : Shim.create

export function isRecord(arg: unknown): arg is Record {
  return !!getInstantRecordIfPresent(arg)
}

export const fromEpochMilliseconds: (
  epochMilliseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.fromEpochMilliseconds
  : Shim.fromEpochMilliseconds

export const fromEpochNanoseconds: (epochNanoseconds: bigint) => InstantRecord =
  NativeTemporal ? Native.fromEpochNanoseconds : Shim.fromEpochNanoseconds

export const fromString: (s: string) => InstantRecord = NativeTemporal
  ? Native.fromString
  : Shim.fromString

export const add: (
  record: InstantRecord,
  durationRecord: DurationRecord,
) => InstantRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: InstantRecord,
  durationRecord: DurationRecord,
) => InstantRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: DiffOptions<TimeUnitName>,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const round: (
  record: InstantRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
) => InstantRecord = NativeTemporal ? Native.round : Shim.round

export const equals: (
  record: InstantRecord,
  otherRecord: InstantRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: InstantRecord,
  otherRecord: InstantRecord,
) => NumberSign = NativeTemporal ? Native.compare : Shim.compare

export const toZonedDateTimeISO: (
  record: InstantRecord,
  timeZoneId: string,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.toZonedDateTimeISO
  : Shim.toZonedDateTimeISO

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<InstantRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: InstantRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: InstantRecord,
  options?: InstantDisplayOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: InstantRecord) => string = NativeTemporal
  ? Native.toSimpleString
  : Shim.toSimpleString
