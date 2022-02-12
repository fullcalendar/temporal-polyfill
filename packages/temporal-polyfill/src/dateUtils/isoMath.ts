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

export function isoFieldsToEpochNano(isoFields: Partial<DateTimeISOEssentials>): bigint {
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

export function isoFieldsToEpochMilli(isoFields: Partial<DateTimeISOMilli>): number {
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
  let dayShiftAbs = 0
  let isoDayTry: number
  let milli: number | undefined

  // https://stackoverflow.com/a/5870822/96342
  const twoDigitYearBug = isoYearReal >= 0 && isoYearReal < 1000
  const isoYearTemp = twoDigitYearBug ? isoYearReal + 1200 : isoYearReal

  // Temporal must represent year-month-days and year-months that don't have their start-of-unit
  // in bounds. Keep moving the date towards the origin one day at a time until in-bounds.
  // We won't need to shift more than a month.
  for (; dayShiftAbs < 31; dayShiftAbs++) {
    isoDayTry = isoDayReal - (sign * dayShiftAbs)

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
      milli = milliTry + (sign * dayShiftAbs * milliInDay)
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
  const [legacy, dayUnshift] = nudgeToLegacyDate(epochMilli)
  return {
    isoYear: legacy.getUTCFullYear(),
    isoMonth: legacy.getUTCMonth() + 1,
    isoDay: legacy.getUTCDate() + dayUnshift, // safe b/c isoToEpochMilli doesn't shift out of month
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
  const [legacy, dayUnshift] = nudgeToLegacyDate(isoToEpochMilli(isoYear, isoMonth, isoDay))
  return positiveModulo(
    legacy.getUTCDay() + dayUnshift,
    7,
  ) || 7 // convert Sun...Mon to Mon...Sun
}

// Validation
/*
Extreme valid inputs
  Legacy Date
    Date.UTC(-271821, 4 - 1, 20,  0, 0, 0, 0)
    Date.UTC(275760, 9 - 1, 13,  0, 0, 0, 0)
  Instant
    Temporal.Instant.fromEpochMilliseconds(Date.UTC(-271821, 4 - 1, 20,  0, 0, 0, 0))
    Temporal.Instant.fromEpochMilliseconds(Date.UTC(275760, 9 - 1, 13,  0, 0, 0, 0))
  PlainDateTime
    new Temporal.PlainDateTime(-271821, 4, 19,  0, 0, 0, 0, 0, 1).toString()
    new Temporal.PlainDateTime(275760, 9, 13,  23, 59, 59, 999, 999, 999).toString()
  PlainDate
    new Temporal.PlainDate(-271821, 4, 19).toString()
    new Temporal.PlainDate(275760, 9, 13).toString()
  PlainYearMonth
    new Temporal.PlainYearMonth(-271821, 4).toString()
    new Temporal.PlainYearMonth(275760, 9).toString()
*/

export function validateYearMonth(isoFields: DateISOEssentials): void {
  // might throw an error
  // moves between days in month
  isoFieldsToEpochNano(isoFields)
}

export function validateDate(isoFields: DateISOEssentials): void {
  const nano = isoFieldsToEpochNano(isoFields)
  validatePlain(
    // if potentially very negative, measure last nanosecond of day
    // to increase changes it's in-bounds
    nano + (nano < 0n ? 86399999999999n : 0n)
  )
}

export function validateDateTime(isoFields: DateTimeISOEssentials): void {
  validatePlain(isoFieldsToEpochNano(isoFields))
}

export function validateInstant(epochNano: bigint): void {
  if (
    epochNano < -8640000000000000000000n ||
    epochNano > 8640000000000000000000n
  ) {
    throwOutOfRange()
  }
}

export function validatePlain(epochNano: bigint): void {
  // like validateInstant's bounds, but expanded 24:59:59.999999999
  if (
    epochNano < -8640000086399999999999n ||
    epochNano > 8640000086399999999999n
  ) {
    throwOutOfRange()
  }
}

function nudgeToLegacyDate(epochMilli: number): [Date, number] {
  const sign = numSign(epochMilli)
  let dayShiftAbs = 0
  let date: Date | undefined

  // undo the dayShift done in isoToEpochMilli
  // won't need to move more than a month (max month days is 31, so 30)
  for (; dayShiftAbs < 31; dayShiftAbs++) {
    let dateTry = new Date(epochMilli - (sign * dayShiftAbs * milliInDay))

    if (!isInvalid(dateTry)) {
      date = dateTry
      break
    }
  }

  if (date === undefined) {
    throwOutOfRange()
  }

  return [date!, sign * dayShiftAbs]
}

function isInvalid(n: { valueOf(): number }): boolean {
  return isNaN(n.valueOf())
}

function throwOutOfRange() {
  throw new RangeError('Date outside of supported range')
}
