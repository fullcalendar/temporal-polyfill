import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { LargeInt, createLargeInt } from '../utils/largeInt'
import { numSign, positiveModulo } from '../utils/math'
import { isoTimeToNano } from './dayAndTime'
import {
  ISODateFields,
  ISODateTimeFields,
  ISODateTimeFieldsMilli,
  ISOTimeFields,
} from './isoFields'
import {
  milliInDay,
  milliInSecond, nanoInMicro,
  nanoInMilli,
} from './units'

export const isoEpochOriginYear = 1970
export const isoEpochLeapYear = 1972 // first ISO leap year after origin

export type EpochableFields = ISODateFields & Partial<ISOTimeFields>

export const epochNanoSymbol = Symbol()

export interface EpochableObj {
  [epochNanoSymbol]?: LargeInt
  getISOFields(): EpochableFields
}

/*
GENERAL ROUNDING TIPS:
- use trunc on timeZoneOffsets and durations (directionally outward from 0 origin)
  - for this, trunc and % go well together
- use floor on epoch-times, time-of-days, week numbers (directionally forward only)
  - for this, floor and positiveModulo go well together
*/
// ISO Field <-> Epoch Math

export function isoFieldsToEpochNano(isoFields: EpochableFields): LargeInt {
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

export function isoFieldsToEpochMilli(isoFields: EpochableFields): number {
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
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
  isoMicrosecond?: number,
  isoNanosecond?: number,
): LargeInt {
  return createLargeInt(
    isoToEpochMilli(
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    ),
  ).mult(nanoInMilli).add(
    (isoMicrosecond ?? 0) * nanoInMicro +
      (isoNanosecond ?? 0),
  )
}

export function isoToEpochMilli(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
): number {
  const sign = numSign(isoYear)
  let dayShiftAbs = 0
  let isoDayTry: number
  let milli: number | undefined

  // https://stackoverflow.com/a/5870822/96342
  const twoDigitYearBug = isoYear >= 0 && isoYear < 1000
  const isoYearTemp = twoDigitYearBug ? isoYear + 1200 : isoYear

  // Temporal must represent year-month-days and year-months that don't have their start-of-unit
  // in bounds. Keep moving the date towards the origin one day at a time until in-bounds.
  // We won't need to shift more than a month.
  for (; dayShiftAbs < 31; dayShiftAbs++) {
    isoDayTry = isoDay - (sign * dayShiftAbs)

    const milliTry = Date.UTC(
      isoYearTemp,
      isoMonth - 1,
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
    isoDayTry! > isoCalendarImpl.daysInMonth(isoYear, isoMonth)
  ) {
    throwOutOfRange()
  }

  if (twoDigitYearBug) {
    milli = new Date(milli!).setUTCFullYear(isoYear)
  }

  return milli!
}

export function epochNanoToISOFields(epochNano: LargeInt): ISODateTimeFields {
  let epochMilli = epochNano.div(nanoInMilli)
  let leftoverNano = epochNano.sub(epochMilli.mult(nanoInMilli)).toNumber()

  // ensure leftoverNano. bump to millisecond below if necessary
  if (leftoverNano < 0) {
    leftoverNano += nanoInMilli
    epochMilli = epochMilli.sub(1)
  }

  const isoMicrosecond = Math.floor(leftoverNano / nanoInMicro)
  leftoverNano -= isoMicrosecond * nanoInMicro

  return {
    ...epochMilliToISOFields(epochMilli.toNumber()),
    isoMicrosecond,
    isoNanosecond: leftoverNano,
  }
}

export function epochMilliToISOFields(epochMilli: number): ISODateTimeFieldsMilli {
  const [legacy, dayUnshift] = nudgeToLegacyDate(epochMilli)
  return {
    isoYear: legacy.getUTCFullYear(),
    isoMonth: legacy.getUTCMonth() + 1,
    isoDay: legacy.getUTCDate() + dayUnshift,
    isoHour: legacy.getUTCHours(),
    isoMinute: legacy.getUTCMinutes(),
    isoSecond: legacy.getUTCSeconds(),
    isoMillisecond: legacy.getUTCMilliseconds(),
  }
}

// High-level conversions

export function toEpochNano(dt: EpochableObj): LargeInt {
  return dt[epochNanoSymbol] ?? isoFieldsToEpochNano(dt.getISOFields())
}

// Misc conversions

export function isoYearToEpochSeconds(isoYear: number): number {
  return Math.floor(isoToEpochMilli(isoYear, 1, 1) / milliInSecond)
}

export function epochNanoToISOYear(epochNano: LargeInt): number {
  return nudgeToLegacyDate(
    epochNano.div(nanoInMilli).toNumber(),
  )[0].getUTCFullYear()
}

// Day-of-Week (move?)

export function computeISODayOfWeek(isoYear: number, isoMonth: number, isoDay: number): number {
  const [legacy, dayUnshift] = nudgeToLegacyDate(isoToEpochMilli(isoYear, isoMonth, isoDay))
  return positiveModulo(
    legacy.getUTCDay() + dayUnshift,
    7,
  ) || 7 // convert Sun...Mon to Mon...Sun
}

// Utils

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

function isInvalid(n: { valueOf(): number; }): boolean {
  return isNaN(n.valueOf())
}

export function throwOutOfRange(): void {
  throw new RangeError('Date outside of supported range')
}

// Epoch-Millisecond Math
// (move to diff file?)

export function diffDaysMilli(epochMilli0: number, epochMilli1: number): number {
  return Math.round((epochMilli1 - epochMilli0) / milliInDay)
}

export function addDaysMilli(epochMilli: number, days: number): number {
  return epochMilli + days * milliInDay
}

export function splitEpochNano(epochNano: LargeInt): [LargeInt, number] {
  const isoFields = epochNanoToISOFields(epochNano)
  const dayEpochNano = isoToEpochNano(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay)
  const timeNano = isoTimeToNano(isoFields)
  return [dayEpochNano, timeNano]
}
