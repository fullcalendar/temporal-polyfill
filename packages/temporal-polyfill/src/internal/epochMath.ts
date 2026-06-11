import { bigNanoInMilli, bigNanoInSec, bigNanoInUtcDay } from './bigNano'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import {
  milliToTimeFields,
  nanoToTimeFields,
  timeFieldsToMilli,
  timeFieldsToNano,
  timeFieldsToSec,
} from './timeFieldMath'
import { milliInUtcDay, secInHour, secInMinute, secInUtcDay } from './units'
import { divFloorBigInt, divModFloor, divTrunc, modFloor } from './utils'

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
  const epochSec = divFloorBigInt(epochNano, bigNanoInSec)
  return [Number(epochSec), Number(epochNano - epochSec * bigNanoInSec)]
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

export function isoDateArgsToEpochMilli(
  year: number,
  month?: number,
  day?: number,
) {
  return isoArgsToEpochDays(year, month, day) * milliInUtcDay
}

export function isoArgsToEpochSec(
  year: number,
  month?: number,
  day?: number,
  hour = 0,
  minute = 0,
  second = 0,
) {
  return (
    isoArgsToEpochDays(year, month, day) * secInUtcDay +
    hour * secInHour +
    minute * secInMinute +
    second
  )
}

export function isoDateTimeToEpochSec(
  isoDateTime: CalendarDateTimeFields,
): number {
  return isoDateToEpochSec(isoDateTime) + timeFieldsToSec(isoDateTime)
}

export function isoDateTimeToEpochNano(
  isoDateTime: CalendarDateTimeFields,
): bigint {
  return isoDateToEpochNano(isoDateTime) + BigInt(timeFieldsToNano(isoDateTime))
}

export function isoDateToEpochNano(isoDate: CalendarDateFields): bigint {
  return BigInt(isoDateToEpochDays(isoDate)) * bigNanoInUtcDay
}

export function isoDateToEpochMilli(isoDate: CalendarDateFields): number {
  return isoDateToEpochDays(isoDate) * milliInUtcDay
}

export function isoDateToEpochSec(isoDate: CalendarDateFields): number {
  return isoDateToEpochDays(isoDate) * secInUtcDay
}

export function isoDateTimeToEpochMilli(
  isoDateTime: CalendarDateTimeFields,
): number {
  return (
    isoDateToEpochDays(isoDateTime) * milliInUtcDay +
    timeFieldsToMilli(isoDateTime)
  )
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

// TODO: best place for this?
// TODO: make more composable? have caller worry about adding them?
export function epochNanoAndOffsetToIsoDateTime(
  epochNano: bigint,
  offsetNano: number,
): CalendarDateTimeFields {
  const zonedEpochNano = epochNano + BigInt(offsetNano)
  const bigEpochDays = divFloorBigInt(zonedEpochNano, bigNanoInUtcDay)
  const epochDays = Number(bigEpochDays)
  const nanoAfterDay = Number(zonedEpochNano - bigEpochDays * bigNanoInUtcDay)

  return {
    ...epochDaysToIsoDate(epochDays),
    ...nanoToTimeFields(nanoAfterDay),
  }
}

// Convenience
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
