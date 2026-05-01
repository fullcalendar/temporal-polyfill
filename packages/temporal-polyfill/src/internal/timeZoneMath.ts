import { BigNano, bigNanoToNumber, diffBigNanos, moveBigNano } from './bigNano'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, TimeFields } from './fieldTypes'
import { DateTimeFields } from './fieldTypes'
import { IsoDateTimeCarrier } from './isoFields'
import { EpochDisambig, OffsetDisambig } from './optionsModel'
import { roundToMinute } from './round'
import { ZonedEpochSlots } from './slots'
import {
  checkIsoDateInBoundsStrict,
  epochNanoToIso,
  isoDateAndTimeToEpochNano,
  isoDateAndTimeToEpochNanoWithOffset,
} from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { memoize } from './utils'

export type OffsetNanosecondsOp = (epochNano: BigNano) => number
export type PossibleInstantsOp = (
  isoDate: CalendarDateFields,
  time: TimeFields,
) => BigNano[]

export type FixedIsoZonedFields = IsoDateTimeCarrier & {
  calendar: string
  offsetNanoseconds: number
}

export type ZonedDateTimeFields = DateTimeFields & { offset: string }

// ISO <-> Epoch conversions (on passed-in instances)
// -----------------------------------------------------------------------------

export const zonedEpochSlotsToIso = memoize(
  _zonedEpochSlotsToIso,
  WeakMap,
) as typeof _zonedEpochSlotsToIso

function _zonedEpochSlotsToIso(
  slots: ZonedEpochSlots,
  timeZoneImpl: TimeZoneImpl = queryTimeZone(slots.timeZone),
): FixedIsoZonedFields {
  const { epochNanoseconds } = slots

  const offsetNanoseconds =
    timeZoneImpl.getOffsetNanosecondsFor(epochNanoseconds)
  const { isoDate, time } = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    isoDate,
    time,
    offsetNanoseconds,
  }
}

export function getMatchingInstantFor(
  timeZoneImpl: TimeZoneImpl,
  isoDate: CalendarDateFields,
  time: TimeFields,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy?: boolean,
  hasZ?: boolean,
): BigNano {
  if (offsetNano !== undefined && offsetDisambig === OffsetDisambig.Use) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoDateAndTimeToEpochNanoWithOffset(isoDate, time, offsetNano)
    }
  }

  // Only enforce strict ISO date bounds for Prefer/Reject offset disambiguation.
  // Use/Ignore should skip this check, matching spec behavior for fixed-offset
  // time zones at epoch boundaries (e.g. ZonedDateTime.from("-000001-01-01T00:00+00:00[UTC]")).
  if (
    offsetDisambig === OffsetDisambig.Prefer ||
    offsetDisambig === OffsetDisambig.Reject
  ) {
    checkIsoDateInBoundsStrict(isoDate)
  }

  const possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(isoDate, time)

  // Prefer or Reject
  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoDate,
      time,
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
    return isoDateAndTimeToEpochNano(isoDate, time)!
  }

  return getSingleInstantFor(
    timeZoneImpl,
    isoDate,
    time,
    epochDisambig,
    possibleEpochNanos,
  )
}

export function getSingleInstantFor(
  timeZoneImpl: TimeZoneImpl,
  isoDate: CalendarDateFields,
  time: TimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: BigNano[] = timeZoneImpl.getPossibleInstantsFor(
    isoDate,
    time,
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
  const zonedEpochNano = isoDateAndTimeToEpochNano(isoDate, time)!
  const gapNano = computeGapNear(timeZoneImpl, zonedEpochNano)

  // 'later' or 'compatible'
  const shiftNano = gapNano * (disambig === EpochDisambig.Earlier ? -1 : 1)

  const { isoDate: shiftedIsoDate, time: shiftedTime } = epochNanoToIso(
    zonedEpochNano,
    shiftNano,
  )
  possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(
    shiftedIsoDate,
    shiftedTime,
  )

  return possibleEpochNanos[
    // 'later' or 'compatible'
    disambig === EpochDisambig.Earlier ? 0 : possibleEpochNanos.length - 1
  ]
}

export function getStartOfDayInstantFor(
  timeZoneImpl: TimeZoneImpl,
  // already 00:00:00. TODO: rethink this
  isoDate: CalendarDateFields,
  time: TimeFields,
): BigNano {
  const possibleEpochNanos = timeZoneImpl.getPossibleInstantsFor(isoDate, time)

  // If not a DST gap, return the single or earlier epochNs
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[0]
  }

  const zonedEpochNano = isoDateAndTimeToEpochNano(isoDate, time)!
  const zonedEpochNanoDayBefore = moveBigNano(zonedEpochNano, -nanoInUtcDay)

  return timeZoneImpl.getTransition(zonedEpochNanoDayBefore, 1)!
}

function findMatchingEpochNano(
  possibleEpochNanos: BigNano[],
  isoDate: CalendarDateFields,
  time: TimeFields,
  offsetNano: number,
  fuzzy?: boolean,
): BigNano | undefined {
  const zonedEpochNano = isoDateAndTimeToEpochNano(isoDate, time)!

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
