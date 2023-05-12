import { strictArray, strictNumber } from './cast'
import { Instant, createInstant } from './instant'
import {
  createInternalClass,
  createInternalGetter,
  getInternals,
  internalIdGetters,
} from './internalClass'
import { nanosecondsInDay } from './nanoseconds'
import { createPlainDateTime } from './plainDateTime'
import { createTimeZone } from './timeZone'
import { queryTimeZoneImpl } from './timeZoneImpl'

export const utcTimeZoneId = 'UTC'

export function queryTimeZoneOps(timeZoneSlot) {
  if (typeof timeZoneSlot === 'object') {
    return new TimeZoneOpsAdapter(timeZoneSlot)
  }
  return queryTimeZoneImpl(timeZoneSlot) // string
}

export function getCommonTimeZoneOps(internals0, internals1) {
}

export function getPublicTimeZone(internals) {
  const { timeZone } = internals
  return getInternals(timeZone) || // if TimeZoneOpsAdapter
    createTimeZone(timeZone) // if TimeZoneImpl
}

// Public Utils
// ------------

export function getBestInstantFor(
  timeZoneOps,
  isoDateTimeFields,
  disambig = 'compatible',
) {
}

export function computeIsoFieldEpochNanoseconds(
  timeZoneOps,
  isoDateTimeFields,
  offset,
  z,
  offsetHandling, // 'reject'
  disambig, // 'compatible'
  fuzzy,
) {
}

export function computeNanosecondsInDay(
  timeZoneOps,
  isoFields,
) {
}

// Adapter
// -------

const getStrictInstantEpochNanoseconds = createInternalGetter(Instant)

const TimeZoneOpsAdapter = createInternalClass(internalIdGetters, {
  getOffsetNanosecondsFor(timeZone, epochNanoseconds) {
    const nanoseconds = strictNumber( // TODO: integer?
      timeZone.getOffsetNanosecondsFor(createInstant(epochNanoseconds)),
    )

    if (Math.abs(nanoseconds) >= nanosecondsInDay) {
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
