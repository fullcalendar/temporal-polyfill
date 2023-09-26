import { createProtocolChecker } from './complexObjUtils'
import { IsoDateFields, isoTimeFieldDefaults, IsoDateTimeFields } from './isoFields'
import {
  epochNanoToIso,
  isoToEpochNano,
  isoToEpochNanoWithOffset,
  moveByIsoDays,
} from './isoMath'
import { parseMaybeOffsetNano, parseTimeZoneId } from './isoParse'
import { EpochDisambig, OffsetDisambig } from './options'
import { ensureNumber, ensureString } from './cast'
import { roundToMinute } from './round'
import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { createLazyGenerator, isObjectlike } from './utils'
import { DayTimeNano, addDayTimeNanoAndNumber, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { TimeZoneOpsAdapter } from './timeZoneOpsAdapter'
import { InstantBranding, TimeZoneBranding, ZonedEpochSlots, getSlots } from './slots'

// public
import { TimeZone, TimeZoneArg, TimeZoneProtocol, createTimeZone } from './timeZone'
import { createInstant } from './instant'

export interface TimeZoneOps {
  id: string
  getOffsetNanosecondsFor(epochNano: DayTimeNano): number
  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): DayTimeNano[]
}

// TODO: best place for this? see CalendarSlots. see ZonedEpochSlots
export interface TimeZoneInternals {
  timeZone: TimeZoneOps
}

export const utcTimeZoneId = 'UTC'

const checkTimeZoneProtocol = createProtocolChecker([
  'getPossibleInstantsFor',
  'getOffsetNanosecondsFor',
])

export function queryTimeZoneOps(timeZoneArg: TimeZoneArg): TimeZoneOps {
  if (isObjectlike(timeZoneArg)) {
    const { timeZone } = (getSlots(timeZoneArg) || {}) as { timeZone?: TimeZoneOps }

    if (timeZone) {
      return timeZone // TimeZoneOps
    }

    checkTimeZoneProtocol(timeZoneArg as TimeZoneProtocol)
    return new TimeZoneOpsAdapter(timeZoneArg as TimeZoneProtocol)
  }

  return queryTimeZoneImpl(parseTimeZoneId(ensureString(timeZoneArg)))
}

export function queryTimeZonePublic(timeZoneArg: TimeZoneArg): TimeZoneProtocol {
  if (isObjectlike(timeZoneArg)) {
    const slots = getSlots(timeZoneArg)
    const { branding } = slots || {}

    if (branding === TimeZoneBranding) {
      return timeZoneArg as any
    }

    const { timeZone } = (getSlots(timeZoneArg) || {}) as { timeZone?: TimeZoneOps }

    return timeZone
      ? timeZoneOpsToPublic(timeZone)
      : (
        checkTimeZoneProtocol(timeZoneArg as TimeZoneProtocol),
        timeZoneArg as TimeZoneProtocol
      )
  }

  return createTimeZone({
    branding: TimeZoneBranding,
    impl: queryTimeZoneImpl(parseTimeZoneId(ensureString(timeZoneArg)))
  })
}

export function getPublicTimeZone(internals: { timeZone: TimeZoneOps }): TimeZoneProtocol {
  return timeZoneOpsToPublic(internals.timeZone)
}

function timeZoneOpsToPublic(timeZoneOps: TimeZoneOps): TimeZoneProtocol {
  return timeZoneOps instanceof TimeZoneOpsAdapter
    ? timeZoneOps.t
    : createTimeZone({
        branding: TimeZoneBranding,
        impl: timeZoneOps as TimeZoneImpl
      })
}

// TODO: cleanup. previously used getCommonInnerObj
export function getCommonTimeZoneOps(internals0: TimeZoneInternals, internals1: TimeZoneInternals): TimeZoneOps {
  const internal0 = internals0.timeZone
  const internal1 = internals1.timeZone

  if (!isTimeZonesEqual(internal0, internal1, true)) {
    throw new RangeError(`TimeZones not equal`)
  }

  return internal0
}

// Public Utils
// ------------

export function computeNanosecondsInDay(
  timeZoneOps: TimeZoneOps,
  isoDateFields: IsoDateFields, // could contain time fields though
): number {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneOps, { ...isoDateFields, ...isoTimeFieldDefaults, })
  const epochNano1 = getSingleInstantFor(timeZoneOps, { ...moveByIsoDays(isoDateFields, 1), ...isoTimeFieldDefaults })

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
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number | undefined,
  hasZ: boolean,
  // need these defaults?
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
  epochFuzzy = false,
): DayTimeNano {
  const possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)

  if (offsetNano !== undefined && offsetDisambig !== OffsetDisambig.Ignore) {
    // we ALWAYS use Z as a zero offset
    if (offsetDisambig === OffsetDisambig.Use || hasZ) {
      return isoToEpochNanoWithOffset(isoDateTimeFields, offsetNano)
    }

    const matchingEpochNano = findMatchingEpochNano(
      possibleEpochNanos,
      isoDateTimeFields,
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
    return isoToEpochNano(isoDateTimeFields)!
  }

  return getSingleInstantFor(timeZoneOps, isoDateTimeFields, epochDisambig, possibleEpochNanos)
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
  timeZoneOps: TimeZoneOps,
  isoDateTimeFields: IsoDateTimeFields,
  disambig: EpochDisambig = EpochDisambig.Compat,
  possibleEpochNanos: DayTimeNano[] = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)
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

  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)!
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  const shiftNano = gapNano * (
    disambig === EpochDisambig.Earlier
      ? -1
      : 1) // 'later' or 'compatible'

  possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIso(zonedEpochNano, shiftNano), // abuse of offsetNano!
  )

  return possibleEpochNanos[
    disambig === EpochDisambig.Earlier
      ? 0
      : possibleEpochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(timeZoneOps: TimeZoneOps, zonedEpochNano: DayTimeNano): number {
  const startOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, -nanoInUtcDay),
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    addDayTimeNanoAndNumber(zonedEpochNano, nanoInUtcDay),
  )
  return endOffsetNano - startOffsetNano
}

export const zonedInternalsToIso = createLazyGenerator((internals: ZonedEpochSlots) => {
  const { calendar, timeZone, epochNanoseconds } = internals
  const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
    calendar,
  }
})

export function zonedEpochNanoToIso(
  timeZoneOps: TimeZoneOps,
  epochNano: DayTimeNano,
): IsoDateTimeFields {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

// YUCK
export function zonedEpochNanoToIsoWithTZObj(
  timeZone: TimeZone,
  epochNano: DayTimeNano,
): IsoDateTimeFields {
  // emulate what TimeZone::getOffsetNanosecondsFor does
  const offsetNano = validateOffsetNano(
    timeZone.getOffsetNanosecondsFor(
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
  return epochNanoToIso(epochNano, offsetNano)
}

// YUCK!: we're using Calendar object directly here. check type in case of subclass
export function isTimeZonesEqual(a: { id: string }, b: TimeZoneOps, loose?: boolean) {
  return a === b || getTimeZoneRawValue(ensureString(a.id), loose) === getTimeZoneRawValue(b.id, loose)
}

// normalized
function getTimeZoneRawValue(id: string, loose?: boolean): string | number {
  if (loose && id === 'UTC') {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
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
