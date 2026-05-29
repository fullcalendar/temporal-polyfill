import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import { LocalesArg } from '../../internal/intlFormatUtils'
import type {
  InstantStringTimeZoneDisplayOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/temporalSpecHelpers'
import { NumberSign, bindArgs } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { createRoundToOptions } from '../roundTo'
import { getInstantSlots, setInstantSlots } from '../temporalRecords'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

type InstantRecord = RecordTypes.InstantRecord

type Format = DateTimeFormatLike<InstantNativeRecord>

export const getInstantNative: (record: unknown) => Temporal.Instant =
  getInstantSlots

class _InstantNativeRecord implements InstantRecord {
  declare readonly [RecordTypes.InstantRecordBrand]: undefined

  constructor(epochNanoseconds: bigint) {
    setInstantNative(this, new NativeTemporal!.Instant(epochNanoseconds))
  }

  get epochMilliseconds() {
    return getInstantNative(this).epochMilliseconds
  }

  get epochNanoseconds() {
    return getInstantNative(this).epochNanoseconds
  }

  toJSON() {
    return getInstantNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setInstantNative(instance: object, native: Temporal.Instant) {
  setInstantSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createInstantNativeRecord(
  native: Temporal.Instant,
): InstantNativeRecord {
  const instance = Object.create(InstantNativeRecord.prototype)
  setInstantNative(instance, native)
  return instance
}

export type InstantNativeRecord = _InstantNativeRecord
export const InstantNativeRecord = defineTemporalClass(
  _InstantNativeRecord,
  'Instant',
)

export function create(epochNanoseconds: bigint): InstantNativeRecord {
  return new InstantNativeRecord(epochNanoseconds)
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): InstantNativeRecord {
  const resNative =
    NativeTemporal!.Instant.fromEpochMilliseconds(epochMilliseconds)
  return createInstantNativeRecord(resNative)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): InstantNativeRecord {
  const resNative =
    NativeTemporal!.Instant.fromEpochNanoseconds(epochNanoseconds)
  return createInstantNativeRecord(resNative)
}

export function fromString(s: string): InstantNativeRecord {
  const resNative = NativeTemporal!.Instant.from(s)
  return createInstantNativeRecord(resNative)
}

export function add(
  record: InstantNativeRecord,
  durationRecord: DurationNativeRecord,
): InstantNativeRecord {
  const native = getInstantNative(record)
  const durationNative = getDurationNative(durationRecord)
  const resNative = native.add(durationNative)
  return createInstantNativeRecord(resNative)
}

export function subtract(
  record: InstantNativeRecord,
  durationRecord: DurationNativeRecord,
): InstantNativeRecord {
  const native = getInstantNative(record)
  const durationNative = getDurationNative(durationRecord)
  const resNative = native.subtract(durationNative)
  return createInstantNativeRecord(resNative)
}

export function addHours(
  record: InstantNativeRecord,
  hours: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ hours })
  return createInstantNativeRecord(resNative)
}

export function addMinutes(
  record: InstantNativeRecord,
  minutes: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ minutes })
  return createInstantNativeRecord(resNative)
}

export function addSeconds(
  record: InstantNativeRecord,
  seconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ seconds })
  return createInstantNativeRecord(resNative)
}

export function addMilliseconds(
  record: InstantNativeRecord,
  milliseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ milliseconds })
  return createInstantNativeRecord(resNative)
}

export function addMicroseconds(
  record: InstantNativeRecord,
  microseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ microseconds })
  return createInstantNativeRecord(resNative)
}

export function addNanoseconds(
  record: InstantNativeRecord,
  nanoseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).add({ nanoseconds })
  return createInstantNativeRecord(resNative)
}

export function subtractHours(
  record: InstantNativeRecord,
  hours: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ hours })
  return createInstantNativeRecord(resNative)
}

export function subtractMinutes(
  record: InstantNativeRecord,
  minutes: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ minutes })
  return createInstantNativeRecord(resNative)
}

export function subtractSeconds(
  record: InstantNativeRecord,
  seconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ seconds })
  return createInstantNativeRecord(resNative)
}

export function subtractMilliseconds(
  record: InstantNativeRecord,
  milliseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ milliseconds })
  return createInstantNativeRecord(resNative)
}

export function subtractMicroseconds(
  record: InstantNativeRecord,
  microseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ microseconds })
  return createInstantNativeRecord(resNative)
}

export function subtractNanoseconds(
  record: InstantNativeRecord,
  nanoseconds: number,
): InstantNativeRecord {
  const resNative = getInstantNative(record).subtract({ nanoseconds })
  return createInstantNativeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationNativeRecord {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function diffHours(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffHours(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

export function diffMinutes(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMinutes(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

export function diffSeconds(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffSeconds(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

export function diffMilliseconds(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMilliseconds(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

export function diffMicroseconds(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMicroseconds(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

export function diffNanoseconds(
  record0: InstantNativeRecord,
  record1: InstantNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffNanoseconds(
    getInstantNative(record0) as any,
    getInstantNative(record1) as any,
    options,
  )
}

function round(
  record: InstantNativeRecord,
  options: Temporal.RoundingOptions<Temporal.TimeUnit>,
): InstantNativeRecord {
  const native = getInstantNative(record)
  const resNative = native.round(options)
  return createInstantNativeRecord(resNative)
}

function roundToUnit(
  smallestUnit: Temporal.PluralizeUnit<Temporal.TimeUnit>,
  record: InstantNativeRecord,
  options?: RoundingMathOptions,
): InstantNativeRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToHour = bindArgs(roundToUnit, 'hour')
export const roundToMinute = bindArgs(roundToUnit, 'minute')
export const roundToSecond = bindArgs(roundToUnit, 'second')
export const roundToMillisecond = bindArgs(roundToUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToUnit, 'microsecond')

export function equals(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
): boolean {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
): NumberSign {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  return NativeTemporal!.Instant.compare(native, otherNative) as NumberSign // !!!
}

export function toZonedDateTimeISO(
  record: InstantNativeRecord,
  timeZoneId: string,
): ZonedDateTimeNativeRecord {
  const native = getInstantNative(record)
  const resNative = native.toZonedDateTimeISO(timeZoneId)
  return createZonedDateTimeNativeRecord(resNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getInstantNative, locales, options)
}

export function toLocaleString(
  record: InstantNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getInstantNative(record).toLocaleString(locales, options)
}

export function toString(
  record: InstantNativeRecord,
  options?: InstantStringTimeZoneDisplayOptions,
): string {
  return getInstantNative(record).toString(options)
}

export function toSimpleString(record: InstantNativeRecord): string {
  return getInstantNative(record).toString()
}
