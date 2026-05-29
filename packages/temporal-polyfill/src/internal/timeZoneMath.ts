import type { Temporal } from 'temporal-spec'
import { bigNanoInUtcDay } from './bigNano'
import { type CalendarSlot } from './calendarSlot'
import { epochNanoToIso, isoDateTimeToEpochNano } from './epochMath'
import * as errorMessages from './errorMessages'
import { CalendarDateTimeFields, DateTimeFields } from './fieldTypes'
import { EpochDisambig, OffsetDisambig } from './optionsModel'
import { refineDirectionOptions } from './optionsTransitionRefine'
import { roundToMinute } from './round'
import { ZonedEpochNanoFields } from './slots'
import {
  checkIsoDateInBoundsStrict,
  isoDateTimeAndOffsetToEpochNano,
} from './temporalLimits'
import { TimeZone } from './timeZone'
import { nanoInUtcDay } from './units'
import { memoize } from './utils'

export type OffsetNanosecondsOp = (epochNano: bigint) => number
export type PossibleInstantsOp = (
  isoDateTime: CalendarDateTimeFields,
) => bigint[]

export type FixedIsoZonedFields = CalendarDateTimeFields & {
  calendar: CalendarSlot
  offsetNanoseconds: number
}

export type ZonedDateTimeFields = DateTimeFields & { offset: string }

// Time-zone transitions
// -----------------------------------------------------------------------------

export function getTimeZoneTransitionEpochNanoseconds(
  slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  options: Temporal.TransitionOptions | Temporal.TransitionOptions['direction'],
): bigint | undefined {
  return slots.timeZone.getTransition(
    slots.epochNanoseconds,
    refineDirectionOptions(options),
  )
}

// ISO <-> Epoch conversions (on passed-in instances)
// -----------------------------------------------------------------------------

export const zonedEpochSlotsToIso = memoize(
  _zonedEpochSlotsToIso,
  WeakMap,
) as typeof _zonedEpochSlotsToIso

function _zonedEpochSlotsToIso(
  slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  timeZone: TimeZone = slots.timeZone,
): FixedIsoZonedFields {
  const { epochNanoseconds } = slots

  const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTime = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    ...isoDateTime,
    offsetNanoseconds,
  }
}

export function getMatchingInstantFor(
  timeZone: TimeZone,
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy?: boolean,
  hasZ?: boolean,
): bigint {
  if (offsetNano !== undefined && offsetDisambig === OffsetDisambig.Use) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoDateTimeAndOffsetToEpochNano(isoDateTime, offsetNano)
    }
  }

  // Only enforce strict ISO date bounds for Prefer/Reject offset disambiguation.
  // Use/Ignore should skip this check, matching spec behavior for fixed-offset
  // time zones at epoch boundaries (e.g. ZonedDateTime.from("-000001-01-01T00:00+00:00[UTC]")).
  if (
    offsetDisambig === OffsetDisambig.Prefer ||
    offsetDisambig === OffsetDisambig.Reject
  ) {
    checkIsoDateInBoundsStrict(isoDateTime)
  }

  const possibleEpochNanos = timeZone.getPossibleInstantsFor(isoDateTime)

  // Prefer or Reject
  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoDateTime,
      offsetNano,
      epochFuzzy,
    )

    if (matchingEpochNano !== undefined) {
      return matchingEpochNano
    }
    if (offsetDisambig === OffsetDisambig.Reject) {
      throw new RangeError(errorMessages.invalidOffsetForTimeZone)
    }
    // else (offsetDisambig === OffsetDisambig.Prefer) ...
  }

  if (hasZ) {
    return isoDateTimeToEpochNano(isoDateTime)!
  }

  return getSingleInstantFor(
    timeZone,
    isoDateTime,
    epochDisambig,
    possibleEpochNanos,
  )
}

export function getSingleInstantFor(
  timeZone: TimeZone,
  isoDateTime: CalendarDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: bigint[] = timeZone.getPossibleInstantsFor(isoDateTime),
): bigint {
  if (possibleEpochNanos.length === 1) {
    return possibleEpochNanos[0]
  }

  if (disambig === EpochDisambig.Reject) {
    throw new RangeError(errorMessages.ambigOffset)
  }

  // within a transition that jumps back
  // ('compatible' means 'earlier')
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[
      disambig === EpochDisambig.Later ? 1 : 0 // 'earlier' and 'compatible'
    ]
  }

  // within a transition that jumps forward...
  // ('compatible' means 'later')
  const zonedEpochNano = isoDateTimeToEpochNano(isoDateTime)!
  const gapNano = computeGapNear(timeZone, zonedEpochNano)

  // 'later' or 'compatible'
  const shiftNano = gapNano * (disambig === EpochDisambig.Earlier ? -1 : 1)

  const shiftedIsoDateTime = epochNanoToIso(zonedEpochNano, shiftNano)
  possibleEpochNanos = timeZone.getPossibleInstantsFor(shiftedIsoDateTime)

  return possibleEpochNanos[
    // 'later' or 'compatible'
    disambig === EpochDisambig.Earlier ? 0 : possibleEpochNanos.length - 1
  ]
}

export function getStartOfDayInstantFor(
  timeZone: TimeZone,
  isoDateTime: CalendarDateTimeFields,
): bigint {
  const possibleEpochNanos = timeZone.getPossibleInstantsFor(isoDateTime)

  // If not a DST gap, return the single or earlier epochNs
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[0]
  }

  const zonedEpochNano = isoDateTimeToEpochNano(isoDateTime)!
  const zonedEpochNanoDayBefore = zonedEpochNano - bigNanoInUtcDay

  return timeZone.getTransition(zonedEpochNanoDayBefore, 1)!
}

function findMatchingEpochNano(
  possibleEpochNanos: bigint[],
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number,
  fuzzy?: boolean,
): bigint | undefined {
  const zonedEpochNano = isoDateTimeToEpochNano(isoDateTime)!

  if (fuzzy) {
    offsetNano = roundToMinute(offsetNano)
  }

  for (const possibleEpochNano of possibleEpochNanos) {
    let possibleOffsetNano = Number(zonedEpochNano - possibleEpochNano)

    if (fuzzy) {
      possibleOffsetNano = roundToMinute(possibleOffsetNano)
    }

    if (possibleOffsetNano === offsetNano) {
      return possibleEpochNano
    }
  }
}

function computeGapNear(timeZone: TimeZone, zonedEpochNano: bigint): number {
  const startOffsetNano = timeZone.getOffsetNanosecondsFor(
    zonedEpochNano - bigNanoInUtcDay,
  )
  const endOffsetNano = timeZone.getOffsetNanosecondsFor(
    zonedEpochNano + bigNanoInUtcDay,
  )
  return validateTimeZoneGap(endOffsetNano - startOffsetNano)
}

// Utils
// -----------------------------------------------------------------------------

export function validateTimeZoneGap(gapNano: number): number {
  if (gapNano > nanoInUtcDay) {
    throw new RangeError(errorMessages.outOfBoundsDstGap)
  }
  return gapNano
}
