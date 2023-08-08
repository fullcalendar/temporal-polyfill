import { Overflow } from './options'
import { diffEpochMilliByDay } from './diff'
import {
  IsoDateTimeFields,
  IsoDateFields,
  IsoTimeFields,
  IsoTuple,
  isoTimeFieldNamesAsc,
  pluckIsoTuple,
} from './isoFields'
import { LargeInt, compareLargeInts, numberToLargeInt } from './largeInt'
import {
  Unit,
  givenFieldsToNano,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInUtcDay,
  nanoToGivenFields,
  secInDay,
} from './units'
import { NumSign, compareNumbers, divFloorMod, clampProp } from './utils'

// ISO Calendar
// -------------------------------------------------------------------------------------------------

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12
export const isoDaysInWeek = 7

export function computeIsoDaysInWeek(isoDateFields: IsoDateFields) {
  return isoDaysInWeek
}

export function computeIsoMonthsInYear(isoYear: number): number { // for methods
  return isoMonthsInYear
}

export function computeIsoDaysInMonth(isoYear: number, isoMonth: number): number {
  switch (isoMonth) {
    case 2:
      return computeIsoIsLeapYear(isoYear) ? 29 : 28
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
  }
  return 31
}

export function computeIsoDaysInYear(isoYear: number): number {
  return computeIsoIsLeapYear(isoYear) ? 365 : 366
}

export function computeIsoIsLeapYear(isoYear: number): boolean {
  return isoYear % 4 === 0 && (isoYear % 100 !== 0 || isoYear % 400 === 0)
}

export function computeIsoDayOfYear(isoDateFields: IsoDateFields): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(isoDateMonthStart(isoDateFields))!,
    isoToEpochMilli(isoDateFields)!,
  )
}

export function computeIsoDayOfWeek(isoDateFields: IsoDateFields): number {
  return isoToLegacyDate(
    isoDateFields.isoYear,
    isoDateFields.isoMonth,
    isoDateFields.isoDay,
  ).getDay() + 1
}

export function computeIsoYearOfWeek(isoDateFields: IsoDateFields): number {
  return computeIsoWeekInfo(isoDateFields).isoYear
}

export function computeIsoWeekOfYear(isoDateFields: IsoDateFields): number {
  return computeIsoWeekInfo(isoDateFields).isoWeek
}

function computeIsoWeekInfo(isoDateFields: IsoDateFields): {
  isoYear: number,
  isoWeek: number,
} {
  const doy = computeIsoDayOfYear(isoDateFields)
  const dow = computeIsoDayOfWeek(isoDateFields)
  const doj = computeIsoDayOfWeek(isoDateMonthStart(isoDateFields))
  const isoWeek = Math.floor((doy - dow + 10) / isoDaysInWeek)
  const { isoYear } = isoDateFields

  if (isoWeek < 1) {
    return {
      isoYear: isoYear - 1,
      isoWeek: (doj === 5 || (doj === 6 && computeIsoIsLeapYear(isoYear - 1))) ? 53 : 52,
    }
  }
  if (isoWeek === 53) {
    if (computeIsoDaysInYear(isoYear) - doy < 4 - dow) {
      return {
        isoYear: isoYear + 1,
        isoWeek: 1,
      }
    }
  }

  return { isoYear, isoWeek }
}

function isoDateMonthStart(isoDateFields: IsoDateFields): IsoDateFields {
  return { ...isoDateFields, isoMonth: 1, isoDay: 1 }
}

const epochNanoMax = numberToLargeInt(secInDay).mult(1e17) // TODO: define this better
const epochNanoMin = epochNanoMax.mult(-1) // inclusive
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin

export function checkIsoInBounds<T extends IsoDateFields>(isoFields: T): T {
  const isoYear = clampProp(isoFields as IsoDateFields, 'isoYear', isoYearMin, isoYearMax, Overflow.Reject)
  const nudge = isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  if (nudge) {
    const epochNano = isoToEpochNano(isoFields)
    checkEpochNanoInBounds(epochNano && epochNano.addNumber((nanoInUtcDay - 1) * nudge))
  }

  return isoFields
}

export function checkEpochNanoInBounds(epochNano: LargeInt | undefined): LargeInt {
  if (
    epochNano === undefined ||
    compareLargeInts(epochNano, epochNanoMin) === 1 || // epochNano < epochNanoMin
    compareLargeInts(epochNanoMax, epochNano) === 1 // epochNanoMax < epochNano
  ) {
    throw new RangeError('aahh')
  }
  return epochNano
}

// Field <-> Nanosecond Conversion
// -------------------------------------------------------------------------------------------------

export function isoTimeFieldsToNano(isoTimeFields: IsoTimeFields): number {
  return givenFieldsToNano(isoTimeFields, Unit.Hour, isoTimeFieldNamesAsc)
}

export function nanoToIsoTimeAndDay(nano: number): [IsoTimeFields, number] {
  const [dayDelta, timeNano] = divFloorMod(nano, nanoInUtcDay)
  const isoTimeFields = nanoToGivenFields(timeNano, Unit.Hour, isoTimeFieldNamesAsc) as IsoTimeFields
  return [isoTimeFields, dayDelta]
}

// Epoch Unit Conversion
// -------------------------------------------------------------------------------------------------

// nano -> [micro/milli/sec] (with floor)

export function epochNanoToSec(epochNano: LargeInt): number {
  return epochNanoToSecMod(epochNano)[0].toNumber()
}

export function epochNanoToMilli(epochNano: LargeInt): number {
  return epochNanoToMilliMod(epochNano)[0].toNumber()
}

function epochNanoToMicro(epochNano: LargeInt): bigint {
  return epochNanoToMicroMod(epochNano)[0].toBigInt()
}

// nano -> [micro/milli/sec] (with remainder)

export function epochNanoToSecMod(epochNano: LargeInt): [LargeInt, number] {
  return epochNano.divFloorMod(nanoInSec)
}

function epochNanoToMilliMod(epochNano: LargeInt): [LargeInt, number] {
  return epochNano.divFloorMod(nanoInMilli)
}

function epochNanoToMicroMod(epochNano: LargeInt): [LargeInt, number] {
  return epochNano.divFloorMod(nanoInMicro)
}

// [micro/milli/sec] -> nano

export function epochSecToNano(epochSec: number): LargeInt {
  return numberToLargeInt(epochSec).mult(nanoInSec)
}

export function epochMilliToNano(epochMilli: number): LargeInt {
  return numberToLargeInt(epochMilli).mult(nanoInMilli)
}

export function epochMicroToNano(epochMicro: LargeInt): LargeInt {
  return epochMicro.mult(nanoInMicro)
}

// Epoch Getters
// -------------------------------------------------------------------------------------------------

export const epochGetters = {
  epochSeconds: epochNanoToSec,
  epochMilliseconds: epochNanoToMilli,
  epochMicroseconds: epochNanoToMicro,
  epochNanoseconds(epochNano: LargeInt): bigint {
    return epochNano.toBigInt()
  },
}

// ISO <-> Epoch Conversion
// -------------------------------------------------------------------------------------------------

// ISO Fields -> Epoch

export function isoToEpochSec(isoDateTimeFields: IsoDateTimeFields): [number, number] {
  const epochSec = isoArgsToEpochSec(...pluckIsoTuple(isoDateTimeFields))
  // ^assume valid

  const subsecNano =
    isoDateTimeFields.isoMillisecond * nanoInMilli +
    isoDateTimeFields.isoMicrosecond * nanoInMicro +
    isoDateTimeFields.isoNanosecond

  return [epochSec, subsecNano]
}

/*
If out-of-bounds, returns undefined
*/
export function isoToEpochMilli(
  isoDateTimeFields: IsoDateTimeFields | IsoDateFields,
): number | undefined {
  return isoArgsToEpochMilli(...pluckIsoTuple(isoDateTimeFields))
}

/*
If out-of-bounds, returns undefined
TODO: rethink all this ! bs
*/
export function isoToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
): LargeInt | undefined {
  const epochMilli = isoToEpochMilli(isoFields)

  if (epochMilli !== undefined) {
    return numberToLargeInt(epochMilli)
      .mult(nanoInMilli)
      .addNumber(
        ((isoFields as IsoDateTimeFields).isoMicrosecond || 0) * nanoInMicro +
        ((isoFields as IsoDateTimeFields).isoNanosecond || 0),
      )
  }
}

// ISO Arguments -> Epoch

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
  const legacyDate = isoToLegacyDate(...args)
  const epochMilli = legacyDate.getTime()

  if (!isNaN(epochMilli)) {
    return epochMilli
  }
}

function isoToLegacyDate(
  isoYear: number,
  isoMonth: number = 1,
  isoDay: number = 0,
  isoHour: number = 0,
  isoMinute: number = 0,
  isoSec: number = 0,
  isoMilli: number = 0,
) {
  // Note: Date.UTC() interprets one and two-digit years as being in the
  // 20th century, so don't use it
  const legacyDate = new Date()
  legacyDate.setUTCHours(isoHour, isoMinute, isoSec, isoMilli)
  legacyDate.setUTCFullYear(isoYear, isoMonth - 1, isoDay)
  return legacyDate
}

// Epoch -> ISO Fields

export function epochNanoToIso(epochNano: LargeInt): IsoDateTimeFields {
  const [epochMilli, nanoRemainder] = epochNano.divFloorMod(nanoInMilli)
  const [isoMicrosecond, isoNanosecond] = divFloorMod(nanoRemainder, nanoInMicro)
  return {
    ...epochMilliToIso(epochMilli.toNumber()),
    isoMicrosecond,
    isoNanosecond,
  }
}

export function epochMilliToIso(epochMilli: number): {
  // return value
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour: number,
  isoMinute: number,
  isoSecond: number,
  isoMillisecond: number,
} {
  const legacyDate = new Date(epochMilli)
  return {
    isoYear: legacyDate.getUTCFullYear(),
    isoMonth: legacyDate.getUTCMonth() + 1,
    isoDay: legacyDate.getUTCDate(),
    isoHour: legacyDate.getUTCHours(),
    isoMinute: legacyDate.getUTCMinutes(),
    isoSecond: legacyDate.getUTCSeconds(),
    isoMillisecond: legacyDate.getUTCMilliseconds(),
  }
}

// Comparison
// -------------------------------------------------------------------------------------------------

export function compareIsoDateTimeFields(
  isoFields0: IsoDateTimeFields,
  isoFields1: IsoDateTimeFields,
): NumSign {
  return compareIsoDateFields(isoFields0, isoFields1) ||
    compareIsoTimeFields(isoFields0, isoFields1)
}

export function compareIsoDateFields(
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
): NumSign {
  return compareNumbers(
    isoToEpochMilli(isoFields0)!,
    isoToEpochMilli(isoFields1)!,
  )
}

export function compareIsoTimeFields(
  isoFields0: IsoTimeFields,
  isoFields1: IsoTimeFields,
): NumSign {
  return compareNumbers(
    isoTimeFieldsToNano(isoFields0),
    isoTimeFieldsToNano(isoFields1)
  )
}
