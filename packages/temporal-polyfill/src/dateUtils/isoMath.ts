import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
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
  const isoYearReal = isoYear ?? isoEpochOriginYear
  const isoMonthReal = isoMonth ?? 1
  const isoDayReal = isoDay ?? 1
  const sign = numSign(isoYearReal)
  let dayShift = 0
  let isoDayTry: number
  let milli: number | undefined

  // https://stackoverflow.com/a/5870822/96342
  const twoDigitYearBug = isoYearReal >= 0 && isoYearReal < 1000
  const isoYearTemp = twoDigitYearBug ? isoYearReal + 1200 : isoYearReal

  // Temporal must represent year-month-days and year-months that don't have their start-of-unit
  // in bounds. Keep moving the date towards the origin one day at a time until in-bounds.
  // We won't need to shift more than a month.
  for (; dayShift < 31; dayShift++) {
    isoDayTry = isoDayReal - (sign * dayShift)

    let milliTry = Date.UTC(
      isoYearTemp,
      isoMonthReal - 1,
      isoDayTry,
      isoHour ?? 0,
      isoMinute ?? 0,
      isoSecond ?? 0,
      isoMillisecond ?? 0,
    )
    // is valid? (TODO: rename isInvalid -> isValid)
    if (!isInvalid(milliTry)) {
      milli = milliTry + (sign * dayShift * milliInDay)
      break
    }
  }

  if (
    milli === undefined ||
    // ensure day didn't underflow/overflow to get to an in-bounds date
    isoDayTry! < 1 ||
    isoDayTry! > isoCalendarImpl.daysInMonth(isoYearReal, isoMonthReal)
  ) {
    throwOutOfRange()
  }

  if (twoDigitYearBug) {
    milli = new Date(milli!).setUTCFullYear(isoYearReal)
  }

  return milli!
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
  const [legacy, dayShift] = nudgeToLegacyDate(epochMilli)
  return {
    isoYear: legacy.getUTCFullYear(),
    isoMonth: legacy.getUTCMonth() + 1,
    isoDay: legacy.getUTCDate() - dayShift, // safe b/c isoToEpochMilli doesn't shift out of month
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
  const [legacy, dayShift] = nudgeToLegacyDate(isoToEpochMilli(isoYear, isoMonth, isoDay))
  return positiveModulo(
    legacy.getUTCDay() - dayShift,
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
  const sign = numSign(epochMilli)
  let dayShift = 0
  let date: Date | undefined

  // undo the dayShift done in isoToEpochMilli
  // won't need to move more than a month
  for (; dayShift < 31; dayShift++) {
    let dateTry = new Date(epochMilli - (sign * dayShift * milliInDay))

    if (!isInvalid(dateTry)) {
      date = dateTry
      break
    }
  }

  if (date === undefined) {
    throwOutOfRange()
  }

  return [date!, dayShift]
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
