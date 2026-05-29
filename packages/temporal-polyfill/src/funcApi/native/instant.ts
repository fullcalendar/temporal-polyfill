import { Temporal } from 'temporal-spec'
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
import type * as RecordTypes from '../recordTypes'
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
  const resNative = native.round(options as any) // !!!
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
  options?: InstantDisplayOptions,
): string {
  return getInstantNative(record).toString(options as any) // !!!
}

export function toSimpleString(record: InstantNativeRecord): string {
  return getInstantNative(record).toString()
}
