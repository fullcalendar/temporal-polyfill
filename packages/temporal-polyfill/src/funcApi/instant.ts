import { LocalesArg } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, InstantDisplayOptions } from '../internal/optionsRefine'
import { DurationSlots, InstantSlots, ZonedDateTimeSlots, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { createInstantSlots } from '../internal/slotsCreate'
import { parseInstant } from '../internal/parseIso'
import { epochMicroToInstant, epochMilliToInstant, epochNanoToInstant, epochSecToInstant, instantToZonedDateTime } from '../internal/convert'
import { moveInstant } from '../internal/move'
import { compareInstants, instantsEqual } from '../internal/compare'
import { formatInstantIso } from '../internal/formatIso'
import { diffInstants } from '../internal/diff'
import { roundInstant } from '../internal/round'
import { prepCachedInstantFormat } from './formatIntlCached'

export const create = createInstantSlots

export const fromString = parseInstant

export const fromEpochSeconds = epochSecToInstant

export const fromEpochMilliseconds = epochMilliToInstant

export const fromEpochMicroseconds = epochMicroToInstant

export const fromEpochNanoseconds = epochNanoToInstant

export function add(instantSlots: InstantSlots, durationSlots: DurationSlots): InstantSlots {
  return moveInstant(false, instantSlots, durationSlots)
}

export function subtract(instantSlots: InstantSlots, durationSlots: DurationSlots): InstantSlots {
  return moveInstant(true, instantSlots, durationSlots)
}

export function until(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions,
): DurationSlots {
  return diffInstants(instantSlots0, instantSlots1, options)
}

export function since(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions,
): DurationSlots {
  return diffInstants(instantSlots0, instantSlots1, options, true)
}

export const round = roundInstant

export const equals = instantsEqual

export const compare = compareInstants

export function toString(
  instantSlots: InstantSlots,
  options?: InstantDisplayOptions<string>,
): string {
  return formatInstantIso(
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    instantSlots,
    options,
  )
}

export function toJSON(
  instantSlots: InstantSlots,
): string {
  return formatInstantIso(
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    instantSlots,
  )
}

export function toZonedDateTimeISO(
  instantSlots: InstantSlots,
  timeZoneSlot: string,
): ZonedDateTimeSlots<string, string> {
  return instantToZonedDateTime(
    instantSlots,
    refineTimeZoneSlotString(timeZoneSlot),
  )
}

export function toZonedDateTime(
  instantSlots: InstantSlots,
  options: { timeZone: string, calendar: string }
): ZonedDateTimeSlots<string, string> {
  return instantToZonedDateTime(
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

