import { createSlotClass } from '../../classApi/slotClass'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { TimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { InstantRecordBranding } from '../common-branding'
import { DateTimeFormatLike } from '../dateTimeFormat'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

export type InstantNativeRecord = any
type Format = DateTimeFormatLike<InstantNativeRecord>

const bigNanoInSec = 1000000000n
const bigNanoInMicro = 1000n

type ToZonedDateTimeOptions = {
  timeZone: string
  calendar: string
}

export const [
  InstantNativeRecord,
  createInstantNativeRecord,
  getInstantNative,
] = createSlotClass(
  InstantRecordBranding,
  (epochNanoseconds: bigint) =>
    new (globalThis as any).Temporal.Instant(epochNanoseconds),
  (native) => native.toString(),
  {
    epochSeconds: (native: any) => native.epochSeconds,
    epochMilliseconds: (native: any) => native.epochMilliseconds,
    epochMicroseconds: (native: any) => native.epochMicroseconds,
    epochNanoseconds: (native: any) => native.epochNanoseconds,
  },
  {},
  {},
)

export function create(epochNanoseconds: bigint): InstantNativeRecord {
  return new InstantNativeRecord(epochNanoseconds)
}

export function fromEpochSeconds(epochSeconds: number): InstantNativeRecord {
  const resNative = (globalThis as any).Temporal.Instant.fromEpochNanoseconds(
    BigInt(epochSeconds) * bigNanoInSec,
  )
  return createInstantNativeRecord(resNative)
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): InstantNativeRecord {
  const resNative = (globalThis as any).Temporal.Instant.fromEpochMilliseconds(
    epochMilliseconds,
  )
  return createInstantNativeRecord(resNative)
}

export function fromEpochMicroseconds(
  epochMicroseconds: bigint,
): InstantNativeRecord {
  const resNative = (globalThis as any).Temporal.Instant.fromEpochNanoseconds(
    BigInt(epochMicroseconds) * bigNanoInMicro,
  )
  return createInstantNativeRecord(resNative)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): InstantNativeRecord {
  const resNative = (globalThis as any).Temporal.Instant.fromEpochNanoseconds(
    epochNanoseconds,
  )
  return createInstantNativeRecord(resNative)
}

export function fromString(s: string): InstantNativeRecord {
  const resNative = (globalThis as any).Temporal.Instant.from(s)
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

export function until(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationNativeRecord {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function since(
  record: InstantNativeRecord,
  otherRecord: InstantNativeRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationNativeRecord {
  const native = getInstantNative(record)
  const otherNative = getInstantNative(otherRecord)
  const resNative = native.since(otherNative, options)
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
  return (globalThis as any).Temporal.Instant.compare(native, otherNative)
}

export function toZonedDateTime(
  record: InstantNativeRecord,
  options: ToZonedDateTimeOptions,
): ZonedDateTimeNativeRecord {
  const native = getInstantNative(record)
  const resNative = native.toZonedDateTime(options)
  return createZonedDateTimeNativeRecord(resNative)
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
