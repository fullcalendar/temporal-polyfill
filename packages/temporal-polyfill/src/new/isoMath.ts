import { isoFieldsToEpochMilli } from '../dateUtils/epoch'
import { diffEpochMilliByDay } from './diff'
import {
  IsoDateFields,
  IsoDateInternals,
  IsoDateTimeFields,
  IsoDateTimeInternals,
  IsoTimeFields,
  IsoTuple,
  isoDateInternalRefiners,
  isoDateTimeFieldNamesAsc,
  isoDateTimeInternalRefiners,
  isoTimeFieldNamesAsc,
  isoTimeFieldRefiners,
  pluckIsoTuple,
} from './isoFields'
import { LargeInt, compareLargeInts, numberToLargeInt } from './largeInt'
import { Overflow, clampProp } from './options'
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
import { compareProps, divFloorMod, mapPropsWithRefiners, pluckPropsTuple } from './utils'

// ISO Calendar
// -------------------------------------------------------------------------------------------------

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12
export const isoDaysInWeek = 7

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
    isoFieldsToEpochMilli(isoDateMonthStart(isoDateFields)),
    isoFieldsToEpochMilli(isoDateFields),
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

// Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoDateTimeInternals(rawIsoDateTimeInternals: IsoDateTimeInternals): IsoDateTimeInternals {
  return checkIso(
    constrainIsoDateTimeInternals(
      mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
    ),
  )
}

export function refineIsoDateInternals(rawIsoDateInternals: IsoDateInternals): IsoDateInternals {
  return checkIso(
    constrainIsoDateInternals(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
    ),
  )
}

export function refineIsoTimeInternals(rawIsoTimeInternals: IsoTimeFields): IsoTimeFields {
  const asdf = mapPropsWithRefiners(rawIsoTimeInternals, isoTimeFieldRefiners)
  return constrainIsoTimeFields(
    asdf,
  )
}

// Constraining
// -------------------------------------------------------------------------------------------------

export function constrainIsoDateTimeInternals(
  isoDateTimeFields: IsoDateTimeInternals,
): IsoDateTimeInternals {
  return {
    ...constrainIsoDateInternals(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields),
  }
}

/*
accepts iso-date-like fields and will pass all through
*/
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow?: Overflow,
): P
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow: Overflow | -1,
): P | undefined
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow: Overflow | -1 = Overflow.Reject,
): P | undefined {
  const isoMonth = clampProp(
    isoInternals as IsoDateFields,
    'isoMonth',
    1,
    isoMonthsInYear,
    overflow,
  )

  if (isoMonth) {
    const daysInMonth = computeIsoDaysInMonth(isoInternals.isoYear, isoMonth)
    const isoDay = clampProp(isoInternals as IsoDateFields, 'isoDay', 1, daysInMonth, overflow)

    if (isoDay) {
      return {
        ...isoInternals,
        isoMonth,
        isoDay,
      }
    }
  }
}

export function constrainIsoTimeFields(isoTimeFields: IsoTimeFields, overflow: Overflow = Overflow.Reject) {
  // TODO: clever way to compress this, using functional programming
  // Will this kill need for clampProp?
  return {
    isoHour: clampProp(isoTimeFields, 'isoHour', 0, 23, overflow),
    isoMinute: clampProp(isoTimeFields, 'isoMinute', 0, 59, overflow),
    isoSecond: clampProp(isoTimeFields, 'isoSecond', 0, 59, overflow),
    isoMillisecond: clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflow),
    isoMicrosecond: clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflow),
    isoNanosecond: clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflow),
  }
}

const epochNanoMax = numberToLargeInt(secInDay).mult(1e17) // TODO: define this better
const epochNanoMin = epochNanoMax.mult(-1) // inclusive
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin

export function checkIso<T extends IsoDateFields>(isoFields: T): T {
  const isoYear = clampProp(isoFields as IsoDateFields, 'isoYear', isoYearMin, isoYearMax, Overflow.Reject)
  const nudge = isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  if (nudge) {
    const epochNano = isoToEpochNano(isoFields)
    checkEpochNano(epochNano && epochNano.addNumber((nanoInUtcDay - 1) * nudge))
  }

  return isoFields
}

export function checkEpochNano(epochNano: LargeInt | undefined): LargeInt {
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
  const isoTimeFields = nanoToGivenFields(timeNano, Unit.Hour, isoTimeFieldNamesAsc)
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
*/
export function isoToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
): LargeInt | undefined {
  const epochMilli = isoToEpochMilli(isoFields)

  if (epochMilli !== undefined) {
    return numberToLargeInt(epochMilli)
      .mult(nanoInMilli)
      .addNumber(
        ((isoFields as IsoDateTimeInternals).isoMicrosecond || 0) * nanoInMicro +
        ((isoFields as IsoDateTimeInternals).isoNanosecond || 0),
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

export const compareIsoDateTimeFields = compareProps.bind(undefined, isoDateTimeFieldNamesAsc)
export const compareIsoTimeFields = compareProps.bind(undefined, isoTimeFieldNamesAsc)
