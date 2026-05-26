import { DurationFields } from '../../internal/durationFields'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
  TimeDisplayOptions,
} from '../../internal/optionsModel'
import { UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { RelativeToRecord } from '../commonTypes'
import { PlainDateNativeRecord, getPlainDateNativeIfPresent } from './plainDate'
import {
  PlainDateTimeNativeRecord,
  getPlainDateTimeNativeIfPresent,
} from './plainDateTime'
import { invalidRecordType, recordValueOf, registerRecord } from './recordUtils'
import {
  ZonedDateTimeNativeRecord,
  getZonedDateTimeNativeIfPresent,
} from './zonedDateTime'

const durationNativeMap = new WeakMap<object, any>()

export class DurationNativeRecord implements DurationFields {
  constructor(
    years?: number,
    months?: number,
    weeks?: number,
    days?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number,
    microseconds?: number,
    nanoseconds?: number,
  ) {
    setDurationNative(
      this,
      new NativeTemporal!.Duration(
        years,
        months,
        weeks,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
        microseconds,
        nanoseconds,
      ),
    )
  }

  get years() {
    return getDurationNative(this).years
  }

  get months() {
    return getDurationNative(this).months
  }

  get weeks() {
    return getDurationNative(this).weeks
  }

  get days() {
    return getDurationNative(this).days
  }

  get hours() {
    return getDurationNative(this).hours
  }

  get minutes() {
    return getDurationNative(this).minutes
  }

  get seconds() {
    return getDurationNative(this).seconds
  }

  get milliseconds() {
    return getDurationNative(this).milliseconds
  }

  get microseconds() {
    return getDurationNative(this).microseconds
  }

  get nanoseconds() {
    return getDurationNative(this).nanoseconds
  }

  toJSON() {
    return getDurationNative(this).toString()
  }

  valueOf() {
    return recordValueOf()
  }
}

function setDurationNative(instance: object, native: any) {
  durationNativeMap.set(instance, native)
  registerRecord(instance, native, (slots) => slots.toString())
}

export function createDurationNativeRecord(native: any): DurationNativeRecord {
  const instance = Object.create(DurationNativeRecord.prototype)
  setDurationNative(instance, native)
  return instance
}

export function getDurationNative(record: unknown): any {
  return getDurationNativeIfPresent(record) || invalidRecordType()
}

export function getDurationNativeIfPresent(record: unknown): any | undefined {
  return typeof record === 'object' && record !== null
    ? durationNativeMap.get(record)
    : undefined
}

// TEMP disabled for size inspection: defineTemporalClass(DurationNativeRecord, ...)

export function create(
  years?: number,
  months?: number,
  weeks?: number,
  days?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number,
  microseconds?: number,
  nanoseconds?: number,
): DurationNativeRecord {
  return new DurationNativeRecord(
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  )
}

export function isRecord(arg: unknown): arg is DurationNativeRecord {
  return !!getDurationNativeIfPresent(arg)
}

export function fromFields(
  fields: Partial<DurationFields>,
): DurationNativeRecord {
  const resNative = NativeTemporal!.Duration.from(fields)
  return createDurationNativeRecord(resNative)
}

export function fromString(s: string): DurationNativeRecord {
  const resNative = NativeTemporal!.Duration.from(s)
  return createDurationNativeRecord(resNative)
}

export function sign(duration: DurationNativeRecord): NumberSign {
  const native = getDurationNative(duration)
  return native.sign
}

export function blank(duration: DurationNativeRecord): boolean {
  const native = getDurationNative(duration)
  return native.blank
}

export function withFields(
  duration: DurationNativeRecord,
  mod: Partial<DurationFields>,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const resNative = native.with(mod)
  return createDurationNativeRecord(resNative)
}

export function negated(duration: DurationNativeRecord): DurationNativeRecord {
  const native = getDurationNative(duration)
  const resNative = native.negated()
  return createDurationNativeRecord(resNative)
}

export function abs(duration: DurationNativeRecord): DurationNativeRecord {
  const native = getDurationNative(duration)
  const resNative = native.abs()
  return createDurationNativeRecord(resNative)
}

export function add(
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
  options?: RelativeToOptions<
    PlainDateNativeRecord | ZonedDateTimeNativeRecord
  >,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  const resNative = native.add(otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

export function subtract(
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
  options?: RelativeToOptions<RelativeToNativeRecord>,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  const resNative = native.subtract(otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

export function round(
  duration: DurationNativeRecord,
  options: DurationRoundingOptions<RelativeToNativeRecord>,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const resNative = native.round({
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

export function total(
  duration: DurationNativeRecord,
  options: UnitName | DurationTotalOptions<RelativeToNativeRecord>,
): number {
  const native = getDurationNative(duration)
  return native.total(refineTotalOptions(options))
}

export function compare(
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
  options?: RelativeToOptions<RelativeToNativeRecord>,
): NumberSign {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  return NativeTemporal!.Duration.compare(native, otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
}

export function toLocaleString(
  duration: DurationNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(duration)
    : toString(duration)
}

export function toString(
  duration: DurationNativeRecord,
  options?: TimeDisplayOptions,
): string {
  return getDurationNative(duration).toString(options)
}

// Util
// ----

type RelativeToNativeRecord = RelativeToRecord<
  ZonedDateTimeNativeRecord,
  PlainDateTimeNativeRecord,
  PlainDateNativeRecord
>

function refineTotalOptions(
  options: UnitName | DurationTotalOptions<RelativeToNativeRecord>,
) {
  return typeof options === 'string'
    ? options
    : {
        ...options,
        relativeTo: refineRelativeTo(options.relativeTo),
      }
}

function refineRelativeTo(arg?: RelativeToNativeRecord): any | undefined {
  if (arg) {
    const native =
      getZonedDateTimeNativeIfPresent(arg) ||
      getPlainDateTimeNativeIfPresent(arg) ||
      getPlainDateNativeIfPresent(arg)

    if (native) {
      return native // native ZonedDateTime / PlainDateTime / PlainDate
    }
    // otherwise, throw error?
  }
}
