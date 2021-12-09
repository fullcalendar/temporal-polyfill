import { DateTimeISOEssentials, DateTimeISOMilli } from '../dateUtils/dateTime'
import { DateTimeISOFields } from '../public/types'
import { numSign, positiveModulo } from '../utils/math'
import { DateISOEssentials } from './date'
import {
  milliInDay,
  milliInSecond,
  nanoInDayBI,
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
  - for this, floor and positiveModulo go well together
*/

// ISO Field <-> Epoch Math

export function isoFieldsToEpochNano(
  isoFields: Partial<DateTimeISOEssentials>,
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

export function isoFieldsToEpochSecs(isoFields: Partial<DateTimeISOFields>): number {
  return Math.floor(isoFieldsToEpochMilli(isoFields) / milliInSecond)
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
  const sign = numSign(year)
  const milli = Date.UTC(
    year,
    (isoMonth ?? 1) - 1,
    (isoDay ?? 1) - sign, // ensures within 1 day of Date.UTC's min/max
    isoHour ?? 0,
    isoMinute ?? 0,
    isoSecond ?? 0,
    isoMillisecond ?? 0,
  ) + (sign * milliInDay) // push back out of Date.UTC's min/max

  validateValue(milli)
  return milli
}

/*
TODO: audit Math.floors that happen on rounding of bigints
TODO: audit Number() on bigints
*/
export function epochNanoToISOFields(epochNano: bigint): DateTimeISOEssentials {
  let epochMilli = epochNano / nanoInMilliBI
  let leftoverNano = Number(epochNano - (epochMilli * nanoInMilliBI))

  // HACK for flooring bigints
  if (leftoverNano < 0) {
    leftoverNano += nanoInMilli
    epochMilli -= 1n
  }

  const isoMicrosecond = Math.floor(leftoverNano / nanoInMicro)
  leftoverNano -= isoMicrosecond * nanoInMicro

  return {
    ...epochMilliToISOFields(Number(epochMilli)),
    isoMicrosecond,
    isoNanosecond: leftoverNano,
  }
}

export function epochMilliToISOFields(epochMilli: number): DateTimeISOMilli {
  const [legacy, shiftDays] = nudgeToLegacyDate(epochMilli)
  return {
    isoYear: legacy.getUTCFullYear(),
    isoMonth: legacy.getUTCMonth() + 1,
    isoDay: legacy.getUTCDate() + shiftDays, // pray there's no overflow to higher/lower units
    isoHour: legacy.getUTCHours(),
    isoMinute: legacy.getUTCMinutes(),
    isoSecond: legacy.getUTCSeconds(),
    isoMillisecond: legacy.getUTCMilliseconds(),
  }
}

// Year <-> Epoch Minutes

export function epochSecondsToISOYear(epochSeconds: number): number {
  return nudgeToLegacyDate(epochSeconds * milliInSecond)[0].getUTCFullYear()
}

export function isoYearToEpochSeconds(isoYear: number): number {
  return Math.floor(isoToEpochMilli(isoYear) / milliInSecond)
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
  const [legacy, shiftDays] = nudgeToLegacyDate(isoToEpochMilli(isoYear, isoMonth, isoDay))
  return positiveModulo(
    legacy.getUTCDay() + shiftDays,
    7,
  ) || 7 // convert Sun...Mon to Mon...Sun
}

// Validation

export function validateYearMonth(isoFields: DateISOEssentials): void {
  validateDateTime(
    isoFields.isoYear < 0
      // last nanosecond in month
      ? { ...isoFields, isoMonth: isoFields.isoMonth + 1, isoNanosecond: -1 }
      : isoFields,
  )
}

export function validateDate(isoFields: DateISOEssentials): void {
  validateDateTime(
    isoFields.isoYear < 0
      // last nanosecond in day
      ? { ...isoFields, isoDay: isoFields.isoDay + 1, isoNanosecond: -1 }
      : isoFields,
  )
}

export function validateDateTime(
  isoFields: Partial<DateTimeISOEssentials> & { isoYear: number },
): void {
  validateInstant(
    // within 23:59:59.999999999 of valid instant range?
    isoFieldsToEpochNano(isoFields) - (nanoInDayBI - 1n) * BigInt(numSign(isoFields.isoYear)),
  )
}

export function validateInstant(epochNano: bigint): void {
  const epochMilli = Number(epochNano / nanoInMilliBI)
  const leftoverNano = Number(epochNano - BigInt(epochMilli) * nanoInMilliBI)
  const fakeEpochMilli = epochMilli + numSign(leftoverNano)
  validateValue(new Date(fakeEpochMilli))
}

function nudgeToLegacyDate(epochMilli: number): [Date, number] {
  let legacy = new Date(epochMilli)
  let shiftDays = 0 // additional days that must be added to `legacy` to get legit result

  // if out of range, try shifting one day in
  if (isInvalid(legacy)) {
    shiftDays = numSign(epochMilli)
    legacy = new Date(epochMilli + milliInDay * shiftDays * -1)
    validateValue(legacy)
  }

  return [legacy, shiftDays]
}

function validateValue(n: { valueOf(): number }) {
  if (isInvalid(n)) {
    throwOutOfRange()
  }
}

function isInvalid(n: { valueOf(): number }): boolean {
  return isNaN(n.valueOf())
}

function throwOutOfRange() {
  throw new RangeError('Date outside of supported range')
}
