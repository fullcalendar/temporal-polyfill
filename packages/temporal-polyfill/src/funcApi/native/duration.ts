import type { Temporal } from 'temporal-spec'
import { DurationBranding } from '../../apiHelpers/branding'
import { DurationFields } from '../../internal/durationFields'
import { LocalesArg } from '../../internal/intlFormatUtils'
import type {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
} from '../../internal/temporalSpecHelpers'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { RelativeToRecord } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getDurationSlots,
  getPlainDateSlotsIfPresent,
  getPlainDateTimeSlotsIfPresent,
  getZonedDateTimeSlotsIfPresent,
  setDurationSlots,
} from '../temporalRecords'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'

export const getNativeDuration: (record: unknown) => Temporal.Duration =
  getDurationSlots

export type NativeDurationRecord = InstanceType<typeof NativeDurationRecord> &
  RecordTypes.DurationRecord
export const NativeDurationRecord = defineTemporalClass(
  DurationBranding,
  class implements DurationFields {
    get years() {
      return getNativeDuration(this).years
    }

    get months() {
      return getNativeDuration(this).months
    }

    get weeks() {
      return getNativeDuration(this).weeks
    }

    get days() {
      return getNativeDuration(this).days
    }

    get hours() {
      return getNativeDuration(this).hours
    }

    get minutes() {
      return getNativeDuration(this).minutes
    }

    get seconds() {
      return getNativeDuration(this).seconds
    }

    get milliseconds() {
      return getNativeDuration(this).milliseconds
    }

    get microseconds() {
      return getNativeDuration(this).microseconds
    }

    get nanoseconds() {
      return getNativeDuration(this).nanoseconds
    }

    toJSON() {
      return getNativeDuration(this).toString()
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
)

export function createNativeDurationRecord(
  native: Temporal.Duration,
): NativeDurationRecord {
  const instance = Object.create(NativeDurationRecord.prototype)
  setDurationSlots(instance, native)
  attachDebugString(instance)
  return instance
}

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
): NativeDurationRecord {
  return createNativeDurationRecord(
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

export function fromFields(
  fields: Partial<DurationFields>,
): NativeDurationRecord {
  const resNative = NativeTemporal!.Duration.from(fields)
  return createNativeDurationRecord(resNative)
}

export function fromString(s: string): NativeDurationRecord {
  const resNative = NativeTemporal!.Duration.from(s)
  return createNativeDurationRecord(resNative)
}

export function sign(duration: NativeDurationRecord): NumberSign {
  const native = getNativeDuration(duration)
  return native.sign as NumberSign // !!!
}

export function blank(duration: NativeDurationRecord): boolean {
  const native = getNativeDuration(duration)
  return native.blank
}

export function withFields(
  duration: NativeDurationRecord,
  mod: Partial<DurationFields>,
): NativeDurationRecord {
  const native = getNativeDuration(duration)
  const resNative = native.with(mod)
  return createNativeDurationRecord(resNative)
}

export function negated(duration: NativeDurationRecord): NativeDurationRecord {
  const native = getNativeDuration(duration)
  const resNative = native.negated()
  return createNativeDurationRecord(resNative)
}

export function abs(duration: NativeDurationRecord): NativeDurationRecord {
  const native = getNativeDuration(duration)
  const resNative = native.abs()
  return createNativeDurationRecord(resNative)
}

export function add(
  duration: NativeDurationRecord,
  otherDuration: NativeDurationRecord,
): NativeDurationRecord {
  const native = getNativeDuration(duration)
  const otherNative = getNativeDuration(otherDuration)
  const resNative = native.add(otherNative)
  return createNativeDurationRecord(resNative)
}

export function subtract(
  duration: NativeDurationRecord,
  otherDuration: NativeDurationRecord,
): NativeDurationRecord {
  const native = getNativeDuration(duration)
  const otherNative = getNativeDuration(otherDuration)
  const resNative = native.subtract(otherNative)
  return createNativeDurationRecord(resNative)
}

export function round(
  duration: NativeDurationRecord,
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationRoundingOptions<NativeRelativeToRecord>,
): NativeDurationRecord {
  const native = getNativeDuration(duration)
  if (typeof options === 'string') {
    return createNativeDurationRecord(native.round(options))
  }
  const resNative = native.round({
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createNativeDurationRecord(resNative)
}

export function total(
  duration: NativeDurationRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<NativeRelativeToRecord>,
): number {
  const native = getNativeDuration(duration)

  // TODO: better pattern for this?
  if (typeof options === 'string') {
    return native.total(options)
  }
  const refinedOptions: Temporal.DurationTotalOptions = {
    ...options,
    relativeTo: refineRelativeTo(options.relativeTo),
  }

  return native.total(refinedOptions)
}

export function compare(
  duration: NativeDurationRecord,
  otherDuration: NativeDurationRecord,
  options?: RelativeToOptions<NativeRelativeToRecord>,
): NumberSign {
  const native = getNativeDuration(duration)
  const otherNative = getNativeDuration(otherDuration)
  return NativeTemporal!.Duration.compare(native, otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  }) as NumberSign // !!!
}

export function toLocaleString(
  duration: NativeDurationRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(duration)
    : toString(duration)
}

export function toString(
  duration: NativeDurationRecord,
  options?: Temporal.DurationToStringOptions,
): string {
  return getNativeDuration(duration).toString(options)
}

export function toBasicString(duration: NativeDurationRecord): string {
  return getNativeDuration(duration).toString()
}

// Util
// ----

type NativeRelativeToRecord = RelativeToRecord<
  RecordTypes.ZonedDateTimeRecord,
  RecordTypes.PlainDateTimeRecord,
  RecordTypes.PlainDateRecord
>

type NativeRelativeTo =
  | Temporal.ZonedDateTime
  | Temporal.PlainDateTime
  | Temporal.PlainDate

function refineRelativeTo(
  arg?: NativeRelativeToRecord,
): NativeRelativeTo | undefined {
  if (arg) {
    const native =
      getZonedDateTimeSlotsIfPresent(arg) ||
      getPlainDateTimeSlotsIfPresent(arg) ||
      getPlainDateSlotsIfPresent(arg)

    if (native) {
      return native as NativeRelativeTo
    }
    // otherwise, throw error?
  }
}
