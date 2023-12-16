import { isoCalendarId } from '../internal/calendarConfig'
import { ensureStringViaPrimitive, toBigInt } from '../internal/cast'
import { bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from '../internal/dayTimeNano'
import { diffEpochNano } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { formatInstantIso } from '../internal/formatIso'
import { checkEpochNanoInBounds } from '../internal/epochAndTime'
import { moveEpochNano } from '../internal/move'
import { RoundingMode } from '../internal/options'
import { roundDayTimeNano } from '../internal/round'
import { utcTimeZoneId } from '../internal/timeZoneNative'
import { TimeUnit, Unit, UnitName, nanoInMicro, nanoInMilli, nanoInSec } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DiffOptions, InstantDisplayOptions, RoundingOptions, refineDiffOptions, refineInstantDisplayOptions, refineRoundOptions } from './optionsRefine'
import { DurationBranding, InstantBranding, ZonedDateTimeBranding } from './branding'
import { DurationSlots, InstantSlots, ZonedDateTimeSlots } from './slotsGeneric'
import { parseInstant } from '../internal/parseIso'
import { SimpleTimeZoneOps } from '../internal/timeZoneOps'

export function create(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}

export function fromString(s: string): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: parseInstant(ensureStringViaPrimitive(s)),
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
  durationSlots: DurationFieldsWithSign,
): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: moveEpochNano(instantSlots.epochNanoseconds, durationSlots),
  }
}

export function subtract(
  instantSlots: InstantSlots,
  durationSlots: DurationFieldsWithSign,
): InstantSlots {
  return add(instantSlots, negateDurationInternals(durationSlots) as any)
}

export function until(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions,
  invertRoundingMode?: boolean,
): DurationSlots {
  return {
    branding: DurationBranding,
    ...updateDurationFieldsSign(
      diffEpochNano(
        instantSlots0.epochNanoseconds,
        instantSlots1.epochNanoseconds,
        ...(
          refineDiffOptions(invertRoundingMode, options, Unit.Second, Unit.Hour) as
            [TimeUnit, TimeUnit, number, RoundingMode]
        ),
      ),
    )
  }
}

export function since(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions,
): DurationFieldsWithSign { // !!!
  return negateDurationInternals(until(instantSlots1, instantSlots0, options, true))
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

export function compare(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): NumSign {
  return compareDayTimeNanos(instantSlots0.epochNanoseconds, instantSlots1.epochNanoseconds)
}

export function equals(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): boolean {
  return !compare(instantSlots0, instantSlots1)
}

export function toString<TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeSlotSlot: T) => SimpleTimeZoneOps,
  instantSlots: InstantSlots,
  options?: InstantDisplayOptions<TA>,
): string {
  const [
    timeZoneArg,
    nanoInc,
    roundingMode,
    subsecDigits,
  ] = refineInstantDisplayOptions(options)

  const providedTimeZone = timeZoneArg !== undefined
  const timeZoneOps = getTimeZoneOps(
    providedTimeZone
      ? refineTimeZoneArg(timeZoneArg)
      : utcTimeZoneId as any,
  )

  return formatInstantIso(
    providedTimeZone,
    timeZoneOps,
    instantSlots.epochNanoseconds,
    nanoInc,
    roundingMode,
    subsecDigits,
  )
}

/*
TODO: smarter way without needing params
*/
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
