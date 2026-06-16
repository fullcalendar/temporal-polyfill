import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
} from '../../apiHelpers/classStyle'
import { timeGetters } from '../../apiHelpers/nativeMixins'
import { TimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign, bindArgs } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike, NativeDiffFunc } from '../commonTypes'
import { PlainTimeRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import { getPlainTimeSlots, setPlainTimeSlots } from '../temporalRecords'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import {
  NativeDurationRecord,
  createNativeDurationRecord,
  getNativeDuration,
} from './duration'
import { createRoundToOptions } from './roundUtils'

type Format = DateTimeFormatLike<NativePlainTimeRecord>

export const getNativePlainTime: (record: unknown) => Temporal.PlainTime =
  getPlainTimeSlots

export type NativePlainTimeRecord = InstanceType<typeof NativePlainTimeRecord> &
  RecordTypes.PlainTimeRecord
export const NativePlainTimeRecord = defineTemporalClass(
  PlainTimeRecordBranding,
  class {
    toJSON() {
      return getNativePlainTime(this).toJSON()
    }

    valueOf(): never {
      return getNativePlainTime(this).valueOf()
    }
  },
  getNativePlainTime,
  timeGetters,
)

export function createNativePlainTimeRecord(
  native: Temporal.PlainTime,
): NativePlainTimeRecord {
  const instance = Object.create(NativePlainTimeRecord.prototype)
  setPlainTimeSlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
): NativePlainTimeRecord {
  return createNativePlainTimeRecord(
    new NativeTemporal!.PlainTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
    ),
  )
}

export function fromFields(
  fields: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): NativePlainTimeRecord {
  const resNative = NativeTemporal!.PlainTime.from(fields, options)
  return createNativePlainTimeRecord(resNative)
}

export function fromString(s: string): NativePlainTimeRecord {
  const resNative = NativeTemporal!.PlainTime.from(s)
  return createNativePlainTimeRecord(resNative)
}

export const toNative: (record: NativePlainTimeRecord) => Temporal.PlainTime =
  getNativePlainTime

export function withFields(
  record: NativePlainTimeRecord,
  mod: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): NativePlainTimeRecord {
  const native = getNativePlainTime(record)
  const resNative = native.with(mod, options)
  return createNativePlainTimeRecord(resNative)
}

export function add(
  record: NativePlainTimeRecord,
  duration: NativeDurationRecord,
): NativePlainTimeRecord {
  const native = getNativePlainTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.add(durationNative)
  return createNativePlainTimeRecord(resNative)
}

export function addHours(
  record: NativePlainTimeRecord,
  hours: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ hours })
  return createNativePlainTimeRecord(resNative)
}

export function addMinutes(
  record: NativePlainTimeRecord,
  minutes: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ minutes })
  return createNativePlainTimeRecord(resNative)
}

export function addSeconds(
  record: NativePlainTimeRecord,
  seconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ seconds })
  return createNativePlainTimeRecord(resNative)
}

export function addMilliseconds(
  record: NativePlainTimeRecord,
  milliseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ milliseconds })
  return createNativePlainTimeRecord(resNative)
}

export function addMicroseconds(
  record: NativePlainTimeRecord,
  microseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ microseconds })
  return createNativePlainTimeRecord(resNative)
}

export function addNanoseconds(
  record: NativePlainTimeRecord,
  nanoseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).add({ nanoseconds })
  return createNativePlainTimeRecord(resNative)
}

export function subtract(
  record: NativePlainTimeRecord,
  duration: NativeDurationRecord,
): NativePlainTimeRecord {
  const native = getNativePlainTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.subtract(durationNative)
  return createNativePlainTimeRecord(resNative)
}

export function subtractHours(
  record: NativePlainTimeRecord,
  hours: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ hours })
  return createNativePlainTimeRecord(resNative)
}

export function subtractMinutes(
  record: NativePlainTimeRecord,
  minutes: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ minutes })
  return createNativePlainTimeRecord(resNative)
}

export function subtractSeconds(
  record: NativePlainTimeRecord,
  seconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ seconds })
  return createNativePlainTimeRecord(resNative)
}

export function subtractMilliseconds(
  record: NativePlainTimeRecord,
  milliseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ milliseconds })
  return createNativePlainTimeRecord(resNative)
}

export function subtractMicroseconds(
  record: NativePlainTimeRecord,
  microseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ microseconds })
  return createNativePlainTimeRecord(resNative)
}

export function subtractNanoseconds(
  record: NativePlainTimeRecord,
  nanoseconds: number,
): NativePlainTimeRecord {
  const resNative = getNativePlainTime(record).subtract({ nanoseconds })
  return createNativePlainTimeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativePlainTimeRecord,
  otherRecord: NativePlainTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): NativeDurationRecord {
  const native = getNativePlainTime(record)
  const otherNative = getNativePlainTime(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

export function diffHours(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffHours as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

export function diffMinutes(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMinutes as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

export function diffSeconds(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffSeconds as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

export function diffMilliseconds(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMilliseconds as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

export function diffMicroseconds(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMicroseconds as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

export function diffNanoseconds(
  record0: NativePlainTimeRecord,
  record1: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffNanoseconds as NativeDiffFunc<Temporal.PlainTime>)(
    getNativePlainTime(record0),
    getNativePlainTime(record1),
    options,
  )
}

function round(
  record: NativePlainTimeRecord,
  options: Temporal.RoundingOptions<Temporal.TimeUnit>,
): NativePlainTimeRecord {
  const native = getNativePlainTime(record)
  const resNative = native.round(options)
  return createNativePlainTimeRecord(resNative)
}

function roundToUnit(
  smallestUnit: Temporal.PluralizeUnit<Temporal.TimeUnit>,
  record: NativePlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainTimeRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToHour = bindArgs(roundToUnit, 'hour')
export const roundToMinute = bindArgs(roundToUnit, 'minute')
export const roundToSecond = bindArgs(roundToUnit, 'second')
export const roundToMillisecond = bindArgs(roundToUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToUnit, 'microsecond')

export function startOfHour(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.startOfHour(getNativePlainTime(record)),
  )
}

export function startOfMinute(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.startOfMinute(getNativePlainTime(record)),
  )
}

export function startOfSecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.startOfSecond(getNativePlainTime(record)),
  )
}

export function startOfMillisecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.startOfMillisecond(getNativePlainTime(record)),
  )
}

export function startOfMicrosecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.startOfMicrosecond(getNativePlainTime(record)),
  )
}

export function endOfHour(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.endOfHour(getNativePlainTime(record)),
  )
}

export function endOfMinute(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.endOfMinute(getNativePlainTime(record)),
  )
}

export function endOfSecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.endOfSecond(getNativePlainTime(record)),
  )
}

export function endOfMillisecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.endOfMillisecond(getNativePlainTime(record)),
  )
}

export function endOfMicrosecond(record: NativePlainTimeRecord) {
  return createNativePlainTimeRecord(
    TemporalUtils.endOfMicrosecond(getNativePlainTime(record)),
  )
}

export function equals(
  record: NativePlainTimeRecord,
  otherRecord: NativePlainTimeRecord,
): boolean {
  const native = getNativePlainTime(record)
  const otherNative = getNativePlainTime(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativePlainTimeRecord,
  otherRecord: NativePlainTimeRecord,
): NumberSign {
  const native = getNativePlainTime(record)
  const otherNative = getNativePlainTime(otherRecord)
  return NativeTemporal!.PlainTime.compare(native, otherNative) as NumberSign
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativePlainTime)

export function toLocaleString(
  record: NativePlainTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativePlainTime(record).toLocaleString(locales, options)
}

export function toString(
  record: NativePlainTimeRecord,
  options?: Temporal.PlainTimeToStringOptions,
): string {
  return getNativePlainTime(record).toString(options)
}

export function toBasicString(record: NativePlainTimeRecord): string {
  return getNativePlainTime(record).toString()
}
