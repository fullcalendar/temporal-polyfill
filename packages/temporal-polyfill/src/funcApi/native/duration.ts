import type { Temporal } from 'temporal-spec'
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

type DurationRecord = RecordTypes.DurationRecord

export const getDurationNative: (record: unknown) => Temporal.Duration =
  getDurationSlots

class _DurationNativeRecord implements DurationFields, DurationRecord {
  declare readonly [RecordTypes.DurationRecordBrand]: undefined

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
    return forbiddenValueOf()
  }
}

function setDurationNative(instance: object, native: Temporal.Duration): void {
  setDurationSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createDurationNativeRecord(
  native: Temporal.Duration,
): DurationNativeRecord {
  const instance = Object.create(DurationNativeRecord.prototype)
  setDurationNative(instance, native)
  return instance
}

export type DurationNativeRecord = _DurationNativeRecord
export const DurationNativeRecord = defineTemporalClass(
  _DurationNativeRecord,
  'Duration',
)

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
  return native.sign as NumberSign // !!!
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
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  const resNative = native.add(otherNative)
  return createDurationNativeRecord(resNative)
}

export function subtract(
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  const resNative = native.subtract(otherNative)
  return createDurationNativeRecord(resNative)
}

export function round(
  duration: DurationNativeRecord,
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationRoundingOptions<RelativeToNativeRecord>,
): DurationNativeRecord {
  const native = getDurationNative(duration)
  if (typeof options === 'string') {
    return createDurationNativeRecord(native.round(options))
  }
  const resNative = native.round({
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

export function total(
  duration: DurationNativeRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<RelativeToNativeRecord>,
): number {
  const native = getDurationNative(duration)

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
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
  options?: RelativeToOptions<RelativeToNativeRecord>,
): NumberSign {
  const native = getDurationNative(duration)
  const otherNative = getDurationNative(otherDuration)
  return NativeTemporal!.Duration.compare(native, otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  }) as NumberSign // !!!
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
  options?: Temporal.DurationToStringOptions,
): string {
  return getDurationNative(duration).toString(options)
}

export function toSimpleString(duration: DurationNativeRecord): string {
  return getDurationNative(duration).toString()
}

// Util
// ----

type RelativeToNativeRecord = RelativeToRecord<
  RecordTypes.ZonedDateTimeRecord,
  RecordTypes.PlainDateTimeRecord,
  RecordTypes.PlainDateRecord
>

type RelativeToNative =
  | Temporal.ZonedDateTime
  | Temporal.PlainDateTime
  | Temporal.PlainDate

function refineRelativeTo(
  arg?: RelativeToNativeRecord,
): RelativeToNative | undefined {
  if (arg) {
    const native =
      getZonedDateTimeSlotsIfPresent(arg) ||
      getPlainDateTimeSlotsIfPresent(arg) ||
      getPlainDateSlotsIfPresent(arg)

    if (native) {
      return native as RelativeToNative
    }
    // otherwise, throw error?
  }
}
