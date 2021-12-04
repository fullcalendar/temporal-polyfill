import { DateTimeISOEssentials, DateTimeISOMilli } from '../dateUtils/dateTime'
import { DateTimeISOFields } from '../public/types'
import { numSign } from '../utils/math'
import {
  milliInDay,
  milliInMin,
  nanoInMicro,
  nanoInMicroBI,
  nanoInMilli,
  nanoInMilliBI,
} from './units'

export const isoEpochOriginYear = 1970
export const isoEpochLeapYear = 1972 // first ISO leap year after origin

/*
GENERAL ROUNDING TIPS:
- use trunc on timeZoneOffsets and durations (directionally outward from 0 origin)
  - for this, trunc and % go well together
- use floor on epoch-times, time-of-days, week numbers (directionally forward only)
  - for this, floor and %+% go well together. use a util for this?
*/

// ISO Field <-> Epoch Math

export function isoFieldsToEpochNano(
  isoFields: Partial<DateTimeISOFields>,
): bigint {
  return isoToEpochNano(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
  )
}

export function isoFieldsToEpochMins(isoFields: Partial<DateTimeISOFields>): number {
  return Math.floor(isoFieldsToEpochMilli(isoFields) / milliInMin)
}

export function isoFieldsToEpochMilli(
  isoFields: Partial<DateTimeISOMilli>,
): number {
  return isoToEpochMilli(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
  )
}

export function isoToEpochNano(
  isoYear?: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
  isoMicrosecond?: number,
  isoNanosecond?: number,
): bigint {
  return BigInt(
    isoToEpochMilli(
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    ),
  ) * nanoInMilliBI +
  BigInt(isoMicrosecond ?? 0) * nanoInMicroBI +
  BigInt(isoNanosecond ?? 0)
}

export function isoToEpochMilli(
  isoYear?: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
): number {
  const year = isoYear ?? isoEpochOriginYear
  const month = (isoMonth ?? 1) - 1
  const day = isoDay ?? 1
  const smallUnits = [
    isoHour ?? 0,
    isoMinute ?? 0,
    isoSecond ?? 0,
    isoMillisecond ?? 0,
  ]
  let milli = Date.UTC(
    year,
    month,
    day,
    ...smallUnits,
  )
  if (isNaN(milli)) {
    const sign = numSign(year)
    const milliShifted = Date.UTC(
      year,
      month,
      day + sign * -1,
      ...smallUnits,
    )
    if (isNaN(milliShifted)) {
      // Reject any DateTime 24 hours or more outside the Instant range
      throw new RangeError('DateTime outside of supported range')
    }
    milli = milliShifted + sign * milliInDay
  }
  return milli
}

export function epochNanoToISOFields(epochNano: bigint): DateTimeISOEssentials {
  const epochMilli = Math.floor(Number(epochNano) / nanoInMilli)
  let isoNanosecond = Number(epochNano - (BigInt(epochMilli) * nanoInMilliBI))
  const isoMicrosecond = Math.floor(isoNanosecond / nanoInMicro)
  isoNanosecond -= isoMicrosecond * nanoInMicro
  return {
    ...epochMilliToISOFields(epochMilli),
    isoMicrosecond,
    isoNanosecond,
  }
}

export function epochMilliToISOFields(epochMilli: number): DateTimeISOMilli {
  const legacy = new Date(epochMilli)
  return {
    isoYear: legacy.getUTCFullYear(),
    isoMonth: legacy.getUTCMonth() + 1,
    isoDay: legacy.getUTCDate(),
    isoHour: legacy.getUTCHours(),
    isoMinute: legacy.getUTCMinutes(),
    isoSecond: legacy.getUTCSeconds(),
    isoMillisecond: legacy.getUTCMilliseconds(),
  }
}

// Year <-> Epoch Minutes

export function epochMinsToISOYear(mins: number): number {
  return new Date(mins * milliInMin).getUTCFullYear()
}

export function isoYearToEpochMins(isoYear: number): number {
  return Math.floor(isoToEpochMilli(isoYear) / milliInMin)
}

// Epoch-Millisecond Math

export function diffDaysMilli(milli0: number, milli1: number): number {
  return Math.round((milli1 - milli0) / milliInDay)
}

export function addDaysMilli(milli: number, days: number): number {
  return milli + days * milliInDay
}

// Day-of-Week

export function computeISODayOfWeek(isoYear: number, isoMonth: number, isoDay: number): number {
  // 1=Monday ... 7=Sunday
  return new Date(isoToEpochMilli(isoYear, isoMonth, isoDay)).getUTCDay() || 7
}
