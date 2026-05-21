import {
  createSlotClass,
  getBrandingAndSlots,
} from '../../apiHelpers/slotClass'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { TimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { Temporal } from '../nativeSwitch'
import { InstantRecordBranding } from '../recordBranding'
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

export const [
  InstantNativeRecord,
  createInstantNativeRecord,
  getInstantNative,
] = createSlotClass(
  InstantRecordBranding,
  (epochNanoseconds: bigint) => new Temporal!.Instant(epochNanoseconds),
  (native) => native.toString(),
  {
    epochMilliseconds: (native: any) => native.epochMilliseconds,
    epochNanoseconds: (native: any) => native.epochNanoseconds,
  },
)

export function create(epochNanoseconds: bigint): InstantNativeRecord {
  return new InstantNativeRecord(epochNanoseconds)
}

export function isRecord(arg: unknown): arg is InstantNativeRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === InstantRecordBranding
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): InstantNativeRecord {
  const resNative = Temporal!.Instant.fromEpochMilliseconds(epochMilliseconds)
  return createInstantNativeRecord(resNative)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): InstantNativeRecord {
  const resNative = Temporal!.Instant.fromEpochNanoseconds(epochNanoseconds)
  return createInstantNativeRecord(resNative)
}

export function fromString(s: string): InstantNativeRecord {
  const resNative = Temporal!.Instant.from(s)
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
  return Temporal!.Instant.compare(native, otherNative)
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
