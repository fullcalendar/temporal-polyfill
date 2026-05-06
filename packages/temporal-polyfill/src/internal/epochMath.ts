import {
  BigNano,
  bigNanoToBigInt,
  divModBigNano,
  moveBigNano,
  numberToBigNano,
} from './bigNano'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { isoYearMax, isoYearMin, maxMilli } from './temporalConstants'
import {
  milliInDay,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
} from './units'
import { divModFloor, divModTrunc } from './utils'

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

export function isoDateTimeToEpochSec(
  isoDateTime: CalendarDateTimeFields,
): [number, number] {
  // Assume valid. This helper intentionally accepts a full date-time record so
  // callers do not need to thread separate date and time bags that must describe
  // the same wall-clock value.
  const epochSec = isoArgsToEpochSec(
    isoDateTime.year,
    isoDateTime.month,
    isoDateTime.day,
    isoDateTime.hour,
    isoDateTime.minute,
    isoDateTime.second,
  )

  const subsecNano =
    isoDateTime.millisecond * nanoInMilli +
    isoDateTime.microsecond * nanoInMicro +
    isoDateTime.nanosecond

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

export function isoDateTimeToEpochMilli(
  isoDateTime: CalendarDateTimeFields,
): number | undefined {
  return isoArgsToEpochMilli(
    isoDateTime.year,
    isoDateTime.month,
    isoDateTime.day,
    isoDateTime.hour,
    isoDateTime.minute,
    isoDateTime.second,
    isoDateTime.millisecond,
  )
}

/*
For converting to fake epochNano values for math
If out-of-bounds, returns undefined
*/
export function isoDateToEpochNano(
  isoDate: CalendarDateFields,
): BigNano | undefined {
  const epochMilli = isoDateToEpochMilli(isoDate)

  if (epochMilli !== undefined) {
    const [days, milliRemainder] = divModTrunc(epochMilli, milliInDay)
    return [days, milliRemainder * nanoInMilli]
  }
}

export function isoDateTimeToEpochNano(
  isoDateTime: CalendarDateTimeFields,
): BigNano | undefined {
  const epochMilli = isoDateTimeToEpochMilli(isoDateTime)

  if (epochMilli !== undefined) {
    const [days, milliRemainder] = divModTrunc(epochMilli, milliInDay)
    return [
      days,
      milliRemainder * nanoInMilli +
        isoDateTime.microsecond * nanoInMicro +
        isoDateTime.nanosecond,
    ]
  }
}

// ISO Arguments -> Epoch

export type IsoTuple = [
  isoYear: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
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

// This lives with epoch conversion rather than ISO calendar math because its
// purpose is bridging ISO fields through JavaScript's legacy Date object. The
// edge-year nudge below is part of that bridge, not a pure calendar rule.
export function isoToLegacyDate(
  isoYear: number,
  isoMonth = 1,
  isoDay = 1,
  isoHour = 0,
  isoMinute = 0,
  isoSec = 0,
  isoMilli = 0,
): [Date, number] {
  // Allows this function to accept values beyond valid Instants. PlainDateTime
  // permits values within 24 hours of the Instant bounds.
  const daysNudged =
    isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  // Date.UTC() interprets one and two-digit years as being in the 20th century,
  // so create a Date first and then set the full UTC year explicitly.
  const legacyDate = new Date()
  legacyDate.setUTCHours(isoHour, isoMinute, isoSec, isoMilli)
  legacyDate.setUTCFullYear(isoYear, isoMonth - 1, isoDay + daysNudged)

  return [legacyDate, daysNudged]
}

// Epoch -> ISO Fields

export function epochNanoToIso(
  epochNano: BigNano,
  offsetNano: number,
): CalendarDateTimeFields {
  let [days, timeNano] = moveBigNano(epochNano, offsetNano)

  // Convert to start-of-day and time-of-day. `moveBigNano` can leave the
  // nanosecond remainder negative when a negative offset crosses midnight.
  if (timeNano < 0) {
    timeNano += milliInDay * nanoInMilli
    days -= 1
  }

  const [timeMilli, nanoRemainder] = divModFloor(timeNano, nanoInMilli)
  const microParts = divModFloor(nanoRemainder, nanoInMicro)
  const microsecond = microParts[0]
  const nanosecond = microParts[1]
  const epochMilli = days * milliInDay + timeMilli

  return epochMilliToIsoDateTime(epochMilli, microsecond, nanosecond)
}

/*
Accommodates epochMillis that are slightly out-of-range
*/
export function epochMilliToIsoDateTime(
  epochMilli: number,
  microsecond = 0,
  nanosecond = 0,
): CalendarDateTimeFields {
  const daysOver = // beyond min/max
    Math.ceil(Math.max(0, Math.abs(epochMilli) - maxMilli) / milliInDay) *
    Math.sign(epochMilli)

  // Create a Date that's forced within bounds, then push the ISO day back out
  // by `daysOver` so callers can represent Temporal's wider PlainDateTime edge.
  const legacyDate = new Date(epochMilli - daysOver * milliInDay)

  return {
    year: legacyDate.getUTCFullYear(),
    month: legacyDate.getUTCMonth() + 1,
    day: legacyDate.getUTCDate() + daysOver,
    hour: legacyDate.getUTCHours(),
    minute: legacyDate.getUTCMinutes(),
    second: legacyDate.getUTCSeconds(),
    millisecond: legacyDate.getUTCMilliseconds(),
    microsecond,
    nanosecond,
  }
}
