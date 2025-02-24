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
import { nanoInUtcDay } from './units'
import { memoize, pluckProps } from './utils'

export type OffsetNanosecondsOp = (epochNano: BigNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => BigNano[]

export type TimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp
  getPossibleInstantsFor: PossibleInstantsOp
}

export type TimeZoneOffsetOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp
}

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
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps,
): FixedIsoFields
function _zonedEpochSlotsToIso(
  slots: ZonedEpochSlots,
  timeZoneOps: TimeZoneOffsetOps,
): FixedIsoFields
function _zonedEpochSlotsToIso(
  slots: ZonedEpochSlots, // goes first because key
  getTimeZoneOps:
    | ((timeZoneId: string) => TimeZoneOffsetOps)
    | TimeZoneOffsetOps,
): FixedIsoFields {
  const { epochNanoseconds } = slots
  const timeZoneOps = isTimeZoneOffsetOps(getTimeZoneOps)
    ? getTimeZoneOps
    : getTimeZoneOps(slots.timeZone)

  const offsetNanoseconds =
    timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

export function buildZonedIsoFields(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps,
  zonedDateTimeSlots: ZonedDateTimeSlots,
): ZonedIsoFields {
  const isoFields = zonedEpochSlotsToIso(zonedDateTimeSlots, getTimeZoneOps)

  return {
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields as IsoDateTimeFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds),
    timeZone: zonedDateTimeSlots.timeZone,
  }
}

export function getMatchingInstantFor(
  timeZoneOps: TimeZoneOps,
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

  const possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(isoFields)

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
    timeZoneOps,
    isoFields,
    epochDisambig,
    possibleEpochNanos,
  )
}

export function getSingleInstantFor(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: BigNano[] = timeZoneOps.getPossibleInstantsFor(isoFields),
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
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  // 'later' or 'compatible'
  const shiftNano = gapNano * (disambig === EpochDisambig.Earlier ? -1 : 1)

  possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIso(zonedEpochNano, shiftNano),
  )

  return possibleEpochNanos[
    // 'later' or 'compatible'
    disambig === EpochDisambig.Earlier ? 0 : possibleEpochNanos.length - 1
  ]
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
  timeZoneOps: TimeZoneOffsetOps,
  zonedEpochNano: BigNano,
): number {
  const startOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    moveBigNano(zonedEpochNano, -nanoInUtcDay),
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
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

function isTimeZoneOffsetOps(input: any): input is TimeZoneOffsetOps {
  return input.getOffsetNanosecondsFor
}
