import { bigNanoInMilli, bigNanoInSec, bigNanoInUtcDay } from './bigNano'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import {
  milliToTimeFields,
  nanoToTimeFields,
  timeFieldsToMilli,
  timeFieldsToNano,
} from './timeFieldMath'
import { milliInUtcDay } from './units'
import {
  divFloorBigInt,
  divModFloor,
  divModFloorBigInt,
  divTrunc,
  modFloor,
} from './utils'

const daysIn400YearCycle = 146097
const yearsIn400YearCycle = 400
const monthsInYear = 12

// Epoch Unit Conversion
// -----------------------------------------------------------------------------
// nano -> [micro/milli/sec]

export function epochNanoToSec(epochNano: bigint): number {
  return epochNanoToSecMod(epochNano)[0]
}

export function epochNanoToSecMod(epochNano: bigint): [number, number] {
  const [epochSec, nano] = divModFloorBigInt(epochNano, bigNanoInSec)
  return [Number(epochSec), Number(nano)]
}

export function epochNanoToMilli(epochNano: bigint): number {
  return Number(divFloorBigInt(epochNano, bigNanoInMilli))
}

// [micro/milli/sec] -> nano

/*
Expects a proper integer
*/
export function epochMilliToNano(epochMilli: number): bigint {
  return BigInt(epochMilli) * bigNanoInMilli
}

// ISO Fields -> Epoch :: CONVENIENCE
// -----------------------------------------------------------------------------

// DATE-TIME

export function isoDateTimeToEpochNano(
  isoDateTime: CalendarDateTimeFields,
): bigint {
  return isoDateToEpochNano(isoDateTime) + BigInt(timeFieldsToNano(isoDateTime))
}

export function isoDateTimeToEpochMilli(
  isoDateTime: CalendarDateTimeFields,
): number {
  return (
    isoDateToEpochDays(isoDateTime) * milliInUtcDay +
    timeFieldsToMilli(isoDateTime)
  )
}

// DATE-ONLY

export function isoDateToEpochNano(isoDate: CalendarDateFields): bigint {
  return BigInt(isoDateToEpochDays(isoDate)) * bigNanoInUtcDay
}

export function isoDateToEpochMilli(isoDate: CalendarDateFields): number {
  return isoDateToEpochDays(isoDate) * milliInUtcDay
}

// ISO Fields -> Epoch :: PRIMITIVES
// -----------------------------------------------------------------------------

export function isoDateToEpochDays(isoDate: CalendarDateFields): number {
  return isoArgsToEpochDays(isoDate.year, isoDate.month, isoDate.day)
}

// Month and day intentionally balance like Date.UTC(), but the year is projected
// into a safe 400-year Gregorian cycle first. This keeps ISO date math valid for
// Temporal's full plain-object range without relying on Date TimeClip.
export function isoArgsToEpochDays(
  isoYear: number,
  isoMonth = 1,
  isoDay = 1,
): number {
  const monthIndex = isoMonth - 1
  isoYear += Math.floor(monthIndex / monthsInYear)
  isoMonth = modFloor(monthIndex, monthsInYear)

  return (
    Date.UTC(
      (isoYear % yearsIn400YearCycle) - yearsIn400YearCycle,
      isoMonth,
      0,
    ) /
      milliInUtcDay +
    (divTrunc(isoYear, yearsIn400YearCycle) + 1) * daysIn400YearCycle +
    isoDay
  )
}

// Epoch -> ISO Fields
// -----------------------------------------------------------------------------

export function epochNanoToIsoDateTime(
  epochNano: bigint,
): CalendarDateTimeFields {
  const [epochDays, nanoAfterDay] = divModFloorBigInt(
    epochNano,
    bigNanoInUtcDay,
  )
  return {
    ...epochDaysToIsoDate(Number(epochDays)),
    ...nanoToTimeFields(Number(nanoAfterDay)),
  }
}

export function epochMilliToIsoDateTime(
  epochMilli: number,
  microsecond = 0,
  nanosecond = 0,
): CalendarDateTimeFields {
  const [epochDays, milliAfterDay] = divModFloor(epochMilli, milliInUtcDay)
  return {
    ...epochDaysToIsoDate(epochDays),
    ...milliToTimeFields(milliAfterDay, microsecond, nanosecond),
  }
}

export function epochDaysToIsoDate(epochDays: number): CalendarDateFields {
  const legacyDate = new Date(
    modFloor(epochDays, daysIn400YearCycle) * milliInUtcDay,
  )

  return {
    year:
      legacyDate.getUTCFullYear() +
      Math.floor(epochDays / daysIn400YearCycle) * yearsIn400YearCycle,
    month: legacyDate.getUTCMonth() + 1,
    day: legacyDate.getUTCDate(),
  }
}

// Diffing
// -----------------------------------------------------------------------------

export function diffEpochMilliDays(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.trunc((epochMilli1 - epochMilli0) / milliInUtcDay)
}
