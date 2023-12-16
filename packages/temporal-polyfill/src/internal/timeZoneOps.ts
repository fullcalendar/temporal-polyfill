import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset } from './isoMath'
import { EpochDisambig, OffsetDisambig } from './options'
import { roundToMinute } from './round'
import { nanoInUtcDay } from './units'
import { ensureNumber } from './cast'
import { createLazyGenerator } from './utils'
import { moveByIsoDays } from './move'

export type OffsetNanosecondsOp = (epochNano: DayTimeNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => DayTimeNano[]

export type TimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
  getPossibleInstantsFor: PossibleInstantsOp,
}

export type SimpleTimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
}

// Operations on passed-in instances
// -------------------------------------------------------------------------------------------------

export const zonedInternalsToIso = createLazyGenerator(_zonedInternalsToIso)

/*
TODO: ensure returning in desc order, so we don't need to pluck
BUT WAIT: returns offsetNanoseconds, which might be undesirable. Use returned tuple?
*/
function _zonedInternalsToIso(
  internals: { epochNanoseconds: DayTimeNano }, // goes first because key
  timeZoneOps: SimpleTimeZoneOps,
): IsoDateTimeFields & { offsetNanoseconds: number } {
  const { epochNanoseconds } = internals
  const offsetNanoseconds = timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

export function computeNanosecondsInDay(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateFields
): number {
  isoFields = { ...isoFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneOps, { ...isoFields, ...isoTimeFieldDefaults, })
  const epochNano1 = getSingleInstantFor(timeZoneOps, { ...moveByIsoDays(isoFields, 1), ...isoTimeFieldDefaults })

  const nanoInDay = dayTimeNanoToNumber(
    diffDayTimeNanos(epochNano0, epochNano1)
  )

  if (nanoInDay <= 0) {
    throw new RangeError('Bad nanoseconds in day')
  }

  return nanoInDay
}

export function getMatchingInstantFor(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateTimeFields,
  offsetNano: number | undefined,
  hasZ: boolean,
  // need these defaults?
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy = false
): DayTimeNano {
  if (offsetNano !== undefined && offsetDisambig === OffsetDisambig.Use) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoToEpochNanoWithOffset(isoFields, offsetNano)
    }
  }

  const possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(isoFields)

  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoFields,
      offsetNano,
      epochFuzzy
    )

    if (matchingEpochNano !== undefined) {
      return matchingEpochNano
    }

    if (offsetDisambig === OffsetDisambig.Reject) {
      throw new RangeError('Mismatching offset/timezone')
    }
    // else (offsetDisambig === 'prefer') ...
  }

  if (hasZ) {
    return isoToEpochNano(isoFields)!
  }

  return getSingleInstantFor(timeZoneOps, isoFields, epochDisambig, possibleEpochNanos)
}

function findMatchingEpochNano(
  possibleEpochNanos: DayTimeNano[],
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number,
  fuzzy: boolean
): DayTimeNano | undefined {
  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)!

  if (fuzzy) {
    offsetNano = roundToMinute(offsetNano)
  }

  for (const possibleEpochNano of possibleEpochNanos) {
    let possibleOffsetNano = dayTimeNanoToNumber(
      diffDayTimeNanos(possibleEpochNano, zonedEpochNano)
    )

    if (fuzzy) {
      possibleOffsetNano = roundToMinute(possibleOffsetNano)
    }

    if (possibleOffsetNano === offsetNano) {
      return possibleEpochNano
    }
  }
}

export function getSingleInstantFor(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: DayTimeNano[] = timeZoneOps.getPossibleInstantsFor(isoFields)
): DayTimeNano {
  if (possibleEpochNanos.length === 1) {
    return possibleEpochNanos[0]
  }

  if (disambig === EpochDisambig.Reject) {
    throw new RangeError('Ambiguous offset')
  }

  // within a transition that jumps back
  // ('compatible' means 'earlier')
  if (possibleEpochNanos.length) {
    return possibleEpochNanos[disambig === EpochDisambig.Later
      ? 1
      : 0 // 'earlier' and 'compatible'
    ]
  }

  // within a transition that jumps forward...
  // ('compatible' means 'later')
  const zonedEpochNano = isoToEpochNano(isoFields)!
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  const shiftNano = gapNano * (
    disambig === EpochDisambig.Earlier
      ? -1
      : 1) // 'later' or 'compatible'

  possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIso(zonedEpochNano, shiftNano),
  )

  return possibleEpochNanos[disambig === EpochDisambig.Earlier
    ? 0
    : possibleEpochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(
  timeZoneOps: SimpleTimeZoneOps,
  zonedEpochNano: DayTimeNano
): number {
  const startOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, -nanoInUtcDay)
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, nanoInUtcDay)
  )
  return endOffsetNano - startOffsetNano
}

export function zonedEpochNanoToIso(
  timeZoneOps: TimeZoneOps,
  epochNano: DayTimeNano
): IsoDateTimeFields {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}
