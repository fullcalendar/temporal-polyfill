import { bigNanoInUtcDay } from './bigNano'
import { isoDateTimeToEpochNano } from './epochMath'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { Overflow } from './optionsModel'
import { epochNanoDayMax, isoYearMax, isoYearMin } from './temporalConstants'
import { nanoToTimeAndDay, timeFieldsToNano } from './timeFieldMath'
import { clampProp } from './utils'

/*
TODO: move all check* calls as late as possible, right before record-creation,
even for moving!
*/

const epochNanoMax = BigInt(epochNanoDayMax) * bigNanoInUtcDay
const epochNanoMin = BigInt(-epochNanoDayMax) * bigNanoInUtcDay
const isoNoonFieldDefaults: TimeFields = {
  ...timeFieldDefaults,
  hour: 12,
}

export function checkIsoYearMonthInBounds(
  isoDate: CalendarDateFields,
): CalendarDateFields {
  // TODO: just authenticate based on hardcoded min/max isoYear/Month/Day. for other types too
  clampProp(isoDate, 'year', isoYearMin, isoYearMax, Overflow.Reject)

  if (isoDate.year === isoYearMin) {
    clampProp(isoDate, 'month', 4, 12, Overflow.Reject)
  } else if (isoDate.year === isoYearMax) {
    clampProp(isoDate, 'month', 1, 9, Overflow.Reject)
  }

  return isoDate
}

export function checkIsoDateInBounds(
  isoDate: CalendarDateFields,
): CalendarDateFields {
  // PlainDate bounds are date-level bounds, not midnight-instant bounds.
  // Noon is inside the valid PlainDateTime range for both edge dates:
  // -271821-04-19 and +275760-09-13.
  checkIsoDateTimeInBounds(combineDateAndTime(isoDate, isoNoonFieldDefaults))
  return isoDate
}

/*
Used on isoYear/Month/Date before doing zoned operations
See CheckISODaysRange in spec
TEMPORARY
*/
export function checkIsoDateInBoundsStrict(
  isoDate: CalendarDateFields,
): CalendarDateFields {
  const bigNano = isoDateTimeToEpochNano(
    combineDateAndTime(isoDate, timeFieldDefaults),
  )

  // TODO: better way to do this besides hardcoding limit
  if (
    bigNano === undefined ||
    Math.abs(Number(bigNano / bigNanoInUtcDay)) > epochNanoDayMax
  ) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return isoDate
}

export function checkIsoDateTimeInBounds(
  isoDateTime: CalendarDateTimeFields,
): void {
  const year = clampProp(
    isoDateTime,
    'year',
    isoYearMin,
    isoYearMax,
    Overflow.Reject,
  )
  // This mirrors the edge-year nudge in isoToLegacyDate, but here it is only
  // used to ask whether the final PlainDateTime still lands inside the Temporal
  // range after accounting for the extra day that PlainDateTime permits.
  const nudge = year === isoYearMin ? 1 : year === isoYearMax ? -1 : 0

  if (nudge) {
    // Needs to be within 23:59:59.999 of min/max epochNano.
    checkEpochNanoInBounds(
      isoDateTimeToEpochNano(
        combineDateAndTime(
          {
            year: isoDateTime.year,
            month: isoDateTime.month,
            day: isoDateTime.day + nudge,
          },
          { ...isoDateTime, nanosecond: isoDateTime.nanosecond - nudge },
        ),
      ),
    )
  }
}

export function checkEpochNanoInBounds(epochNano: bigint | undefined): bigint {
  if (
    epochNano === undefined ||
    epochNano < epochNanoMin ||
    epochNano > epochNanoMax
  ) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

/*
For converting to proper epochNano values
CALLERS DO NOT NEED TO CHECK in-bounds!
(Result should be considered a finalized "Instant")
*/
export function isoDateTimeToEpochNanoWithOffset(
  isoDateTime: CalendarDateTimeFields,
  offsetNano: number,
): bigint {
  const [newTimeFields, dayDelta] = nanoToTimeAndDay(
    timeFieldsToNano(isoDateTime) - offsetNano,
  )
  const epochNano = isoDateTimeToEpochNano(
    combineDateAndTime(
      {
        year: isoDateTime.year,
        month: isoDateTime.month,
        day: isoDateTime.day + dayDelta,
      },
      newTimeFields,
    ),
  )
  return checkEpochNanoInBounds(epochNano)
}
