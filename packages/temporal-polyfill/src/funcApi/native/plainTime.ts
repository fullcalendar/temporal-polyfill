import { Temporal } from 'temporal-spec'
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
import type * as RecordTypes from '../recordTypes'
import { getPlainTimeSlots, setPlainTimeSlots } from '../temporalRecords'
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

type PlainTimeRecord = RecordTypes.PlainTimeRecord
type Format = DateTimeFormatLike<PlainTimeNativeRecord>

export const getPlainTimeNative: (record: unknown) => Temporal.PlainTime =
  getPlainTimeSlots

class _PlainTimeNativeRecord implements TimeFields, PlainTimeRecord {
  declare readonly [RecordTypes.PlainTimeRecordBrand]: undefined

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

function setPlainTimeNative(instance: object, native: Temporal.PlainTime) {
  setPlainTimeSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainTimeNativeRecord(
  native: Temporal.PlainTime,
): PlainTimeNativeRecord {
  const instance = Object.create(PlainTimeNativeRecord.prototype)
  setPlainTimeNative(instance, native)
  return instance
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

export function addHours(
  record: PlainTimeNativeRecord,
  hours: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ hours })
  return createPlainTimeNativeRecord(resNative)
}

export function addMinutes(
  record: PlainTimeNativeRecord,
  minutes: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ minutes })
  return createPlainTimeNativeRecord(resNative)
}

export function addSeconds(
  record: PlainTimeNativeRecord,
  seconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ seconds })
  return createPlainTimeNativeRecord(resNative)
}

export function addMilliseconds(
  record: PlainTimeNativeRecord,
  milliseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ milliseconds })
  return createPlainTimeNativeRecord(resNative)
}

export function addMicroseconds(
  record: PlainTimeNativeRecord,
  microseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ microseconds })
  return createPlainTimeNativeRecord(resNative)
}

export function addNanoseconds(
  record: PlainTimeNativeRecord,
  nanoseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).add({ nanoseconds })
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

export function subtractHours(
  record: PlainTimeNativeRecord,
  hours: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ hours })
  return createPlainTimeNativeRecord(resNative)
}

export function subtractMinutes(
  record: PlainTimeNativeRecord,
  minutes: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ minutes })
  return createPlainTimeNativeRecord(resNative)
}

export function subtractSeconds(
  record: PlainTimeNativeRecord,
  seconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ seconds })
  return createPlainTimeNativeRecord(resNative)
}

export function subtractMilliseconds(
  record: PlainTimeNativeRecord,
  milliseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ milliseconds })
  return createPlainTimeNativeRecord(resNative)
}

export function subtractMicroseconds(
  record: PlainTimeNativeRecord,
  microseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ microseconds })
  return createPlainTimeNativeRecord(resNative)
}

export function subtractNanoseconds(
  record: PlainTimeNativeRecord,
  nanoseconds: number,
): PlainTimeNativeRecord {
  const resNative = getPlainTimeNative(record).subtract({ nanoseconds })
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
  const resNative = native.round(options as any) // !!!
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
  return NativeTemporal!.PlainTime.compare(native, otherNative) as NumberSign
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
  return getPlainTimeNative(record).toString(options as any) // !!!
}

export function toSimpleString(record: PlainTimeNativeRecord): string {
  return getPlainTimeNative(record).toString()
}
