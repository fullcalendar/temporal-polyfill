import type { Temporal } from 'temporal-spec'
import { TimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import type * as DurationFns from './duration'
import type {
  OverflowOptions,
  RoundingMathOptions,
  RoundingMode,
} from './index'
import * as Native from './native/plainTime'
import type { PlainTimeRecord as Record } from './recordTypes'
import * as Shim from './shim/plainTime'
import { isPlainTimeRecord } from './temporalRecords'

export type { Record }
export type Format = DateTimeFormatLike<Record>
export type FromFields = Partial<TimeFields>
export type WithFields = Partial<TimeFields>
export type DiffOptions =
  Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
export type ToStringOptions = Temporal.PlainTimeToStringOptions

export const create: (
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
) => Record = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainTimeRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (s: string) => Record = NativeTemporal
  ? Native.fromString
  : Shim.fromString

export const withFields: (
  record: Record,
  mod: WithFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withFields : Shim.withFields

export const add: (record: Record, duration: DurationFns.Record) => Record =
  NativeTemporal ? Native.add : Shim.add

export const addHours: (record: Record, hours: number) => Record =
  NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (record: Record, minutes: number) => Record =
  NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (record: Record, seconds: number) => Record =
  NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (record: Record, milliseconds: number) => Record =
  NativeTemporal ? Native.addMilliseconds : Shim.addMilliseconds

export const addMicroseconds: (record: Record, microseconds: number) => Record =
  NativeTemporal ? Native.addMicroseconds : Shim.addMicroseconds

export const addNanoseconds: (record: Record, nanoseconds: number) => Record =
  NativeTemporal ? Native.addNanoseconds : Shim.addNanoseconds

export const subtract: (
  record: Record,
  duration: DurationFns.Record,
) => Record = NativeTemporal ? Native.subtract : Shim.subtract

export const subtractHours: (record: Record, hours: number) => Record =
  NativeTemporal ? Native.subtractHours : Shim.subtractHours

export const subtractMinutes: (record: Record, minutes: number) => Record =
  NativeTemporal ? Native.subtractMinutes : Shim.subtractMinutes

export const subtractSeconds: (record: Record, seconds: number) => Record =
  NativeTemporal ? Native.subtractSeconds : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: Record,
  milliseconds: number,
) => Record = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: Record,
  microseconds: number,
) => Record = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: Record,
  nanoseconds: number,
) => Record = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const diff: (
  record: Record,
  otherRecord: Record,
  options?: DiffOptions,
) => DurationFns.Record = NativeTemporal ? Native.diff : Shim.diff

export const diffHours: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds

export const roundToHour: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToHour : Shim.roundToHour

export const roundToMinute: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMinute : Shim.roundToMinute

export const roundToSecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToSecond : Shim.roundToSecond

export const roundToMillisecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMillisecond : Shim.roundToMillisecond

export const roundToMicrosecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMicrosecond : Shim.roundToMicrosecond

export const startOfHour: (record: Record) => Record = NativeTemporal
  ? Native.startOfHour
  : Shim.startOfHour

export const startOfMinute: (record: Record) => Record = NativeTemporal
  ? Native.startOfMinute
  : Shim.startOfMinute

export const startOfSecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfSecond
  : Shim.startOfSecond

export const startOfMillisecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond

export const startOfMicrosecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond

export const endOfHour: (record: Record) => Record = NativeTemporal
  ? Native.endOfHour
  : Shim.endOfHour

export const endOfMinute: (record: Record) => Record = NativeTemporal
  ? Native.endOfMinute
  : Shim.endOfMinute

export const endOfSecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfSecond
  : Shim.endOfSecond

export const endOfMillisecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond

export const endOfMicrosecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond

export const equals: (record: Record, otherRecord: Record) => boolean =
  NativeTemporal ? Native.equals : Shim.equals

export const compare: (record: Record, otherRecord: Record) => number =
  NativeTemporal ? Native.compare : Shim.compare

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = NativeTemporal ? Native.createFormat : Shim.createFormat

export const toLocaleString: (
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (record: Record, options?: ToStringOptions) => string =
  NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: Record) => string = NativeTemporal
  ? Native.toSimpleString
  : Shim.toSimpleString
