import {
  createProtocolChecker,
  createWrapperClass,
  getCommonInnerObj,
  getInternals,
  getStrictInternals,
  idGettersStrict,
} from './class'
import { Instant, createInstant } from './instant'
import { isoTimeFieldDefaults } from './isoFields'
import {
  epochNanoToIso,
  isoToEpochNano,
} from './isoMath'
import { moveDateByDays } from './move'
import { strictArray, strictNumber } from './options'
import { createPlainDateTime } from './plainDateTime'
import { roundToMinute } from './round'
import { TimeZone, createTimeZone, timeZoneProtocolMethods } from './timeZone'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { nanoInUtcDay } from './units'
import { createLazyMap } from './utils'

export const utcTimeZoneId = 'UTC'

const checkTimeZoneProtocol = createProtocolChecker(timeZoneProtocolMethods)

export function queryTimeZoneOps(timeZoneArg) {
  if (typeof timeZoneArg === 'object') {
    if (timeZoneArg instanceof TimeZone) {
      return getInternals(timeZoneArg)
    }

    checkTimeZoneProtocol(timeZoneArg)
    return new TimeZoneOpsAdapter(timeZoneArg)
  }

  return queryTimeZoneImpl(toString(timeZoneArg))
}

export function getPublicTimeZone(internals) {
  const { timeZone } = internals

  return getInternals(timeZone) || // TimeZoneOpsAdapter (return internal TimeZone)
    createTimeZone(timeZone) // TimeZoneImpl (create outer TimeZone)
}

export const getCommonTimeZoneOps = getCommonInnerObj.bind(undefined, 'timeZone')

// Public Utils
// ------------

export function computeNanosecondsInDay(
  timeZoneOps,
  isoDateFields, // could contain time fields though
) {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }
  const epochNano0 = getSingleInstantFor(timeZoneOps, isoDateFields)
  const epochNano1 = getSingleInstantFor(timeZoneOps, moveDateByDays(isoDateFields, 1))
  return epochNano1.sub(epochNano0).toNumber()
}

export function getMatchingInstantFor(
  timeZoneOps,
  isoDateTimeFields,
  offsetNano, // optional
  hasZ,
  // need these defaults?
  offsetHandling = 'reject',
  disambig = 'compatible',
  fuzzy = false,
) {
  if (offsetNano !== undefined && offsetHandling !== 'ignore') {
    // we ALWAYS use Z as a zero offset
    if (offsetHandling === 'use' || hasZ) {
      return isoToEpochNano(isoDateTimeFields).sub(offsetNano)
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

    if (offsetHandling === 'reject') {
      throw new RangeError('Mismatching offset/timezone')
    }
    // else (offsetHandling === 'prefer') ...
  }

  return getSingleInstantFor(timeZoneOps, isoDateTimeFields, disambig)
}

function findMatchingEpochNano(timeZoneOps, isoDateTimeFields, offsetNano, fuzzy) {
  const possibleEpochNanos = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)
  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)

  if (fuzzy) {
    offsetNano = roundToMinute(offsetNano)
  }

  for (const possibleEpochNano of possibleEpochNanos) {
    let possibleOffsetNano = zonedEpochNano.sub(possibleEpochNano).toNumber()

    if (fuzzy) {
      possibleOffsetNano = roundToMinute(possibleOffsetNano)
    }

    if (possibleOffsetNano === offsetNano) {
      return possibleEpochNano
    }
  }
}

export function getSingleInstantFor(
  timeZoneOps,
  isoDateTimeFields,
  disambig = 'compatible',
) {
  let epochNanos = timeZoneOps.getPossibleInstantsFor(isoDateTimeFields)

  if (epochNanos.length === 1) {
    return epochNanos[0]
  }

  if (disambig === 'reject') {
    throw new RangeError('Ambiguous offset')
  }

  // within a transition that jumps back
  // ('compatible' means 'earlier')
  if (epochNanos.length) {
    return epochNanos[
      disambig === 'later'
        ? 1
        : 0 // 'earlier' and 'compatible'
    ]
  }

  // within a transition that jumps forward...
  // ('compatible' means 'later')

  const zonedEpochNano = isoToEpochNano(isoDateTimeFields)
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  epochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIso(
      zonedEpochNano.addNumber(gapNano * (
        disambig === 'earlier'
          ? -1
          : 1 // 'later' or 'compatible'
      )),
    ),
  )

  return epochNanos[
    disambig === 'earlier'
      ? 0
      : epochNanos.length - 1 // 'later' or 'compatible'
  ]
}

function computeGapNear(timeZoneOps, zonedEpochNano) {
  const startOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    zonedEpochNano.addNumber(-nanoInUtcDay),
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    zonedEpochNano.addNumber(nanoInUtcDay),
  )
  return endOffsetNano - startOffsetNano
}

export const zonedInternalsToIso = createLazyMap((internals) => {
  const { timeZone, epochNanoseconds } = internals
  const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds.addNumber(offsetNanoseconds))

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
})

export function zonedEpochNanoToIso(timeZoneOps, epochNano) {
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano.addNumber(offsetNano))
}

// Adapter
// -------

const getInstantEpochNano = getStrictInternals.bind(undefined, Instant)

export const TimeZoneOpsAdapter = createWrapperClass(idGettersStrict, {
  getOffsetNanosecondsFor(timeZone, epochNano) {
    return validateOffsetNano(timeZone.getOffsetNanosecondsFor(createInstant(epochNano)))
  },

  getPossibleInstantsFor(timeZone, isoDateTimeFields) {
    return strictArray(timeZone.getPossibleInstantsFor(createPlainDateTime(isoDateTimeFields)))
      .map(getInstantEpochNano)
  },
})

function validateOffsetNano(offsetNano) {
  offsetNano = strictNumber(offsetNano)

  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError('out of range')
  }

  return offsetNano
}
