import { LocalesArg } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { InstantSlots, ZonedDateTimeSlots, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { constructInstantSlots } from '../internal/construct'
import { parseInstant } from '../internal/parseIso'
import { epochMicroToInstant, epochMilliToInstant, epochNanoToInstant, epochSecToInstant, instantToZonedDateTime } from '../internal/convert'
import { moveInstant } from '../internal/move'
import { compareInstants, instantsEqual } from '../internal/compare'
import { formatInstantIso } from '../internal/formatIso'
import { diffInstants } from '../internal/diff'
import { roundInstant } from '../internal/round'
import { prepCachedInstantFormat } from './formatIntlCached'
import { bindArgs } from '../internal/utils'
import { getEpochMicroseconds, getEpochMilliseconds, getEpochNanoseconds, getEpochSeconds } from '../classApi/mixins'
import { requireObjectlike } from '../internal/cast'

export const create = constructInstantSlots
export const fromString = parseInstant

export const fromEpochSeconds = epochSecToInstant
export const fromEpochMilliseconds = epochMilliToInstant
export const fromEpochMicroseconds = epochMicroToInstant
export const fromEpochNanoseconds = epochNanoToInstant

export const epochSeconds = getEpochSeconds as (slots: InstantSlots) => number
export const epochMilliseconds = getEpochMilliseconds as (slots: InstantSlots) => number
export const epochMicroseconds = getEpochMicroseconds as (slots: InstantSlots) => bigint
export const epochNanoseconds = getEpochNanoseconds as (slots: InstantSlots) => bigint

export const add = bindArgs(moveInstant, false)
export const subtract = bindArgs(moveInstant, true)

export const until = bindArgs(diffInstants, false)
export const since = bindArgs(diffInstants, true)

export const round = roundInstant

export const equals = instantsEqual

export const compare = compareInstants

export const toString = bindArgs(
  formatInstantIso<string, string>,
  refineTimeZoneSlotString,
  queryNativeTimeZone,
)

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
  const refinedObj = requireObjectlike(options)

  return instantToZonedDateTime(
    instantSlots,
    refineTimeZoneSlotString(refinedObj.timeZone),
    refineCalendarSlotString(refinedObj.calendar),
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
