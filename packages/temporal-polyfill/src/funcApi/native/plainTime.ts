import { createSlotClass } from '../../apiHelpers/slotClass'
import { TimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../../internal/optionsModel'
import { TimeUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { Temporal } from '../nativeSwitch'
import { PlainTimeRecordBranding } from '../recordBranding'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'

export type PlainTimeNativeRecord = any & TimeFields
type Format = DateTimeFormatLike<PlainTimeNativeRecord>

export const [
  PlainTimeNativeRecord,
  createPlainTimeNativeRecord,
  getPlainTimeNative,
] = createSlotClass(
  PlainTimeRecordBranding,
  (
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
  ) =>
    new Temporal!.PlainTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
    ),
  (native) => native.toString(),
  {
    hour: (native: any) => native.hour,
    minute: (native: any) => native.minute,
    second: (native: any) => native.second,
    millisecond: (native: any) => native.millisecond,
    microsecond: (native: any) => native.microsecond,
    nanosecond: (native: any) => native.nanosecond,
  },
  {},
  {},
)

export function create(
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
): PlainTimeNativeRecord {
  return new PlainTimeNativeRecord(
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  )
}

export function fromFields(
  fields: Partial<TimeFields>,
  options?: OverflowOptions,
): PlainTimeNativeRecord {
  const resNative = Temporal!.PlainTime.from(fields, options)
  return createPlainTimeNativeRecord(resNative)
}

export function fromString(s: string): PlainTimeNativeRecord {
  const resNative = Temporal!.PlainTime.from(s)
  return createPlainTimeNativeRecord(resNative)
}

export function withFields(
  record: PlainTimeNativeRecord,
  mod: Partial<TimeFields>,
  options?: OverflowOptions,
): PlainTimeNativeRecord {
  const native = getPlainTimeNative(record)
  const resNative = native.with(mod, options)
  return createPlainTimeNativeRecord(resNative)
}

export function add(
  record: PlainTimeNativeRecord,
  duration: DurationNativeRecord,
): PlainTimeNativeRecord {
  const native = getPlainTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative)
  return createPlainTimeNativeRecord(resNative)
}

export function subtract(
  record: PlainTimeNativeRecord,
  duration: DurationNativeRecord,
): PlainTimeNativeRecord {
  const native = getPlainTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative)
  return createPlainTimeNativeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainTimeNativeRecord,
  otherRecord: PlainTimeNativeRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationNativeRecord {
  const native = getPlainTimeNative(record)
  const otherNative = getPlainTimeNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: PlainTimeNativeRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): PlainTimeNativeRecord {
  const native = getPlainTimeNative(record)
  const resNative = native.round(options)
  return createPlainTimeNativeRecord(resNative)
}

export function equals(
  record: PlainTimeNativeRecord,
  otherRecord: PlainTimeNativeRecord,
): boolean {
  const native = getPlainTimeNative(record)
  const otherNative = getPlainTimeNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: PlainTimeNativeRecord,
  otherRecord: PlainTimeNativeRecord,
): NumberSign {
  const native = getPlainTimeNative(record)
  const otherNative = getPlainTimeNative(otherRecord)
  return Temporal!.PlainTime.compare(native, otherNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainTimeNative, locales, options)
}

export function toLocaleString(
  record: PlainTimeNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainTimeNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainTimeNativeRecord,
  options?: TimeDisplayOptions,
): string {
  return getPlainTimeNative(record).toString(options)
}
