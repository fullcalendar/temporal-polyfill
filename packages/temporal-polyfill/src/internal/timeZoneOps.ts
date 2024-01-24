import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, isoDateTimeFieldNamesAlpha, isoTimeFieldDefaults } from './calendarIsoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset } from './epochAndTime'
import { EpochDisambig, OffsetDisambig } from './options'
import { roundToMinute } from './round'
import { nanoInHour, nanoInUtcDay } from './units'
import { createLazyGenerator, pluckProps } from './utils'
import { moveByIsoDays } from './move'
import { ZonedDateTimeBranding, ZonedDateTimeSlots, createZonedDateTimeSlots } from './slots'
import { formatOffsetNano } from './formatIso'
import * as errorMessages from './errorMessages'

export type OffsetNanosecondsOp = (epochNano: DayTimeNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => DayTimeNano[]

export type TimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
  getPossibleInstantsFor: PossibleInstantsOp,
}

export type TimeZoneOffsetOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp
}

export type ZonedIsoDateTimeSlots<C, T> = IsoDateTimeFields & { calendar: C, timeZone: T, offset: string }

// ISO <-> Epoch conversions (on passed-in instances)
// -------------------------------------------------------------------------------------------------

// TODO: rename to be about 'slots'
export const zonedInternalsToIso = createLazyGenerator(_zonedInternalsToIso, WeakMap)

/*
TODO: ensure returning in desc order, so we don't need to pluck
IMPORTANT: given timeZoneOps must be associated with the `internal` timeZone (even tho not present)
*/
function _zonedInternalsToIso(
  internals: { epochNanoseconds: DayTimeNano }, // goes first because key
  timeZoneOps: TimeZoneOffsetOps,
): IsoDateTimeFields & { offsetNanoseconds: number } {
  const { epochNanoseconds } = internals
  const offsetNanoseconds = timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

/*
for getISOFields()
*/
export function getZonedIsoDateTimeSlots<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>
): ZonedIsoDateTimeSlots<C, T> {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots as any, getTimeZoneOps(zonedDateTimeSlots.timeZone))

  return {
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds),
    timeZone: zonedDateTimeSlots.timeZone,
  }
}

export function zonedEpochNanoToIso(
  timeZoneOps: TimeZoneOps,
  epochNano: DayTimeNano
): IsoDateTimeFields {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function getMatchingInstantFor(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateTimeFields,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy?: boolean,
  hasZ?: boolean,
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
      throw new RangeError(errorMessages.invalidOffsetForTimeZone)
    }
    // else (offsetDisambig === 'prefer') ...
  }

  if (hasZ) {
    return isoToEpochNano(isoFields)!
  }

  return getSingleInstantFor(timeZoneOps, isoFields, epochDisambig, possibleEpochNanos)
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
    throw new RangeError(errorMessages.ambigOffset)
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

function findMatchingEpochNano(
  possibleEpochNanos: DayTimeNano[],
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number,
  fuzzy?: boolean
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

function computeGapNear(
  timeZoneOps: TimeZoneOffsetOps,
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

// Computations (on passed-in instances)
// -------------------------------------------------------------------------------------------------

export function computeStartOfDay<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = zonedDateTimeSlots
  const timeZoneOps = getTimeZoneOps(timeZone)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
    ...isoTimeFieldDefaults,
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    undefined, // offsetNanoseconds
    OffsetDisambig.Reject,
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return createZonedDateTimeSlots(
    epochNanoseconds,
    timeZone,
    calendar,
  )
}

export function computeHoursInDay<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): number {
  const timeZoneOps = getTimeZoneOps(zonedDateTimeSlots.timeZone)

  return computeNanosecondsInDay(
    timeZoneOps,
    zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
  ) / nanoInHour
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
    throw new RangeError(errorMessages.invalidProtocolResults) // 'Bad nanoseconds in day'
  }

  return nanoInDay
}

// Utils
// -------------------------------------------------------------------------------------------------

export function validateTimeZoneOffset(offsetNano: number): number {
  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError(errorMessages.outOfBoundsOffset)
  }
  return offsetNano
}
