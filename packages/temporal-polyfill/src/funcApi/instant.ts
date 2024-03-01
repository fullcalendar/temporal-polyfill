import { requireObjectLike } from '../internal/cast'
import { compareInstants, instantsEqual } from '../internal/compare'
import { constructInstantSlots } from '../internal/construct'
import {
  epochMicroToInstant,
  epochMilliToInstant,
  epochNanoToInstant,
  epochSecToInstant,
  instantToZonedDateTime,
} from '../internal/convert'
import { diffInstants } from '../internal/diff'
import { createFormatPrepper, instantConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatInstantIso } from '../internal/isoFormat'
import { parseInstant } from '../internal/isoParse'
import { moveInstant } from '../internal/move'
import { roundInstant } from '../internal/round'
import {
  InstantSlots,
  ZonedDateTimeSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { bindArgs } from '../internal/utils'
import { createFormatCache } from './intlFormatCache'
import { refineCalendarIdString, refineTimeZoneIdString } from './utils'

// TODO: rename to keep scope? Slots?
export type { InstantSlots }

export const create = constructInstantSlots
export const fromString = parseInstant

export const fromEpochSeconds = epochSecToInstant
export const fromEpochMilliseconds = epochMilliToInstant
export const fromEpochMicroseconds = epochMicroToInstant
export const fromEpochNanoseconds = epochNanoToInstant

export const epochSeconds = getEpochSec as (slots: InstantSlots) => number
export const epochMilliseconds = getEpochMilli as (
  slots: InstantSlots,
) => number
export const epochMicroseconds = getEpochMicro as (
  slots: InstantSlots,
) => bigint
export const epochNanoseconds = getEpochNano as (slots: InstantSlots) => bigint

export const add = bindArgs(moveInstant, false)
export const subtract = bindArgs(moveInstant, true)

export const until = bindArgs(diffInstants, false)
export const since = bindArgs(diffInstants, true)

export const round = roundInstant

export const equals = instantsEqual

export const compare = compareInstants

export const toString = bindArgs(
  formatInstantIso<string, string>,
  refineTimeZoneIdString,
  queryNativeTimeZone,
)

export function toZonedDateTimeISO(
  instantSlots: InstantSlots,
  timeZoneSlot: string,
): ZonedDateTimeSlots<string, string> {
  return instantToZonedDateTime(
    instantSlots,
    refineTimeZoneIdString(timeZoneSlot),
  )
}

export function toZonedDateTime(
  instantSlots: InstantSlots,
  options: { timeZone: string; calendar: string },
): ZonedDateTimeSlots<string, string> {
  const refinedObj = requireObjectLike(options)

  return instantToZonedDateTime(
    instantSlots,
    refineTimeZoneIdString(refinedObj.timeZone),
    refineCalendarIdString(refinedObj.calendar),
  )
}

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  instantConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  slots: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: InstantSlots,
  slots1: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: InstantSlots,
  slots1: InstantSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
