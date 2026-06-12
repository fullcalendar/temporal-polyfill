import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { InstantBranding } from '../../apiHelpers/branding'
import { LocalesArg } from '../../internal/intlFormatUtils'
import type { InstantStringTimeZoneDisplayOptions } from '../../internal/temporalSpecHelpers'
import { NumberSign, bindArgs } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike, NativeDiffFunc } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { getInstantSlots, setInstantSlots } from '../temporalRecords'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import {
  NativeDurationRecord,
  createNativeDurationRecord,
  getNativeDuration,
} from './duration'
import {
  ForbiddenValueOfMixin,
  attachDebugString,
  defineTemporalClass,
} from './recordUtils'
import { createRoundToOptions } from './roundUtils'
import {
  NativeZonedDateTimeRecord,
  createNativeZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<NativeInstantRecord>

export const getNativeInstant: (record: unknown) => Temporal.Instant =
  getInstantSlots

export type NativeInstantRecord = InstanceType<typeof NativeInstantRecord> &
  RecordTypes.InstantRecord
export const NativeInstantRecord = defineTemporalClass(
  InstantBranding,
  class {
    get epochMilliseconds() {
      return getNativeInstant(this).epochMilliseconds
    }

    get epochNanoseconds() {
      return getNativeInstant(this).epochNanoseconds
    }

    toJSON() {
      return getNativeInstant(this).toString()
    }
  },
  ForbiddenValueOfMixin,
)

export function createNativeInstantRecord(
  native: Temporal.Instant,
): NativeInstantRecord {
  const instance = Object.create(NativeInstantRecord.prototype)
  setInstantSlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(epochNanoseconds: bigint): NativeInstantRecord {
  return createNativeInstantRecord(
    new NativeTemporal!.Instant(epochNanoseconds),
  )
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): NativeInstantRecord {
  const resNative =
    NativeTemporal!.Instant.fromEpochMilliseconds(epochMilliseconds)
  return createNativeInstantRecord(resNative)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): NativeInstantRecord {
  const resNative =
    NativeTemporal!.Instant.fromEpochNanoseconds(epochNanoseconds)
  return createNativeInstantRecord(resNative)
}

export function fromString(s: string): NativeInstantRecord {
  const resNative = NativeTemporal!.Instant.from(s)
  return createNativeInstantRecord(resNative)
}

export function add(
  record: NativeInstantRecord,
  durationRecord: NativeDurationRecord,
): NativeInstantRecord {
  const native = getNativeInstant(record)
  const durationNative = getNativeDuration(durationRecord)
  const resNative = native.add(durationNative)
  return createNativeInstantRecord(resNative)
}

export function subtract(
  record: NativeInstantRecord,
  durationRecord: NativeDurationRecord,
): NativeInstantRecord {
  const native = getNativeInstant(record)
  const durationNative = getNativeDuration(durationRecord)
  const resNative = native.subtract(durationNative)
  return createNativeInstantRecord(resNative)
}

export function addHours(
  record: NativeInstantRecord,
  hours: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ hours })
  return createNativeInstantRecord(resNative)
}

export function addMinutes(
  record: NativeInstantRecord,
  minutes: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ minutes })
  return createNativeInstantRecord(resNative)
}

export function addSeconds(
  record: NativeInstantRecord,
  seconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ seconds })
  return createNativeInstantRecord(resNative)
}

export function addMilliseconds(
  record: NativeInstantRecord,
  milliseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ milliseconds })
  return createNativeInstantRecord(resNative)
}

export function addMicroseconds(
  record: NativeInstantRecord,
  microseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ microseconds })
  return createNativeInstantRecord(resNative)
}

export function addNanoseconds(
  record: NativeInstantRecord,
  nanoseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).add({ nanoseconds })
  return createNativeInstantRecord(resNative)
}

export function subtractHours(
  record: NativeInstantRecord,
  hours: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ hours })
  return createNativeInstantRecord(resNative)
}

export function subtractMinutes(
  record: NativeInstantRecord,
  minutes: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ minutes })
  return createNativeInstantRecord(resNative)
}

export function subtractSeconds(
  record: NativeInstantRecord,
  seconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ seconds })
  return createNativeInstantRecord(resNative)
}

export function subtractMilliseconds(
  record: NativeInstantRecord,
  milliseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ milliseconds })
  return createNativeInstantRecord(resNative)
}

export function subtractMicroseconds(
  record: NativeInstantRecord,
  microseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ microseconds })
  return createNativeInstantRecord(resNative)
}

export function subtractNanoseconds(
  record: NativeInstantRecord,
  nanoseconds: number,
): NativeInstantRecord {
  const resNative = getNativeInstant(record).subtract({ nanoseconds })
  return createNativeInstantRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativeInstantRecord,
  otherRecord: NativeInstantRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): NativeDurationRecord {
  const native = getNativeInstant(record)
  const otherNative = getNativeInstant(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

export function diffHours(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffHours as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

export function diffMinutes(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMinutes as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

export function diffSeconds(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffSeconds as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

export function diffMilliseconds(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMilliseconds as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

export function diffMicroseconds(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMicroseconds as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

export function diffNanoseconds(
  record0: NativeInstantRecord,
  record1: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffNanoseconds as NativeDiffFunc<Temporal.Instant>)(
    getNativeInstant(record0) as any,
    getNativeInstant(record1) as any,
    options,
  )
}

function round(
  record: NativeInstantRecord,
  options: Temporal.RoundingOptions<Temporal.TimeUnit>,
): NativeInstantRecord {
  const native = getNativeInstant(record)
  const resNative = native.round(options)
  return createNativeInstantRecord(resNative)
}

function roundToUnit(
  smallestUnit: Temporal.PluralizeUnit<Temporal.TimeUnit>,
  record: NativeInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativeInstantRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToHour = bindArgs(roundToUnit, 'hour')
export const roundToMinute = bindArgs(roundToUnit, 'minute')
export const roundToSecond = bindArgs(roundToUnit, 'second')
export const roundToMillisecond = bindArgs(roundToUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToUnit, 'microsecond')

export function equals(
  record: NativeInstantRecord,
  otherRecord: NativeInstantRecord,
): boolean {
  const native = getNativeInstant(record)
  const otherNative = getNativeInstant(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativeInstantRecord,
  otherRecord: NativeInstantRecord,
): NumberSign {
  const native = getNativeInstant(record)
  const otherNative = getNativeInstant(otherRecord)
  return NativeTemporal!.Instant.compare(native, otherNative) as NumberSign // !!!
}

export function toZonedDateTimeISO(
  record: NativeInstantRecord,
  timeZoneId: string,
): NativeZonedDateTimeRecord {
  const native = getNativeInstant(record)
  const resNative = native.toZonedDateTimeISO(timeZoneId)
  return createNativeZonedDateTimeRecord(resNative)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativeInstant)

export function toLocaleString(
  record: NativeInstantRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativeInstant(record).toLocaleString(locales, options)
}

export function toString(
  record: NativeInstantRecord,
  options?: InstantStringTimeZoneDisplayOptions,
): string {
  return getNativeInstant(record).toString(options)
}

export function toBasicString(record: NativeInstantRecord): string {
  return getNativeInstant(record).toString()
}
