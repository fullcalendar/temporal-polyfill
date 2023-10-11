import { ensureNumber, ensureString } from './cast'
import { createProtocolChecker } from './complexObjUtils'
import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { Instant, createInstant, getInstantSlots } from './instant'
import { IsoDateTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToIso, isoToEpochNano, isoToEpochNanoWithOffset, moveByIsoDays } from './isoMath'
import { parseMaybeOffsetNano, parseTimeZoneId } from './isoParse'
import { EpochDisambig, OffsetDisambig } from './options'
import { createPlainDateTime } from './plainDateTime'
import { roundToMinute } from './round'
import { InstantBranding, IsoDateSlots, IsoDateTimeSlots, PlainDateTimeBranding, ZonedEpochSlots, getSlots } from './slots'
import { TimeZoneArg, TimeZoneProtocol } from './timeZone'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { createLazyGenerator, isObjectlike } from './utils'

export type TimeZoneSlot = TimeZoneProtocol | string

export const utcTimeZoneId = 'UTC'

const checkTimeZoneProtocol = createProtocolChecker([
  'getPossibleInstantsFor',
  'getOffsetNanosecondsFor',
])

export function refineTimeZoneSlot(arg: TimeZoneArg): TimeZoneSlot {
  if (isObjectlike(arg)) {
    const { timeZone } = (getSlots(arg) || {}) as { timeZone?: TimeZoneSlot }

    if (timeZone) {
      return timeZone // TimeZoneOps
    }

    checkTimeZoneProtocol(arg as TimeZoneProtocol)
    return arg as TimeZoneProtocol
  }
  return refineTimeZoneSlotString(arg)
}

export function refineTimeZoneSlotString(arg: string): string {
  return parseTimeZoneId(ensureString(arg))
}

export function timeZoneGetOffsetNanosecondsFor(
  timeZoneSlot: TimeZoneSlot,
  epochNano: DayTimeNano,
): number {
  if (typeof timeZoneSlot === 'string') {
    return queryTimeZoneImpl(timeZoneSlot).getOffsetNanosecondsFor(epochNano)
  }
  return validateOffsetNano(
    timeZoneSlot.getOffsetNanosecondsFor(
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
}

export function timeZoneGetPossibleInstantsFor(
  timeZoneSlot: TimeZoneSlot,
  isoDateTimeSlots: IsoDateTimeSlots,
): DayTimeNano[] {
  if (typeof timeZoneSlot === 'string') {
    return queryTimeZoneImpl(timeZoneSlot).getPossibleInstantsFor(isoDateTimeSlots)
  }
  return [...timeZoneSlot.getPossibleInstantsFor(
    createPlainDateTime({
      ...isoDateTimeSlots,
      branding: PlainDateTimeBranding,
    })
  )].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}

export function getCommonTimeZoneSlot(a: TimeZoneSlot, b: TimeZoneSlot): TimeZoneSlot {
  if (!isTimeZoneSlotsEqual(a, b, true)) { // loose=true
    throw new RangeError(`TimeZones not equal`)
  }
  return a
}

export function isTimeZoneSlotsEqual(a: TimeZoneSlot, b: TimeZoneSlot, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: TimeZoneSlot, loose?: boolean): string | number {
  const id = getTimeZoneSlotId(slot)

  if (loose && id === 'UTC') {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}

export function getTimeZoneSlotId(slot: TimeZoneSlot): string {
  return typeof slot === 'string' ? slot : ensureString(slot.id)
}

export function validateOffsetNano(offsetNano: number): number {
  if (!Number.isInteger(ensureNumber(offsetNano))) {
    throw new RangeError('must be integer number')
  }

  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError('out of range')
  }

  return offsetNano
}

// Public Utils
// ------------

export function computeNanosecondsInDay(
  timeZoneSlot: TimeZoneSlot,
  isoDateFields: IsoDateSlots, // could contain time fields though
): number {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneSlot, { ...isoDateFields, ...isoTimeFieldDefaults, })
  const epochNano1 = getSingleInstantFor(timeZoneSlot, { ...moveByIsoDays(isoDateFields, 1), ...isoTimeFieldDefaults, calendar: isoDateFields.calendar })

  const nanoInDay = dayTimeNanoToNumber(
    diffDayTimeNanos(epochNano0, epochNano1)
  )

  if (nanoInDay <= 0) {
    throw new RangeError('Bad nanoseconds in day')
  }

  return nanoInDay
}

export function getMatchingInstantFor(
  timeZoneSlot: TimeZoneSlot,
  isoDateTimeSlots: IsoDateTimeSlots,
  offsetNano: number | undefined,
  hasZ: boolean,
  // need these defaults?
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy = false,
): DayTimeNano {
  const possibleEpochNanos = timeZoneGetPossibleInstantsFor(timeZoneSlot, isoDateTimeSlots)

  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoToEpochNanoWithOffset(isoDateTimeSlots, offsetNano)
    }

    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoDateTimeSlots,
      offsetNano,
      epochFuzzy,
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

  return getSingleInstantFor(timeZoneSlot, isoDateTimeSlots, epochDisambig, possibleEpochNanos)
}

function findMatchingEpochNano(
  possibleEpochNanos: DayTimeNano[],
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number,
  fuzzy: boolean,
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
  timeZoneSlot: TimeZoneSlot,
  isoDateTimeSlots: IsoDateTimeSlots,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: DayTimeNano[] = timeZoneGetPossibleInstantsFor(timeZoneSlot, isoDateTimeSlots)
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
    return possibleEpochNanos[
      disambig === EpochDisambig.Later
        ? 1
        : 0 // 'earlier' and 'compatible'
    ]
  }

  // within a transition that jumps forward...
  // ('compatible' means 'later')

  const zonedEpochNano = isoToEpochNano(isoDateTimeSlots)!
  const gapNano = computeGapNear(timeZoneSlot, zonedEpochNano)

  const shiftNano = gapNano * (
    disambig === EpochDisambig.Earlier
      ? -1
      : 1) // 'later' or 'compatible'

  possibleEpochNanos = timeZoneGetPossibleInstantsFor(timeZoneSlot, {
    ...epochNanoToIso(zonedEpochNano, shiftNano), // abuse of offsetNano!
    calendar: isoDateTimeSlots.calendar,
  })

  return possibleEpochNanos[
    disambig === EpochDisambig.Earlier
      ? 0
      : possibleEpochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(timeZoneSlot: TimeZoneSlot, zonedEpochNano: DayTimeNano): number {
  const startOffsetNano = timeZoneGetOffsetNanosecondsFor(
    timeZoneSlot,
    addDayTimeNanoAndNumber(zonedEpochNano, -nanoInUtcDay),
  )
  const endOffsetNano = timeZoneGetOffsetNanosecondsFor(
    timeZoneSlot,
    addDayTimeNanoAndNumber(zonedEpochNano, nanoInUtcDay),
  )
  return endOffsetNano - startOffsetNano
}

export const zonedInternalsToIso = createLazyGenerator((internals: ZonedEpochSlots) => {
  const { calendar, timeZone, epochNanoseconds } = internals
  const offsetNanoseconds = timeZoneGetOffsetNanosecondsFor(timeZone, epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
    calendar,
  }
})

export function zonedEpochNanoToIso(
  timeZoneSlot: TimeZoneSlot,
  epochNano: DayTimeNano,
): IsoDateTimeFields {
  const offsetNano = timeZoneGetOffsetNanosecondsFor(timeZoneSlot, epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}
