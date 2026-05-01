import {
  BigNano,
  bigNanoToBigInt,
  divModBigNano,
  isBigNanoOutside,
  moveBigNano,
  numberToBigNano,
} from './bigNano'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import { CalendarDateFields, TimeFields } from './fieldTypes'
import { IsoDateTimeCarrier } from './isoFields'
import { Overflow } from './optionsModel'
import { givenFieldsToBigNano, nanoToGivenFields } from './unitMath'
import {
  Unit,
  milliInDay,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInUtcDay,
} from './units'
import { clampProp, divModFloor, divModTrunc } from './utils'

/*
NOTES on limits:

Date
  min = Date.UTC(-271821, 4 - 1, 20) // -8640000000000000
  max = Date.UTC(275760, 9 - 1, 13) // 8640000000000000
Instant
  min = Temporal.Instant.fromEpochMilliseconds(-8640000000000000)
  max = Temporal.Instant.fromEpochMilliseconds(8640000000000000)
ZonedDateTime
  min.toZonedDateTimeISO('<hypothetical-min-timezone>') // -271821-04-20 - 59:59.999999999
  max.toZonedDateTimeISO('<hypothetical-max-timezone>') // 275760-09-13 + 59:59.999999999
PlainDateTime
  min = new Temporal.PlainDateTime(-271821, 4, 19, 0, 0, 0, 0, 0, 1)
  max = new Temporal.PlainDateTime(275760, 9, 13, 23, 59, 59, 999, 999, 999)
PlainDate
  min = new Temporal.PlainDate(-271821, 4, 19)
  max = new Temporal.PlainDate(275760, 9, 13)
PlainYearMonth
  min = new Temporal.PlainYearMonth(-271821, 4)
  max = new Temporal.PlainYearMonth(275760, 9)
*/

/*
TODO: move all check* calls as late as possible, right before record-creation, even for moving!
*/

const maxDays = 100000000
export const maxMilli = maxDays * milliInDay
const epochNanoMax: BigNano = [maxDays, 0]
const epochNanoMin: BigNano = [-maxDays, 0]
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin
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
  checkIsoDateTimeInBounds(isoDate, isoNoonFieldDefaults)
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
  const bigNano = isoDateAndTimeToEpochNano(isoDate, timeFieldDefaults)

  // TODO: better way to do this besides hardcoding limit
  if (!bigNano || Math.abs(bigNano[0]) > 1e8) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return isoDate
}

export function checkIsoDateTimeInBounds(
  isoDate: CalendarDateFields,
  time: TimeFields,
): void {
  const year = clampProp(
    isoDate,
    'year',
    isoYearMin,
    isoYearMax,
    Overflow.Reject,
  )
  // this seems bad because this 'nudge' already happens in isoToLegacyDate
  const nudge = year === isoYearMin ? 1 : year === isoYearMax ? -1 : 0

  if (nudge) {
    // needs to be within 23:59:59.999 of min/max epochNano
    checkEpochNanoInBounds(
      isoDateAndTimeToEpochNano(
        { ...isoDate, day: isoDate.day + nudge },
        { ...time, nanosecond: time.nanosecond - nudge },
      ),
    )
  }
}

export function checkEpochNanoInBounds(
  epochNano: BigNano | undefined,
): BigNano {
  if (!epochNano || isBigNanoOutside(epochNano, epochNanoMin, epochNanoMax)) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function timeFieldsToNano(timeFields: TimeFields): number {
  return givenFieldsToBigNano(timeFields, Unit.Hour, timeFieldNamesAsc)[1]
}

export function nanoToTimeAndDay(nano: number): [TimeFields, number] {
  const [dayDelta, timeNano] = divModFloor(nano, nanoInUtcDay)
  const timeFields = nanoToGivenFields(
    timeNano,
    Unit.Hour,
    timeFieldNamesAsc,
  ) as TimeFields

  return [timeFields, dayDelta]
}

// Epoch Unit Conversion
// -----------------------------------------------------------------------------
// nano -> [micro/milli/sec]

export function epochNanoToSec(epochNano: BigNano): number {
  return epochNanoToSecMod(epochNano)[0]
}

export function epochNanoToSecMod(epochNano: BigNano): [number, number] {
  return divModBigNano(epochNano, nanoInSec)
}

export function epochNanoToMilli(epochNano: BigNano): number {
  return divModBigNano(epochNano, nanoInMilli)[0]
}

export function epochNanoToMicro(epochNano: BigNano): bigint {
  return bigNanoToBigInt(epochNano, nanoInMicro)
}

// [micro/milli/sec] -> nano

/*
Expects a proper integer
*/
export function epochMilliToNano(epochMilli: number): BigNano {
  return numberToBigNano(epochMilli, nanoInMilli)
}

// ISO <-> Epoch Conversion
// -----------------------------------------------------------------------------
// ISO Fields -> Epoch

export function isoDateAndTimeToEpochSec(
  isoDate: CalendarDateFields,
  time: TimeFields,
): [number, number] {
  // assume valid
  const epochSec = isoArgsToEpochSec(
    isoDate.year,
    isoDate.month,
    isoDate.day,
    time.hour,
    time.minute,
    time.second,
  )

  const subsecNano =
    time.millisecond * nanoInMilli +
    time.microsecond * nanoInMicro +
    time.nanosecond

  return [epochSec, subsecNano]
}

/*
If out-of-bounds, returns undefined
*/
export function isoDateToEpochMilli(
  isoDate: CalendarDateFields,
): number | undefined {
  return isoArgsToEpochMilli(isoDate.year, isoDate.month, isoDate.day)
}

export function isoDateAndTimeToEpochMilli(
  isoDate: CalendarDateFields,
  time: TimeFields,
): number | undefined {
  return isoArgsToEpochMilli(
    isoDate.year,
    isoDate.month,
    isoDate.day,
    time.hour,
    time.minute,
    time.second,
    time.millisecond,
  )
}

/*
For converting to fake epochNano values for math
If out-of-bounds, returns undefined
*/
export function isoToEpochNano(
  isoDate: CalendarDateFields,
): BigNano | undefined {
  const epochMilli = isoDateToEpochMilli(isoDate)

  if (epochMilli !== undefined) {
    const [days, milliRemainder] = divModTrunc(epochMilli, milliInDay)
    return [days, milliRemainder * nanoInMilli]
  }
}

export function isoDateAndTimeToEpochNano(
  isoDate: CalendarDateFields,
  time: TimeFields,
): BigNano | undefined {
  const epochMilli = isoDateAndTimeToEpochMilli(isoDate, time)

  if (epochMilli !== undefined) {
    const [days, milliRemainder] = divModTrunc(epochMilli, milliInDay)
    return [
      days,
      milliRemainder * nanoInMilli +
        time.microsecond * nanoInMicro +
        time.nanosecond,
    ]
  }
}

/*
For converting to proper epochNano values
CALLERS DO NOT NEED TO CHECK in-bounds!
(Result should be considered a finalized "Instant")
*/
export function isoDateAndTimeToEpochNanoWithOffset(
  isoDate: CalendarDateFields,
  time: TimeFields,
  offsetNano: number,
): BigNano {
  const [newTimeFields, dayDelta] = nanoToTimeAndDay(
    timeFieldsToNano(time) - offsetNano,
  )
  const epochNano = isoDateAndTimeToEpochNano(
    { ...isoDate, day: isoDate.day + dayDelta },
    newTimeFields,
  )
  return checkEpochNanoInBounds(epochNano)
}

// ISO Arguments -> Epoch

export type IsoTuple = [
  year: number,
  month?: number,
  day?: number,
  hour?: number,
  minute?: number,
  second?: number,
  isoMilli?: number,
]

/*
Assumes in-bounds
*/
export function isoArgsToEpochSec(...args: IsoTuple): number {
  return isoArgsToEpochMilli(...args)! / milliInSec
}

/*
If out-of-bounds, returns undefined
*/
export function isoArgsToEpochMilli(...args: IsoTuple): number | undefined {
  const [legacyDate, daysNudged] = isoToLegacyDate(...args)
  const epochMilli = legacyDate.valueOf()

  if (!isNaN(epochMilli)) {
    return epochMilli - daysNudged * milliInDay
  }
}

export function diffEpochMilliDays(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.trunc((epochMilli1 - epochMilli0) / milliInDay)
}

export function isoToLegacyDate(
  year: number,
  month = 1,
  day = 1,
  hour = 0,
  minute = 0,
  isoSec = 0,
  isoMilli = 0,
): [Date, number] {
  // allows this function to accept values beyond valid Instants
  // (PlainDateTime allows values within 24hrs)
  const daysNudged = year === isoYearMin ? 1 : year === isoYearMax ? -1 : 0

  // Note: Date.UTC() interprets one and two-digit years as being in the
  // 20th century, so don't use it
  const legacyDate = new Date() // should throw out-of-range error here?
  legacyDate.setUTCHours(hour, minute, isoSec, isoMilli)
  legacyDate.setUTCFullYear(year, month - 1, day + daysNudged)

  return [legacyDate, daysNudged]
}

// Epoch -> ISO Fields

export function epochNanoToIso(
  epochNano: BigNano,
  offsetNano: number,
): IsoDateTimeCarrier {
  let [days, timeNano] = moveBigNano(epochNano, offsetNano)

  // convert to start-of-day and time-of-day
  if (timeNano < 0) {
    timeNano += nanoInUtcDay
    days -= 1
  }

  const [timeMilli, nanoRemainder] = divModFloor(timeNano, nanoInMilli)
  const microParts = divModFloor(nanoRemainder, nanoInMicro)
  const microsecond = microParts[0]
  const nanosecond = microParts[1]
  const epochMilli = days * milliInDay + timeMilli

  return epochMilliToIso(epochMilli, microsecond, nanosecond)
}

/*
Accommodates epochMillis that are slightly out-of-range
*/
export function epochMilliToIso(
  epochMilli: number,
  microsecond = 0,
  nanosecond = 0,
): IsoDateTimeCarrier {
  const daysOver = // beyond min/max
    Math.ceil(Math.max(0, Math.abs(epochMilli) - maxMilli) / milliInDay) *
    Math.sign(epochMilli)

  // create a date that's forced within bounds
  const legacyDate = new Date(epochMilli - daysOver * milliInDay)

  return {
    isoDate: {
      year: legacyDate.getUTCFullYear(),
      month: legacyDate.getUTCMonth() + 1,
      day: legacyDate.getUTCDate() + daysOver, // push back out-of-bounds
    },
    time: {
      hour: legacyDate.getUTCHours(),
      minute: legacyDate.getUTCMinutes(),
      second: legacyDate.getUTCSeconds(),
      millisecond: legacyDate.getUTCMilliseconds(),
      microsecond,
      nanosecond,
    },
  }
}
