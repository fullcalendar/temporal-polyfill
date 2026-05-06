import { BigNano, bigNanoToNumber, diffBigNanos, moveBigNano } from './bigNano'
import * as errorMessages from './errorMessages'
import type { InternalCalendar } from './externalCalendar'
import { CalendarDateTimeFields, DateTimeFields } from './fieldTypes'
import {
  DirectionName,
  DirectionOptions,
  EpochDisambig,
  OffsetDisambig,
} from './optionsModel'
import { refineDirectionOptions } from './optionsTransitionRefine'
import { roundToMinute } from './round'
import { ZonedEpochSlots } from './slots'
import {
  checkIsoDateInBoundsStrict,
  epochNanoToIso,
  isoDateTimeToEpochNano,
  isoDateTimeToEpochNanoWithOffset,
} from './timeMath'
import { TimeZoneImpl } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { memoize } from './utils'

export type OffsetNanosecondsOp = (epochNano: BigNano) => number
export type PossibleInstantsOp = (
  isoDateTime: CalendarDateTimeFields,
) => BigNano[]

export type FixedIsoZonedFields = CalendarDateTimeFields & {
  calendar: InternalCalendar
  offsetNanoseconds: number
}

export type ZonedDateTimeFields = DateTimeFields & { offset: string }

// Time-zone transitions
// -----------------------------------------------------------------------------

export function getTimeZoneTransitionEpochNanoseconds(
  slots: ZonedEpochSlots,
  options: DirectionOptions | DirectionName,
): BigNano | undefined {
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
  slots: ZonedEpochSlots,
  timeZoneImpl: TimeZoneImpl = slots.timeZone,
): FixedIsoZonedFields {
  const { epochNanoseconds } = slots

  const offsetNanoseconds =
    timeZoneImpl.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTime = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    ...isoDateTime,
    offsetNanoseconds,
  }
}

export function getMatchingInstantFor(
  timeZoneImpl: TimeZoneImpl,
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy?: boolean,
  hasZ?: boolean,
): BigNano {
  if (offsetNano !== undefined && offsetDisambig === OffsetDisambig.Use) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoDateTimeToEpochNanoWithOffset(isoDateTime, offsetNano)
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

  const possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(isoDateTime)

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
    timeZoneImpl,
    isoDateTime,
    epochDisambig,
    possibleEpochNanos,
  )
}

export function getSingleInstantFor(
  timeZoneImpl: TimeZoneImpl,
  isoDateTime: CalendarDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: BigNano[] = timeZoneImpl.getPossibleInstantsFor(
    isoDateTime,
  ),
): BigNano {
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
  const gapNano = computeGapNear(timeZoneImpl, zonedEpochNano)

  // 'later' or 'compatible'
  const shiftNano = gapNano * (disambig === EpochDisambig.Earlier ? -1 : 1)

  const shiftedIsoDateTime = epochNanoToIso(zonedEpochNano, shiftNano)
  possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(shiftedIsoDateTime)

  return possibleEpochNanos[
    // 'later' or 'compatible'
    disambig === EpochDisambig.Earlier ? 0 : possibleEpochNanos.length - 1
  ]
}

export function getStartOfDayInstantFor(
  timeZoneImpl: TimeZoneImpl,
  isoDateTime: CalendarDateTimeFields,
): BigNano {
  const possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(isoDateTime)

  // If not a DST gap, return the single or earlier epochNs
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[0]
  }

  const zonedEpochNano = isoDateTimeToEpochNano(isoDateTime)!
  const zonedEpochNanoDayBefore = moveBigNano(zonedEpochNano, -nanoInUtcDay)

  return timeZoneImpl.getTransition(zonedEpochNanoDayBefore, 1)!
}

function findMatchingEpochNano(
  possibleEpochNanos: BigNano[],
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number,
  fuzzy?: boolean,
): BigNano | undefined {
  const zonedEpochNano = isoDateTimeToEpochNano(isoDateTime)!

  if (fuzzy) {
    offsetNano = roundToMinute(offsetNano)
  }

  for (const possibleEpochNano of possibleEpochNanos) {
    let possibleOffsetNano = bigNanoToNumber(
      diffBigNanos(possibleEpochNano, zonedEpochNano),
    )

    if (fuzzy) {
      possibleOffsetNano = roundToMinute(possibleOffsetNano)
    }

    if (possibleOffsetNano === offsetNano) {
      return possibleEpochNano
    }
  }
}

function computeGapNear(
  timeZoneImpl: TimeZoneImpl,
  zonedEpochNano: BigNano,
): number {
  const startOffsetNano = timeZoneImpl.getOffsetNanosecondsFor(
    moveBigNano(zonedEpochNano, -nanoInUtcDay),
  )
  const endOffsetNano = timeZoneImpl.getOffsetNanosecondsFor(
    moveBigNano(zonedEpochNano, nanoInUtcDay),
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
