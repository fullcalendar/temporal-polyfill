import { TimeBag, TimeFields } from '../internal/calendarFields'
import { LocalesArg, prepCachedPlainTimeFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainTimeSlots, refineTimeZoneSlotString } from '../internal/slots'
import { identityFunc } from '../internal/utils'
import { createPlainTimeSlots } from '../internal/slotsCreate'
import { plainTimeWithFields, refinePlainTimeBag } from '../internal/bag'
import { parsePlainTime } from '../internal/parseIso'
import { movePlainTime } from '../internal/move'
import { diffPlainTimes } from '../internal/diff'
import { roundPlainTime } from '../internal/round'
import { plainTimesEqual, compareIsoTimeFields } from '../internal/compare'
import { formatPlainTimeIso } from '../internal/formatIso'
import { plainTimeToPlainDateTime, plainTimeToZonedDateTime } from '../internal/convert'

export const create = createPlainTimeSlots

export const fromFields = refinePlainTimeBag

export const fromString = parsePlainTime

// TODO: use util
export function getFields(slots: PlainTimeSlots): TimeFields {
  return {
    hour: slots.isoHour,
    minute: slots.isoMinute,
    second: slots.isoSecond,
    millisecond: slots.isoMillisecond,
    microsecond: slots.isoMicrosecond,
    nanosecond: slots.isoNanosecond,
  }
}

export function withFields(
  slots: PlainTimeSlots,
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return plainTimeWithFields(getFields(slots), mod, options)
}

export function add(
  slots: PlainTimeSlots,
  durationSlots: DurationSlots,
): PlainTimeSlots {
  return movePlainTime(false, slots, durationSlots)
}

export function subtract(
  slots: PlainTimeSlots,
  durationSlots: DurationSlots,
): PlainTimeSlots {
  return movePlainTime(true, slots, durationSlots)
}

export function until(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainTimes(plainTimeSlots0, plainTimeSlots1, options)
}

export function since(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainTimes(plainTimeSlots0, plainTimeSlots1, options, true)
}

export const round = roundPlainTime

export const compare = compareIsoTimeFields

export const equals = plainTimesEqual

export const toString = formatPlainTimeIso

// TODO: ensure options isn't undefined before accessing
export function toZonedDateTime(
  slots: PlainTimeSlots,
  options: { timeZone: string, plainDate: PlainDateSlots<string> },
) {
  return plainTimeToZonedDateTime(
    refineTimeZoneSlotString,
    identityFunc,
    queryNativeTimeZone,
    slots,
    options,
  )
}

export const toPlainDateTime = plainTimeToPlainDateTime

export function toLocaleString(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainTimeFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainTimeFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
