import { bigNanoInMilli, bigNanoInSec, bigNanoInUtcDay } from './bigNano'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { milliInDay, milliInSec, nanoInMicro, nanoInMilli } from './units'
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

export function isoDateToEpochDays(isoDate: CalendarDateFields): number {
  return isoArgsToEpochDays(isoDate.year, isoDate.month, isoDate.day)
}

export function isoDateToEpochMilli(isoDate: CalendarDateFields): number {
  return isoArgsToEpochMilli(isoDate.year, isoDate.month, isoDate.day)
}

export function isoDateTimeToEpochMilli(
  isoDateTime: CalendarDateTimeFields,
): number {
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
For converting to fake epochNano values for math.
*/
export function isoDateToEpochNano(isoDate: CalendarDateFields): bigint {
  return BigInt(isoDateToEpochDays(isoDate)) * bigNanoInUtcDay
}

export function isoDateTimeToEpochNano(
  isoDateTime: CalendarDateTimeFields,
): bigint {
  return (
    BigInt(isoDateTimeToEpochMilli(isoDateTime)) * bigNanoInMilli +
    BigInt(isoDateTime.microsecond * nanoInMicro + isoDateTime.nanosecond)
  )
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

export function isoArgsToEpochSec(...args: IsoTuple): number {
  return isoArgsToEpochMilli(...args) / milliInSec
}

export function isoArgsToEpochMilli(...args: IsoTuple): number {
  const [
    isoYear,
    isoMonth = 1,
    isoDay = 1,
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMilli = 0,
  ] = args
  return (
    isoArgsToEpochDays(isoYear, isoMonth, isoDay) * milliInDay +
    ((isoHour * 60 + isoMinute) * 60 + isoSecond) * milliInSec +
    isoMilli
  )
}

export function diffEpochMilliDays(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.trunc((epochMilli1 - epochMilli0) / milliInDay)
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
      milliInDay +
    (divTrunc(isoYear, yearsIn400YearCycle) + 1) * daysIn400YearCycle +
    isoDay
  )
}

// Epoch -> ISO Fields

export function epochNanoToIso(
  epochNano: bigint,
  offsetNano: number,
): CalendarDateTimeFields {
  const zonedEpochNano = epochNano + BigInt(offsetNano)
  const wholeDays = divFloorBigInt(zonedEpochNano, bigNanoInUtcDay)
  const days = Number(wholeDays)
  const timeNano = Number(zonedEpochNano - wholeDays * bigNanoInUtcDay)

  const [timeMilli, nanoRemainder] = divModFloor(timeNano, nanoInMilli)
  const microParts = divModFloor(nanoRemainder, nanoInMicro)
  const microsecond = microParts[0]
  const nanosecond = microParts[1]
  const epochMilli = days * milliInDay + timeMilli

  return epochMilliToIsoDateTime(epochMilli, microsecond, nanosecond)
}

export function epochMilliToIsoDateTime(
  epochMilli: number,
  microsecond = 0,
  nanosecond = 0,
): CalendarDateTimeFields {
  const [epochDays, dayMilli] = divModFloor(epochMilli, milliInDay)
  const isoDate = epochDaysToIsoDate(epochDays)
  const [hour, hourMilli] = divModFloor(dayMilli, 60 * 60 * milliInSec)
  const [minute, minuteMilli] = divModFloor(hourMilli, 60 * milliInSec)
  const [second, millisecond] = divModFloor(minuteMilli, milliInSec)

  return {
    ...isoDate,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  }
}

export function epochDaysToIsoDate(epochDays: number): CalendarDateFields {
  const legacyDate = new Date(
    modFloor(epochDays, daysIn400YearCycle) * milliInDay,
  )

  return {
    year:
      legacyDate.getUTCFullYear() +
      Math.floor(epochDays / daysIn400YearCycle) * yearsIn400YearCycle,
    month: legacyDate.getUTCMonth() + 1,
    day: legacyDate.getUTCDate(),
  }
}
