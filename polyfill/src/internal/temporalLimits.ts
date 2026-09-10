import { bigNanoInUtcDay } from './bigNano'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { epochNanoDayMax, isoYearMax, isoYearMin } from './temporalConstants'
import { timeFieldsToNano } from './timeFieldMath'
import { throwRangeError } from './utils'

/*
TODO: move all check* calls as late as possible, right before record-creation,
even for moving!
*/

const epochNanoMax = BigInt(epochNanoDayMax) * bigNanoInUtcDay
const epochNanoMin = BigInt(-epochNanoDayMax) * bigNanoInUtcDay
const plainDateEpochNanoMin = epochNanoMin - bigNanoInUtcDay
export const isoYearMonthIndexMin = isoYearMin * 12 + 4
export const isoYearMonthIndexMax = isoYearMax * 12 + 9

export function checkIsoYearMonthInBounds(
  isoDate: CalendarDateFields,
): CalendarDateFields {
  const isoYearMonthIndex = isoDate.year * 12 + isoDate.month
  if (
    isoYearMonthIndex < isoYearMonthIndexMin ||
    isoYearMonthIndex > isoYearMonthIndexMax
  ) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }

  return isoDate
}

export function checkIsoDateInBounds(
  isoDate: CalendarDateFields,
  allowPlainDateLowerEdge = true,
): CalendarDateFields {
  // PlainDate bounds are date-level bounds, not midnight-instant bounds.
  // They include the lower extra ISO day that PlainDateTime only allows after
  // midnight. Zoned operations pass false for strict CheckISODaysRange.
  const epochNano = isoDateToEpochNano(isoDate)
  const min = allowPlainDateLowerEdge ? plainDateEpochNanoMin : epochNanoMin
  if (epochNano < min || epochNano > epochNanoMax) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }
  return isoDate
}

// Plain-week probes already have a midnight epoch. Keep this scalar range
// check independent of field conversion and the zoned lower-bound switch.
export function checkIsoDateEpochNanoInBounds(epochNano: bigint): bigint {
  if (epochNano < plainDateEpochNanoMin || epochNano > epochNanoMax) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

export function checkIsoDateTimeInBounds(
  isoDateTime: CalendarDateTimeFields,
): CalendarDateTimeFields {
  checkIsoDateTimeEpochNanoInBounds(isoDateTimeToEpochNano(isoDateTime))
  return isoDateTime
}

/*
PlainDateTime limits on an epoch that includes the time of day. The lower
edge permits one extra ISO day, but not midnight of that day, so the epoch
must be later than that midnight. The upper edge ends on epoch day +100000000
at 23:59:59.999999999, so the epoch must be before the following midnight.
*/
export function checkIsoDateTimeEpochNanoInBounds(epochNano: bigint): bigint {
  if (
    epochNano <= plainDateEpochNanoMin ||
    epochNano >= epochNanoMax + bigNanoInUtcDay
  ) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

export function checkEpochNanoInBounds(epochNano: bigint): bigint {
  if (epochNano < epochNanoMin || epochNano > epochNanoMax) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

/*
For converting to proper epochNano values
CALLERS DO NOT NEED TO CHECK in-bounds!
(Result should be considered a finalized "Instant")
*/
export function isoDateTimeAndOffsetToEpochNano(
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number,
): bigint {
  const epochNano =
    isoDateToEpochNano(isoDateTime) +
    BigInt(timeFieldsToNano(isoDateTime) - offsetNano)
  return checkEpochNanoInBounds(epochNano)
}
