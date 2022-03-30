import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { PlainDateTime } from '../public/plainDateTime'
import { DateTimeISOFields, TimeLike } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { numSign, positiveModulo } from '../utils/math'
import { DayTimeFields, nanoToDayTimeFields, splitEpochNano } from './dayTime'
import {
  DateTimeISOEssentials,
  DateTimeISOMilli,
  TimeFields,
  TimeISOEssentials,
} from './types-private'
import {
  HOUR,
  milliInDay,
  milliInSecond,
  nanoInDayBI,
  nanoInHourBI,
  nanoInMicro,
  nanoInMicroBI,
  nanoInMilli,
  nanoInMilliBI,
  nanoInMinuteBI,
  nanoInSecondBI,
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

    const milliTry = Date.UTC(
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

// Misc conversions

export function isoYearToEpochSeconds(isoYear: number): number {
  return Math.floor(isoToEpochMilli(isoYear) / milliInSecond)
}

export function epochNanoToISOYear(epochNano: bigint): number {
  return nudgeToLegacyDate(Number(epochNano / nanoInMilliBI))[0].getUTCFullYear()
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

function nudgeToLegacyDate(epochMilli: number): [Date, number] {
  const sign = numSign(epochMilli)
  let dayShiftAbs = 0
  let date: Date | undefined

  // undo the dayShift done in isoToEpochMilli
  // won't need to move more than a month (max month days is 31, so 30)
  for (; dayShiftAbs < 31; dayShiftAbs++) {
    const dateTry = new Date(epochMilli - (sign * dayShiftAbs * milliInDay))

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

export function throwOutOfRange(): void {
  throw new RangeError('Date outside of supported range')
}

// time stuff

export const zeroTimeISOFields: TimeISOEssentials = {
  isoHour: 0,
  isoMinute: 0,
  isoSecond: 0,
  isoMillisecond: 0,
  isoMicrosecond: 0,
  isoNanosecond: 0,
}

export function timeFieldsToNano(timeFields: TimeFields): bigint {
  return BigInt(timeFields.hour) * nanoInHourBI +
    BigInt(timeFields.minute) * nanoInMinuteBI +
    BigInt(timeFields.second) * nanoInSecondBI +
    BigInt(timeFields.millisecond) * nanoInMilliBI +
    BigInt(timeFields.microsecond) * nanoInMicroBI +
    BigInt(timeFields.nanosecond)
}

export function timeISOToNano(timeISO: TimeISOEssentials): bigint {
  return BigInt(timeISO.isoHour) * nanoInHourBI +
    BigInt(timeISO.isoMinute) * nanoInMinuteBI +
    BigInt(timeISO.isoSecond) * nanoInSecondBI +
    BigInt(timeISO.isoMillisecond) * nanoInMilliBI +
    BigInt(timeISO.isoMicrosecond) * nanoInMicroBI +
    BigInt(timeISO.isoNanosecond)
}

export function timeLikeToISO(fields: TimeLike): TimeISOEssentials {
  return {
    isoNanosecond: fields.nanosecond ?? 0,
    isoMicrosecond: fields.microsecond ?? 0,
    isoMillisecond: fields.millisecond ?? 0,
    isoSecond: fields.second ?? 0,
    isoMinute: fields.minute ?? 0,
    isoHour: fields.hour ?? 0,
  }
}

// TODO: move to dayTime.ts?
// if nano is positive, will wrap once reaching 24h, giving a positive day value
// if nano is negative, will go into previous days, giving a negative day value
export function wrapTimeOfDayNano(nano: bigint): DayTimeFields {
  const [dayNano, timeNano] = splitEpochNano(nano)
  return {
    ...(nanoToDayTimeFields(timeNano, HOUR) as TimeFields),
    day: Number(dayNano / nanoInDayBI), // always an int: dayNano is evenly divisible by nanoInDayBI
  }
}

export function toNano(dt: PlainDateTime | ZonedDateTime): bigint {
  if (dt instanceof PlainDateTime) {
    return isoFieldsToEpochNano(dt.getISOFields()) // TODO: util for this?
  }
  return dt.epochNanoseconds
}
