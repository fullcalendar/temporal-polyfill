import {
  WrapperInstance,
  createProtocolChecker,
  createWrapperClass,
  getCommonInnerObj,
  getInternals,
  getStrictInternals,
  idGettersStrict,
} from './class'
import { Instant, createInstant } from './instant'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './isoFields'
import {
  epochNanoToIso,
  isoToEpochNano,
} from './isoMath'
import { LargeInt } from './largeInt'
import { moveDateByDays } from './move'
import { EpochDisambig, OffsetDisambig, ensureArray, toString } from './options'
import { createPlainDateTime } from './plainDateTime'
import { roundToMinute } from './round'
import { TimeZone, TimeZoneArg, TimeZoneProtocol, createTimeZone, timeZoneProtocolMethods } from './timeZone'
import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { createLazyGenerator } from './utils'
import { ZonedInternals } from './zonedDateTime'

export interface TimeZoneOps {
  id: string
  getOffsetNanosecondsFor(epochNano: LargeInt): number
  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): LargeInt[]
}

// TODO: best place for this? see CalendarInternals. see ZonedInternals
export interface TimeZoneInternals {
  timeZone: TimeZoneOps
}

export const utcTimeZoneId = 'UTC'

const checkTimeZoneProtocol = createProtocolChecker(timeZoneProtocolMethods)

export function queryTimeZoneOps(timeZoneArg: TimeZoneArg): TimeZoneOps {
  if (typeof timeZoneArg === 'object') {
    if (timeZoneArg instanceof TimeZone) {
      return getInternals(timeZoneArg as TimeZone)
    }

    checkTimeZoneProtocol(timeZoneArg)
    return new TimeZoneOpsAdapter(timeZoneArg)
  }

  return queryTimeZoneImpl(toString(timeZoneArg))
}

export function getPublicTimeZone(internals: { timeZone: TimeZoneOps }): TimeZoneProtocol {
  const { timeZone } = internals

  return getInternals(timeZone as TimeZoneOpsAdapter) ||
    createTimeZone(timeZone as TimeZoneImpl)
}

export const getCommonTimeZoneOps = getCommonInnerObj.bind<
  any, [any], // bound
  [TimeZoneInternals, TimeZoneInternals], // unbound
  TimeZoneOps // return
>(undefined, 'timeZone')

// Public Utils
// ------------

export function computeNanosecondsInDay(
  timeZoneOps: TimeZoneOps,
  isoDateFields: IsoDateFields, // could contain time fields though
): number {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }

  // TODO: have getSingleInstantFor accept IsoDateFields?
  const epochNano0 = getSingleInstantFor(timeZoneOps, { ...isoTimeFieldDefaults, ...isoDateFields })
  const epochNano1 = getSingleInstantFor(timeZoneOps, { ...isoTimeFieldDefaults, ...moveDateByDays(isoDateFields, 1) })

  return epochNano1.addLargeInt(epochNano0, -1).toNumber()
}

export function getMatchingInstantFor(
  timeZoneOps: TimeZoneOps,
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number | undefined,
  hasZ: boolean,
  // need these defaults?
  offsetHandling: OffsetDisambig = OffsetDisambig.Reject,
  disambig: EpochDisambig = EpochDisambig.Compat,
  fuzzy = false,
): LargeInt {
  if (offsetNano !== undefined && offsetHandling !== OffsetDisambig.Ignore) {
    // we ALWAYS use Z as a zero offset
    if (offsetHandling === OffsetDisambig.Use || hasZ) {
      return isoToEpochNano(isoDateTimeFields)!.addNumber(-offsetNano)
    }

    const matchingEpochNano = findMatchingEpochNano(
      timeZoneOps,
      isoDateTimeFields,
      offsetNano,
      fuzzy,
    )

    if (matchingEpochNano !== undefined) {
      return matchingEpochNano
    }

    if (offsetHandling === OffsetDisambig.Reject) {
      throw new RangeError('Mismatching offset/timezone')
    }
    // else (offsetHandling === 'prefer') ...
  }

  return getSingleInstantFor(timeZoneOps, isoDateTimeFields, disambig)
}

function findMatchingEpochNano(
  timeZoneOps: TimeZoneOps,
  isoDateTimeFields: IsoDateTimeFields,
  offsetNano: number,
  fuzzy: boolean,
): LargeInt | undefined {
  const possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)
  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)!

  if (fuzzy) {
    offsetNano = roundToMinute(offsetNano)
  }

  for (const possibleEpochNano of possibleEpochNanos) {
    let possibleOffsetNano = zonedEpochNano.addLargeInt(possibleEpochNano, -1).toNumber()

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
): LargeInt {
  let epochNanos = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)

  if (epochNanos.length === 1) {
    return epochNanos[0]
  }

  if (disambig === EpochDisambig.Reject) {
    throw new RangeError('Ambiguous offset')
  }

  // within a transition that jumps back
  // ('compatible' means 'earlier')
  if (epochNanos.length) {
    return epochNanos[
      disambig === EpochDisambig.Later
        ? 1
        : 0 // 'earlier' and 'compatible'
    ]
  }

  // within a transition that jumps forward...
  // ('compatible' means 'later')

  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)!
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  epochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIso(
      zonedEpochNano.addNumber(gapNano * (
        disambig === EpochDisambig.Earlier
          ? -1
          : 1 // 'later' or 'compatible'
      )),
    ),
  )

  return epochNanos[
    disambig === EpochDisambig.Earlier
      ? 0
      : epochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(timeZoneOps: TimeZoneOps, zonedEpochNano: LargeInt): number {
  const startOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    zonedEpochNano.addNumber(-nanoInUtcDay),
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    zonedEpochNano.addNumber(nanoInUtcDay),
  )
  return endOffsetNano - startOffsetNano
}

export const zonedInternalsToIso = createLazyGenerator((internals: ZonedInternals) => {
  const { calendar, timeZone, epochNanoseconds } = internals
  const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds.addNumber(offsetNanoseconds))

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
    calendar,
  }
})

export function zonedEpochNanoToIso(timeZoneOps: TimeZoneOps, epochNano: LargeInt): IsoDateTimeFields {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano.addNumber(offsetNano))
}

// Adapter
// -------

const getInstantEpochNano = getStrictInternals.bind<
  any, [any], // bound
  [Instant], // unbound
  LargeInt // return
>(undefined, Instant)

const timeZoneOpsAdapterMethods = {
  getOffsetNanosecondsFor(timeZone: TimeZoneProtocol, epochNano: LargeInt): number {
    return validateOffsetNano(timeZone.getOffsetNanosecondsFor(createInstant(epochNano)))
  },

  getPossibleInstantsFor(timeZone: TimeZoneProtocol, isoDateTimeFields: IsoDateTimeFields): LargeInt[] {
    return ensureArray(timeZone.getPossibleInstantsFor(createPlainDateTime(isoDateTimeFields)))
      .map(getInstantEpochNano)
  },
}

type TimeZoneOpsAdapter = WrapperInstance<
  TimeZoneProtocol, // internals
  typeof idGettersStrict, // getters
  typeof timeZoneOpsAdapterMethods // methods
>

const TimeZoneOpsAdapter = createWrapperClass<
  [TimeZoneProtocol], // constructor
  TimeZoneProtocol, // internals
  typeof idGettersStrict, // getters
  typeof timeZoneOpsAdapterMethods // methods
>(idGettersStrict, timeZoneOpsAdapterMethods)

function validateOffsetNano(offsetNano: number): number {
  if (!Number.isInteger(offsetNano)) { // will return false on non-number (good)
    throw new RangeError('must be integer number')
  }

  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError('out of range')
  }

  return offsetNano
}
