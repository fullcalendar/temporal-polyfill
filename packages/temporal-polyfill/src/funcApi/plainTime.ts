import { TimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import {
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  TimeDisplayOptions,
} from '../internal/optionsModel'
import { TimeUnitName } from '../internal/units'
import { NumberSign } from '../internal/utils'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainTime'
import type { DurationRecord, PlainTimeRecord as Record } from './recordTypes'
import { RoundToOptions } from './roundTo'
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

export const addHours: (
  record: PlainTimeRecord,
  hours: number,
) => PlainTimeRecord = NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (
  record: PlainTimeRecord,
  minutes: number,
) => PlainTimeRecord = NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (
  record: PlainTimeRecord,
  seconds: number,
) => PlainTimeRecord = NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (
  record: PlainTimeRecord,
  milliseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds

export const addMicroseconds: (
  record: PlainTimeRecord,
  microseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds

export const addNanoseconds: (
  record: PlainTimeRecord,
  nanoseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds

export const subtract: (
  record: PlainTimeRecord,
  duration: DurationRecord,
) => PlainTimeRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const subtractHours: (
  record: PlainTimeRecord,
  hours: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractHours
  : Shim.subtractHours

export const subtractMinutes: (
  record: PlainTimeRecord,
  minutes: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes

export const subtractSeconds: (
  record: PlainTimeRecord,
  seconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: PlainTimeRecord,
  milliseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: PlainTimeRecord,
  microseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: PlainTimeRecord,
  nanoseconds: number,
) => PlainTimeRecord = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const diff: (
  record: PlainTimeRecord,
  otherRecord: PlainTimeRecord,
  options?: DiffOptions<TimeUnitName>,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const diffHours: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: (
  record0: PlainTimeRecord,
  record1: PlainTimeRecord,
  options?: RoundingModeName | RoundingMathOptions,
) => number = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds

export const roundToHour: (
  record: PlainTimeRecord,
  options?: RoundToOptions,
) => PlainTimeRecord = NativeTemporal ? Native.roundToHour : Shim.roundToHour

export const roundToMinute: (
  record: PlainTimeRecord,
  options?: RoundToOptions,
) => PlainTimeRecord = NativeTemporal
  ? Native.roundToMinute
  : Shim.roundToMinute

export const roundToSecond: (
  record: PlainTimeRecord,
  options?: RoundToOptions,
) => PlainTimeRecord = NativeTemporal
  ? Native.roundToSecond
  : Shim.roundToSecond

export const roundToMillisecond: (
  record: PlainTimeRecord,
  options?: RoundToOptions,
) => PlainTimeRecord = NativeTemporal
  ? Native.roundToMillisecond
  : Shim.roundToMillisecond

export const roundToMicrosecond: (
  record: PlainTimeRecord,
  options?: RoundToOptions,
) => PlainTimeRecord = NativeTemporal
  ? Native.roundToMicrosecond
  : Shim.roundToMicrosecond

export const startOfHour: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.startOfHour : Shim.startOfHour

export const startOfMinute: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.startOfMinute : Shim.startOfMinute

export const startOfSecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.startOfSecond : Shim.startOfSecond

export const startOfMillisecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.startOfMillisecond : Shim.startOfMillisecond

export const startOfMicrosecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.startOfMicrosecond : Shim.startOfMicrosecond

export const endOfHour: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.endOfHour : Shim.endOfHour

export const endOfMinute: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.endOfMinute : Shim.endOfMinute

export const endOfSecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.endOfSecond : Shim.endOfSecond

export const endOfMillisecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.endOfMillisecond : Shim.endOfMillisecond

export const endOfMicrosecond: (record: PlainTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.endOfMicrosecond : Shim.endOfMicrosecond

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
