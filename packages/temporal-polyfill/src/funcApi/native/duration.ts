import { createSlotClass, getBrandingAndSlots } from '../../classApi/slotClass'
import { DurationFields } from '../../internal/durationFields'
import {
  DurationRoundingOptions,
  RelativeToOptions,
} from '../../internal/optionsModel'
import { NumberSign } from '../../internal/utils'
import {
  DurationRecordBranding,
  PlainDateRecordBranding,
  PlainDateTimeRecordBranding,
  ZonedDateTimeRecordBranding,
} from '../common-branding'
import { PlainDateNativeRecord } from './plainDate'
import { PlainDateTimeNativeRecord } from './plainDateTime'
import { ZonedDateTimeNativeRecord } from './zonedDateTime'

export type DurationNativeRecord = DurationFields

export const [
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNativeRecordSlots,
] = createSlotClass(
  DurationRecordBranding,
  (...args: any[]) => new (globalThis as any).Temporal.Duration(...args),
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
  {},
  {},
)

export function sign(duration: DurationNativeRecord): NumberSign {
  const native = getDurationNativeRecordSlots(duration).native
  return native.sign
}

export function blank(duration: DurationNativeRecord): boolean {
  const native = getDurationNativeRecordSlots(duration).native
  return native.blank
}

export function withFields(
  duration: DurationNativeRecord,
  mod: Partial<DurationFields>,
): DurationNativeRecord {
  const native = getDurationNativeRecordSlots(duration).native
  const resNative = native.with(mod)
  return createDurationNativeRecord(resNative)
}

export function negated(duration: DurationNativeRecord): DurationNativeRecord {
  const native = getDurationNativeRecordSlots(duration).native
  const resNative = native.negated()
  return createDurationNativeRecord(resNative)
}

export function add(
  duration: DurationNativeRecord,
  otherDuration: DurationNativeRecord,
  options?: RelativeToOptions<
    PlainDateNativeRecord | ZonedDateTimeNativeRecord
  >,
): DurationNativeRecord {
  const native = getDurationNativeRecordSlots(duration).native
  const otherNative = getDurationNativeRecordSlots(otherDuration).native
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
  const native = getDurationNativeRecordSlots(duration).native
  const otherNative = getDurationNativeRecordSlots(otherDuration).native
  const resNative = native.subtract(otherNative, {
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

export function round(
  duration: DurationNativeRecord,
  options: DurationRoundingOptions<RelativeToNativeRecord>,
) {
  const native = getDurationNativeRecordSlots(duration).native
  const resNative = native.round({
    ...options,
    relativeTo: refineRelativeTo(options?.relativeTo),
  })
  return createDurationNativeRecord(resNative)
}

// Util
// ----

type RelativeToNativeRecord =
  | ZonedDateTimeNativeRecord
  | PlainDateTimeNativeRecord
  | PlainDateNativeRecord

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
