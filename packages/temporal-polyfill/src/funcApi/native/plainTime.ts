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
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import {
  getPlainTimeRecordIfPresent,
  setPlainTimeRecord,
} from '../temporalRecords'
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
  invalidRecordType,
} from './recordUtils'

type Format = DateTimeFormatLike<PlainTimeNativeRecord>

class _PlainTimeNativeRecord implements TimeFields {
  constructor(
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
  ) {
    setPlainTimeNative(
      this,
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

  get hour() {
    return getPlainTimeNative(this).hour
  }

  get minute() {
    return getPlainTimeNative(this).minute
  }

  get second() {
    return getPlainTimeNative(this).second
  }

  get millisecond() {
    return getPlainTimeNative(this).millisecond
  }

  get microsecond() {
    return getPlainTimeNative(this).microsecond
  }

  get nanosecond() {
    return getPlainTimeNative(this).nanosecond
  }

  toJSON() {
    return getPlainTimeNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainTimeNative(instance: object, native: any) {
  setPlainTimeRecord(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainTimeNativeRecord(
  native: any,
): PlainTimeNativeRecord {
  const instance = Object.create(PlainTimeNativeRecord.prototype)
  setPlainTimeNative(instance, native)
  return instance
}

export function getPlainTimeNative(record: unknown): any {
  return getPlainTimeRecordIfPresent(record) || invalidRecordType()
}

export type PlainTimeNativeRecord = _PlainTimeNativeRecord
export const PlainTimeNativeRecord = defineTemporalClass(
  _PlainTimeNativeRecord,
  'PlainTime',
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
  const resNative = NativeTemporal!.PlainTime.from(fields, options)
  return createPlainTimeNativeRecord(resNative)
}

export function fromString(s: string): PlainTimeNativeRecord {
  const resNative = NativeTemporal!.PlainTime.from(s)
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
  return NativeTemporal!.PlainTime.compare(native, otherNative)
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

export function toSimpleString(record: PlainTimeNativeRecord): string {
  return getPlainTimeNative(record).toString()
}
