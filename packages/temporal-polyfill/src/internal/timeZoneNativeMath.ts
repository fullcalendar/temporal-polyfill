import { BigNano, bigNanoToNumber, diffBigNanos, moveBigNano } from './bigNano'
import * as errorMessages from './errorMessages'
import { DateTimeFields } from './fields'
import { IsoDateTimeFields, isoDateTimeFieldNamesAlpha } from './isoFields'
import { formatOffsetNano } from './isoFormat'
import { EpochDisambig, OffsetDisambig } from './options'
import { roundToMinute } from './round'
import { ZonedDateTimeSlots, ZonedEpochSlots } from './slots'
import {
  epochNanoToIso,
  isoToEpochNano,
  isoToEpochNanoWithOffset,
} from './timeMath'
import { NativeTimeZone, queryNativeTimeZone } from './timeZoneNative'
import { nanoInUtcDay } from './units'
import { memoize, pluckProps } from './utils'

export type OffsetNanosecondsOp = (epochNano: BigNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => BigNano[]

export type FixedIsoFields = IsoDateTimeFields & {
  calendar: string
  offsetNanoseconds: number
}

export type ZonedIsoFields = IsoDateTimeFields & {
  calendar: string
  timeZone: string
  offset: string
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
  nativeTimeZone: NativeTimeZone = queryNativeTimeZone(slots.timeZone),
): FixedIsoFields {
  const { epochNanoseconds } = slots

  const offsetNanoseconds =
    nativeTimeZone.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

/*
Only used by funcApi
*/
export function buildZonedIsoFields(
  zonedDateTimeSlots: ZonedDateTimeSlots,
  nativeTimeZone: NativeTimeZone = queryNativeTimeZone(zonedDateTimeSlots.timeZone),
): ZonedIsoFields {
  const isoFields = zonedEpochSlotsToIso(zonedDateTimeSlots, nativeTimeZone)

  return {
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields as IsoDateTimeFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds),
    timeZone: zonedDateTimeSlots.timeZone,
  }
}

export function getMatchingInstantFor(
  nativeTimeZone: NativeTimeZone,
  isoFields: IsoDateTimeFields,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy?: boolean,
  hasZ?: boolean,
): BigNano {
  if (offsetNano !== undefined && offsetDisambig === OffsetDisambig.Use) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoToEpochNanoWithOffset(isoFields, offsetNano)
    }
  }

  const possibleEpochNanos = nativeTimeZone.getPossibleInstantsFor(isoFields)

  // Prefer or Reject
  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoFields,
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
    return isoToEpochNano(isoFields)!
  }

  return getSingleInstantFor(
    nativeTimeZone,
    isoFields,
    epochDisambig,
    possibleEpochNanos,
  )
}

export function getSingleInstantFor(
  nativeTimeZone: NativeTimeZone,
  isoFields: IsoDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: BigNano[] = nativeTimeZone.getPossibleInstantsFor(isoFields),
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
  const zonedEpochNano = isoToEpochNano(isoFields)!
  const gapNano = computeGapNear(nativeTimeZone, zonedEpochNano)

  // 'later' or 'compatible'
  const shiftNano = gapNano * (disambig === EpochDisambig.Earlier ? -1 : 1)

  possibleEpochNanos = nativeTimeZone.getPossibleInstantsFor(
    epochNanoToIso(zonedEpochNano, shiftNano),
  )

  return possibleEpochNanos[
    // 'later' or 'compatible'
    disambig === EpochDisambig.Earlier ? 0 : possibleEpochNanos.length - 1
  ]
}

export function getStartOfDayInstantFor(
  nativeTimeZone: NativeTimeZone,
  // already 00:00:00. TODO: rethink this
  isoFields: IsoDateTimeFields,
): BigNano {
  const possibleEpochNanos = nativeTimeZone.getPossibleInstantsFor(isoFields)

  // If not a DST gap, return the single or earlier epochNs
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[0]
  }

  const zonedEpochNano = isoToEpochNano(isoFields)!
  const zonedEpochNanoDayBefore = moveBigNano(zonedEpochNano, -nanoInUtcDay)

  return nativeTimeZone.getTransition(zonedEpochNanoDayBefore, 1)!
}

function findMatchingEpochNano(
  possibleEpochNanos: BigNano[],
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number,
  fuzzy?: boolean,
): BigNano | undefined {
  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)!

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
  nativeTimeZone: NativeTimeZone,
  zonedEpochNano: BigNano,
): number {
  const startOffsetNano = nativeTimeZone.getOffsetNanosecondsFor(
    moveBigNano(zonedEpochNano, -nanoInUtcDay),
  )
  const endOffsetNano = nativeTimeZone.getOffsetNanosecondsFor(
    moveBigNano(zonedEpochNano, nanoInUtcDay),
  )
  return validateTimeZoneGap(endOffsetNano - startOffsetNano)
}

// Utils
// -----------------------------------------------------------------------------

export function validateTimeZoneOffset(offsetNano: number): number {
  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError(errorMessages.outOfBoundsOffset)
  }
  return offsetNano
}

export function validateTimeZoneGap(gapNano: number): number {
  if (gapNano > nanoInUtcDay) {
    throw new RangeError(errorMessages.outOfBoundsDstGap)
  }
  return gapNano
}
