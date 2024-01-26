import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, isoDateTimeFieldNamesAlpha, isoTimeFieldDefaults } from './calendarIsoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset } from './epochAndTime'
import { EpochDisambig, OffsetDisambig } from './options'
import { roundToMinute } from './round'
import { nanoInHour, nanoInUtcDay } from './units'
import { createLazyGenerator, pluckProps } from './utils'
import { moveByIsoDays } from './move'
import { ZonedDateTimeSlots, ZonedEpochSlots, createZonedDateTimeSlots } from './slots'
import { formatOffsetNano } from './formatIso'
import * as errorMessages from './errorMessages'
import { DateTimeFields } from './calendarFields'

export type OffsetNanosecondsOp = (epochNano: DayTimeNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => DayTimeNano[]

export type TimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
  getPossibleInstantsFor: PossibleInstantsOp,
}

export type TimeZoneOffsetOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp
}

export type FixedIsoFields<C> = IsoDateTimeFields & { calendar: C, offsetNanoseconds: number }

export type ZonedIsoFields<C, T> = IsoDateTimeFields & { calendar: C, timeZone: T, offset: string }

export type ZonedDateTimeFields = DateTimeFields & { offset: string }

// ISO <-> Epoch conversions (on passed-in instances)
// -------------------------------------------------------------------------------------------------

export function zonedEpochNanoToIso(
  timeZoneOps: TimeZoneOffsetOps,
  epochNano: DayTimeNano
): IsoDateTimeFields {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export const zonedEpochSlotsToIso = createLazyGenerator(_zonedEpochSlotsToIso, WeakMap) as
  typeof _zonedEpochSlotsToIso

function _zonedEpochSlotsToIso<C, T>(
  slots: ZonedEpochSlots<C, T>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
): FixedIsoFields<C>
function _zonedEpochSlotsToIso<C, T>(
  slots: ZonedEpochSlots<C, T>,
  timeZoneOps: TimeZoneOffsetOps,
): FixedIsoFields<C>
function _zonedEpochSlotsToIso<C, T>(
  slots: ZonedEpochSlots<C, T>, // goes first because key
  getTimeZoneOps: ((timeZoneSlot: T) => TimeZoneOffsetOps) | TimeZoneOffsetOps,
): FixedIsoFields<C> {
  const { epochNanoseconds } = slots
  const timeZoneOps = isTimeZoneOffsetOps(getTimeZoneOps)
    ? getTimeZoneOps
    : getTimeZoneOps(slots.timeZone!)

  const offsetNanoseconds = timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    calendar: slots.calendar,
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
}

export function buildZonedIsoFields<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>
): ZonedIsoFields<C, T> {
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
    ...zonedEpochSlotsToIso(zonedDateTimeSlots, timeZoneOps),
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
    zonedEpochSlotsToIso(zonedDateTimeSlots, timeZoneOps),
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

function isTimeZoneOffsetOps(input: any): input is TimeZoneOffsetOps {
  return input.getOffsetNanosecondsFor
}
