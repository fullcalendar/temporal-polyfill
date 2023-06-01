import { Instant, createInstant } from './instant'
import { isoTimeFieldDefaults } from './isoFields'
import {
  addDaysToIsoFields,
  epochNanoToIsoFields,
  isoFieldsToEpochNano,
  nanosecondsInIsoDay,
} from './isoMath'
import { strictArray, strictNumber } from './options'
import { createPlainDateTime } from './plainDateTime'
import { roundToMinute } from './round'
import { createTimeZone } from './timeZone'
import { queryTimeZoneImpl } from './timeZoneImpl'
import {
  createInternalGetter,
  createWrapperClass,
  getInternals,
  internalIdGetters,
} from './wrapperClass'

export const utcTimeZoneId = 'UTC'

export function queryTimeZoneOps(timeZoneSlot) {
  if (typeof timeZoneSlot === 'object') {
    return new TimeZoneOpsAdapter(timeZoneSlot)
  }
  return queryTimeZoneImpl(timeZoneSlot) // string
}

export function getPublicTimeZone(internals) {
  const { timeZone } = internals
  return getInternals(timeZone) || // if TimeZoneOpsAdapter
    createTimeZone(timeZone) // if TimeZoneImpl
}

export function getCommonTimeZoneOps(internals0, internals1) {
  // TODO
}

// Public Utils
// ------------

export function computeNanosecondsInDay(
  timeZoneOps,
  isoDateFields, // could contain time fields though
) {
  isoDateFields = { ...isoDateFields, ...isoTimeFieldDefaults }
  const epochNano0 = getSingleInstantFor(timeZoneOps, isoDateFields)
  const epochNano1 = getSingleInstantFor(timeZoneOps, addDaysToIsoFields(isoDateFields, 1))
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
      return isoFieldsToEpochNano(isoDateTimeFields).sub(offsetNano)
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
  const zonedEpochNano = isoFieldsToEpochNano(isoDateTimeFields)

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

  const zonedEpochNano = isoFieldsToEpochNano(isoDateTimeFields)
  const gapNano = computeGapNear(timeZoneOps, zonedEpochNano)

  epochNanos = timeZoneOps.getPossibleInstantsFor(
    epochNanoToIsoFields(
      zonedEpochNano.add(gapNano * (
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
    zonedEpochNano.add(-nanosecondsInIsoDay),
  )
  const endOffsetNano = timeZoneOps.getOffsetNanosecondsFor(
    zonedEpochNano.add(nanosecondsInIsoDay),
  )
  return endOffsetNano - startOffsetNano
}

// Adapter
// -------

const getStrictInstantEpochNanoseconds = createInternalGetter(Instant)

const TimeZoneOpsAdapter = createWrapperClass(internalIdGetters, {
  getOffsetNanosecondsFor(timeZone, epochNanoseconds) {
    const nanoseconds = strictNumber( // TODO: integer?
      timeZone.getOffsetNanosecondsFor(createInstant(epochNanoseconds)),
    )

    if (Math.abs(nanoseconds) >= nanosecondsInIsoDay) {
      throw new RangeError('out of range')
    }

    return nanoseconds
  },

  getPossibleInstantsFor(timeZone, isoDateTimeFields) {
    return strictArray(
      timeZone.getPossibleInstantsFor(
        createPlainDateTime(isoDateTimeFields), // hopefully won't look at blank .calendar
      ),
    ).map(getStrictInstantEpochNanoseconds)
  },
})
