import { toBigInt } from '../internal/cast'
import { bigIntToDayTimeNano } from '../internal/dayTimeNano'
import { diffInstants } from '../internal/diff'
import { formatInstantIso } from '../internal/formatIso'
import { checkEpochNanoInBounds } from '../internal/epochAndTime'
import { moveInstant } from '../internal/move'
import { roundInstant } from '../internal/round'
import { DiffOptions } from '../internal/optionsRefine'
import { DurationSlots, InstantBranding, InstantSlots } from '../internal/slots'
import { parseInstant } from '../internal/parseIso'
import { SimpleTimeZoneOps } from '../internal/timeZoneOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { compareInstants, instantsEqual } from '../internal/compare'
import { epochMicroToInstant, epochMilliToInstant, epochNanoToInstant, epochSecToInstant, instantToZonedDateTime, instantToZonedDateTimeISO } from '../internal/convert'

export function create(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}

export const fromString = parseInstant

export const fromEpochSeconds = epochSecToInstant

export const fromEpochMilliseconds = epochMilliToInstant

export const fromEpochMicroseconds = epochMicroToInstant

export const fromEpochNanoseconds = epochNanoToInstant

export const add = moveInstant

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

export const round = roundInstant

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

export const toZonedDateTimeISO = instantToZonedDateTimeISO

export const toZonedDateTime = instantToZonedDateTime
