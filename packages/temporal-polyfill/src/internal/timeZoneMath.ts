import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset, moveByIsoDays } from './isoMath'
import { EpochDisambig, OffsetDisambig } from './optionEnums'
import { roundToMinute } from './round'
import { nanoInUtcDay } from './units'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'
import { ensureNumber } from './cast'
import { createLazyGenerator } from './utils'

export const zonedInternalsToIso = createLazyGenerator(_zonedInternalsToIso)

/*
TODO: ensure returning in desc order, so we don't need to pluck
BUT WAIT: returns offsetNanoseconds, which might be undesirable. Use returned tuple?
*/
function _zonedInternalsToIso(
  internals: { epochNanoseconds: DayTimeNano }, // goes first because key
  timeZoneRecord: { getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc },
): IsoDateTimeFields & { offsetNanoseconds: number } {
  const { epochNanoseconds } = internals
  const offsetNanoseconds = timeZoneRecord.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

export function computeNanosecondsInDay(
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc
  },
  isoFields: IsoDateFields
): number {
  isoFields = { ...isoFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneRecord, { ...isoFields, ...isoTimeFieldDefaults, })
  const epochNano1 = getSingleInstantFor(timeZoneRecord, { ...moveByIsoDays(isoFields, 1), ...isoTimeFieldDefaults })

  const nanoInDay = dayTimeNanoToNumber(
    diffDayTimeNanos(epochNano0, epochNano1)
  )

  if (nanoInDay <= 0) {
    throw new RangeError('Bad nanoseconds in day')
  }

  return nanoInDay
}

export function getMatchingInstantFor(
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc
  },
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

  const possibleEpochNanos = timeZoneRecord.getPossibleInstantsFor(isoFields)

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

  return getSingleInstantFor(timeZoneRecord, isoFields, epochDisambig, possibleEpochNanos)
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
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc
  },
  isoFields: IsoDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: DayTimeNano[] = timeZoneRecord.getPossibleInstantsFor(isoFields)
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
  const gapNano = computeGapNear(timeZoneRecord, zonedEpochNano)

  const shiftNano = gapNano * (
    disambig === EpochDisambig.Earlier
      ? -1
      : 1) // 'later' or 'compatible'

  possibleEpochNanos = timeZoneRecord.getPossibleInstantsFor(
    epochNanoToIso(zonedEpochNano, shiftNano),
  )

  return possibleEpochNanos[disambig === EpochDisambig.Earlier
    ? 0
    : possibleEpochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(
  timeZoneRecord: { getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc },
  zonedEpochNano: DayTimeNano
): number {
  const startOffsetNano = timeZoneRecord.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, -nanoInUtcDay)
  )
  const endOffsetNano = timeZoneRecord.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, nanoInUtcDay)
  )
  return endOffsetNano - startOffsetNano
}

export function zonedEpochNanoToIso(
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  epochNano: DayTimeNano
): IsoDateTimeFields {
  const offsetNano = timeZoneRecord.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function validateOffsetNano(offsetNano: number): number {
  if (!Number.isInteger(ensureNumber(offsetNano))) {
    throw new RangeError('must be integer number')
  }

  // TODO: DRY with string parsing?
  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError('out of range')
  }

  return offsetNano
}
