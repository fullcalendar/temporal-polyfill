import { LocalesArg, prepCachedInstantFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { InstantDisplayOptions } from '../genericApi/optionsRefine'
import { refineTimeZoneSlotString } from '../genericApi/timeZoneSlotString'
import { refineCalendarSlotString } from '../genericApi/calendarSlotString'
import { InstantSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import * as InstantFuncs from '../genericApi/instant'

export const create = InstantFuncs.create

export const fromString = InstantFuncs.fromString

export const fromEpochSeconds = InstantFuncs.fromEpochSeconds

export const fromEpochMilliseconds = InstantFuncs.fromEpochMilliseconds

export const fromEpochMicroseconds = InstantFuncs.fromEpochMicroseconds

export const fromEpochNanoseconds = InstantFuncs.fromEpochNanoseconds

export const add = InstantFuncs.add

export const subtract = InstantFuncs.subtract

export const compare = InstantFuncs.compare

export function toString(
  instantSlots: InstantSlots,
  options?: InstantDisplayOptions<string>,
): string {
  return InstantFuncs.toString(
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    instantSlots,
    options,
  )
}

export function toJSON(
  instantSlots: InstantSlots,
): string {
  return InstantFuncs.toString(
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    instantSlots,
  )
}

export function toZonedDateTimeISO(
  instantSlots: InstantSlots,
  timeZoneSlot: string,
): ZonedDateTimeSlots<string, string> {
  return InstantFuncs.toZonedDateTimeISO(instantSlots, timeZoneSlot) // just forward
}

export function toZonedDateTime(
  instantSlots: InstantSlots,
  options: { timeZone: string, calendar: string }
): ZonedDateTimeSlots<string, string> {
  return InstantFuncs.toZonedDateTime(
    instantSlots,
    refineTimeZoneSlotString(options.timeZone),
    refineCalendarSlotString(options.calendar),
  )
}

export function toLocaleString(
  slots: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedInstantFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedInstantFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: InstantSlots,
  slots1: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedInstantFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: InstantSlots,
  slots1: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedInstantFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}

