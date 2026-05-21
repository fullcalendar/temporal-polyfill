import {
  createSlotClass,
  getBrandingAndSlots,
} from '../../apiHelpers/slotClass'
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
import { RelativeToRecord } from '../commonTypes'
import { Temporal } from '../nativeSwitch'
import {
  DurationRecordBranding,
  PlainDateRecordBranding,
  PlainDateTimeRecordBranding,
  ZonedDateTimeRecordBranding,
} from '../recordBranding'
import { PlainDateNativeRecord } from './plainDate'
import { PlainDateTimeNativeRecord } from './plainDateTime'
import { ZonedDateTimeNativeRecord } from './zonedDateTime'

export type DurationNativeRecord = DurationFields

export const [
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
] = createSlotClass(
  DurationRecordBranding,
  (...args: any[]) => new Temporal!.Duration(...args),
  (native) => native.toString(),
  {
    years: (native: any) => native.years,
    months: (native: any) => native.months,
    weeks: (native: any) => native.weeks,
    days: (native: any) => native.days,
    hours: (native: any) => native.hours,
    minutes: (native: any) => native.minutes,
    seconds: (native: any) => native.seconds,
    milliseconds: (native: any) => native.milliseconds,
    microseconds: (native: any) => native.microseconds,
    nanoseconds: (native: any) => native.nanoseconds,
  },
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

export function isRecord(arg: unknown): arg is DurationNativeRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === DurationRecordBranding
}

export function fromFields(
  fields: Partial<DurationFields>,
): DurationNativeRecord {
  const resNative = Temporal!.Duration.from(fields)
  return createDurationNativeRecord(resNative)
}

export function fromString(s: string): DurationNativeRecord {
  const resNative = Temporal!.Duration.from(s)
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
  return Temporal!.Duration.compare(native, otherNative, {
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
    const brandingAndSlots = getBrandingAndSlots(arg)
    if (brandingAndSlots) {
      const [branding, native] = brandingAndSlots
      if (
        branding === ZonedDateTimeRecordBranding ||
        branding === PlainDateTimeRecordBranding ||
        branding === PlainDateRecordBranding
      ) {
        return native // native ZonedDateTime / PlainDateTime / PlainDate
      }
    }
    // otherwise, throw error?
  }
}
