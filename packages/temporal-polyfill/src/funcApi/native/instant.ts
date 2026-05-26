import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { TimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { invalidRecordType, recordValueOf, registerRecord } from './recordUtils'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<InstantNativeRecord>

const instantNativeMap = new WeakMap<object, any>()

export class InstantNativeRecord {
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
    return recordValueOf()
  }
}

function setInstantNative(instance: object, native: any) {
  instantNativeMap.set(instance, native)
  registerRecord(instance, native, (slots) => slots.toString())
}

export function createInstantNativeRecord(native: any): InstantNativeRecord {
  const instance = Object.create(InstantNativeRecord.prototype)
  setInstantNative(instance, native)
  return instance
}

export function getInstantNative(record: unknown): any {
  return getInstantNativeIfPresent(record) || invalidRecordType()
}

export function getInstantNativeIfPresent(record: unknown): any | undefined {
  return typeof record === 'object' && record !== null
    ? instantNativeMap.get(record)
    : undefined
}

// TEMP disabled for size inspection: defineTemporalClass(InstantNativeRecord, ...)

export function create(epochNanoseconds: bigint): InstantNativeRecord {
  return new InstantNativeRecord(epochNanoseconds)
}

export function isRecord(arg: unknown): arg is InstantNativeRecord {
  return !!getInstantNativeIfPresent(arg)
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

// this is equivalent to Temporal's `until`
export function diff(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationNativeRecord {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: InstantNativeRecord,
  options: UnitName | RoundingOptions<TimeUnitName>,
): InstantNativeRecord {
  const native = getInstantNative(record)
  const resNative = native.round(options)
  return createInstantNativeRecord(resNative)
}

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
  return NativeTemporal!.Instant.compare(native, otherNative)
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
  options?: InstantDisplayOptions,
): string {
  return getInstantNative(record).toString(options)
}
