import { isoCalendarId } from '../internal/calendarConfig'
import { toBigInt, toStringViaPrimitive } from '../internal/cast'
import { bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from '../internal/dayTimeNano'
import { diffInstants } from '../internal/diff'
import { formatEpochNanoIso, formatInstantIso } from '../internal/formatIso'
import { checkEpochNanoInBounds } from '../internal/epochAndTime'
import { moveEpochNano } from '../internal/move'
import { roundDayTimeNano } from '../internal/round'
import { utcTimeZoneId } from '../internal/timeZoneNative'
import { TimeUnit, Unit, UnitName, nanoInMicro, nanoInMilli, nanoInSec } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DiffOptions, InstantDisplayOptions, RoundingOptions, refineInstantDisplayOptions, refineRoundOptions } from './optionsRefine'
import { DurationSlots, InstantBranding, InstantSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from '../internal/slots'
import { parseInstant } from '../internal/parseIso'
import { SimpleTimeZoneOps } from '../internal/timeZoneOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { compareInstants, instantsEqual } from '../internal/compare'

export function create(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}

export function fromString(s: string): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: parseInstant(toStringViaPrimitive(s)), // instead of 'requiring' like other types,
      // coerce, because there's no fromFields, so no need to differentiate param type
  }
}

export function fromEpochSeconds(epochSec: number): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec))
  }
}

export function fromEpochMilliseconds(epochMilli: number): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
  }
}

export function fromEpochMicroseconds(epochMicro: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro))
  }
}

export function fromEpochNanoseconds(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}

export function add(
  instantSlots: InstantSlots,
  durationSlots: DurationFields,
): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: moveEpochNano(instantSlots.epochNanoseconds, durationSlots),
  }
}

export function subtract(
  instantSlots: InstantSlots,
  durationSlots: DurationFields,
): InstantSlots {
  return add(instantSlots, negateDuration(durationSlots))
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

export function round(
  instantSlots: InstantSlots,
  options: RoundingOptions | UnitName
): InstantSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions( // TODO: inline this
    options,
    Unit.Hour,
    true, // solarMode
  )

  return {
    branding: InstantBranding,
    epochNanoseconds: roundDayTimeNano(
      instantSlots.epochNanoseconds,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
      true, // useDayOrigin
    ),
  }
}

export const compare = compareInstants

export const equals = instantsEqual

export const toString = formatInstantIso

export function toJSON<TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeSlotSlot: T) => SimpleTimeZoneOps,
  instantSlots: InstantSlots,
): string {
  return toString(refineTimeZoneArg, getTimeZoneOps, instantSlots)
}

export function toZonedDateTimeISO<T>(
  instantSlots: InstantSlots,
  timeZoneSlot: T,
): ZonedDateTimeSlots<string, T> {
  return toZonedDateTime(instantSlots, timeZoneSlot, isoCalendarId)
}

export function toZonedDateTime<C, T>(
  instantSlots: InstantSlots,
  timeZoneSlot: T,
  calendarSlot: C,
): ZonedDateTimeSlots<C, T> {
  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: instantSlots.epochNanoseconds,
    timeZone: timeZoneSlot,
    calendar: calendarSlot,
  }
}
