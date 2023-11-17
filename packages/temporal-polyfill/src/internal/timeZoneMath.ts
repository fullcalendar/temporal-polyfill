import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { IsoDateTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset, moveByIsoDays } from './isoMath'
import { EpochDisambig, OffsetDisambig } from './options'
import { roundToMinute } from './round'
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots } from './slots'
import { nanoInUtcDay } from './units'
import { createLazyGenerator } from './utils'
import { isoCalendarId } from './calendarConfig'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'
import { timeZoneImplGetOffsetNanosecondsFor } from './timeZoneRecordSimple'
import { TimeZoneSlot } from './timeZoneSlotUtils'

// public
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor } from '../public/timeZoneRecordComplex'
import { ensureNumber } from './cast'

export function computeNanosecondsInDay(
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc
  },
  isoDateFields: IsoDateSlots
): number {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneRecord, { ...isoDateFields, ...isoTimeFieldDefaults, })
  const epochNano1 = getSingleInstantFor(timeZoneRecord, { ...moveByIsoDays(isoDateFields, 1), ...isoTimeFieldDefaults, calendar: isoDateFields.calendar })

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
  isoDateTimeSlots: IsoDateTimeSlots,
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
      return isoToEpochNanoWithOffset(isoDateTimeSlots, offsetNano)
    }
  }

  const possibleEpochNanos = timeZoneRecord.getPossibleInstantsFor(isoDateTimeSlots)

  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoDateTimeSlots,
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
    return isoToEpochNano(isoDateTimeSlots)!
  }

  return getSingleInstantFor(timeZoneRecord, isoDateTimeSlots, epochDisambig, possibleEpochNanos)
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
  isoDateTimeSlots: IsoDateTimeSlots,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: DayTimeNano[] = timeZoneRecord.getPossibleInstantsFor(isoDateTimeSlots)
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
  const zonedEpochNano = isoToEpochNano(isoDateTimeSlots)!
  const gapNano = computeGapNear(timeZoneRecord, zonedEpochNano)

  const shiftNano = gapNano * (
    disambig === EpochDisambig.Earlier
      ? -1
      : 1) // 'later' or 'compatible'

  possibleEpochNanos = timeZoneRecord.getPossibleInstantsFor({
    ...epochNanoToIso(zonedEpochNano, shiftNano),
    calendar: isoCalendarId,
  })

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

export const zonedInternalsToIso = createLazyGenerator((internals: ZonedEpochSlots) => {
  const { calendar, timeZone, epochNanoseconds } = internals
  const { getOffsetNanosecondsFor } = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
  })

  const offsetNanoseconds = getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
    calendar,
  }
})

export function zonedEpochNanoToIso(
  timeZoneSlot: TimeZoneSlot,
  epochNano: DayTimeNano
): IsoDateTimeFields {
  const { getOffsetNanosecondsFor } = createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
  })

  const offsetNano = getOffsetNanosecondsFor(epochNano)
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
