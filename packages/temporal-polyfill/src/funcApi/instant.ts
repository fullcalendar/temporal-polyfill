import { LocalesArg } from '../internal/intlFormatUtils'
import type {
  DiffOptions,
  InstantDisplayOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../internal/optionsInput'
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
import { RoundToOptions } from './roundTo'
import * as Shim from './shim/instant'
import { getInstantSlotsIfPresent } from './temporalRecords'

export type { Record }

type InstantRecord = Record

export const create: (epochNanoseconds: bigint) => InstantRecord =
  NativeTemporal ? Native.create : Shim.create

export function isRecord(arg: unknown): arg is Record {
  return !!getInstantSlotsIfPresent(arg)
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

export const addHours: (record: InstantRecord, hours: number) => InstantRecord =
  NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (
  record: InstantRecord,
  minutes: number,
) => InstantRecord = NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (
  record: InstantRecord,
  seconds: number,
) => InstantRecord = NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (
  record: InstantRecord,
  milliseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds

export const addMicroseconds: (
  record: InstantRecord,
  microseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds

export const addNanoseconds: (
  record: InstantRecord,
  nanoseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds

export const subtractHours: (
  record: InstantRecord,
  hours: number,
) => InstantRecord = NativeTemporal ? Native.subtractHours : Shim.subtractHours

export const subtractMinutes: (
  record: InstantRecord,
  minutes: number,
) => InstantRecord = NativeTemporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes

export const subtractSeconds: (
  record: InstantRecord,
  seconds: number,
) => InstantRecord = NativeTemporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: InstantRecord,
  milliseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: InstantRecord,
  microseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: InstantRecord,
  nanoseconds: number,
) => InstantRecord = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const diff: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: DiffOptions<TimeUnitName>,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const diffHours: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: (
  record: InstantRecord,
  otherRecord: InstantRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds

export const roundToHour: (
  record: InstantRecord,
  options?: RoundToOptions,
) => InstantRecord = NativeTemporal ? Native.roundToHour : Shim.roundToHour

export const roundToMinute: (
  record: InstantRecord,
  options?: RoundToOptions,
) => InstantRecord = NativeTemporal ? Native.roundToMinute : Shim.roundToMinute

export const roundToSecond: (
  record: InstantRecord,
  options?: RoundToOptions,
) => InstantRecord = NativeTemporal ? Native.roundToSecond : Shim.roundToSecond

export const roundToMillisecond: (
  record: InstantRecord,
  options?: RoundToOptions,
) => InstantRecord = NativeTemporal
  ? Native.roundToMillisecond
  : Shim.roundToMillisecond

export const roundToMicrosecond: (
  record: InstantRecord,
  options?: RoundToOptions,
) => InstantRecord = NativeTemporal
  ? Native.roundToMicrosecond
  : Shim.roundToMicrosecond

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
