import {
  isoDateInternalRefiners,
  isoDateTimeFieldNamesAsc,
  isoDateTimeInternalRefiners,
  isoTimeFieldNamesAsc,
  isoTimeFieldRefiners,
  pluckIsoDateTimeFields,
} from './isoFields'
import { compareLargeInts, numberToLargeInt } from './largeInt'
import { clampProp, rejectI } from './options' // use 1 instead of rejectI?
import {
  givenFieldsToNano,
  hourIndex,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInUtcDay,
  nanoToGivenFields,
} from './units'
import { compareProps, divFloorMod, mapPropsWithRefiners } from './utils'

// ISO Calendar
// -------------------------------------------------------------------------------------------------

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12
export const isoDaysInWeek = 7

export function computeIsoMonthsInYear(isoYear) { // for methods
  return isoMonthsInYear
}

export function computeIsoDaysInMonth(isoYear, isoMonth) {
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

export function computeIsoDaysInYear(isoYear) {
  return computeIsoIsLeapYear(isoYear) ? 365 : 366
}

export function computeIsoIsLeapYear(isoYear) {
  return isoYear % 4 === 0 && (isoYear % 100 !== 0 || isoYear % 400 === 0)
}

export function computeIsoDayOfWeek(isoDateFields) {
  return isoToLegacyDate(
    isoDateFields.isoYear,
    isoDateFields.isoMonth,
    isoDateFields.isoDay,
  ).getDay() + 1
}

export function computeIsoWeekOfYear(isoDateFields) {
  // TODO
}

export function computeIsoYearOfWeek(isoDateFields) {
  // TODO
}

// Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoDateTimeInternals(rawIsoDateTimeInternals) {
  return checkIsoDateTimeInternals(
    constrainIsoDateTimeInternals(
      mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
    ),
  )
}

export function refineIsoDateInternals(rawIsoDateInternals) {
  return checkIsoDateTimeInternals(
    constrainIsoDateInternals(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
    ),
  )
}

export function refineIsoTimeInternals(rawIsoTimeInternals) {
  return constrainIsoTimeFields(
    mapPropsWithRefiners(rawIsoTimeInternals, isoTimeFieldRefiners),
  )
}

// Constraining
// -------------------------------------------------------------------------------------------------

export function constrainIsoDateTimeInternals(isoDateTimeFields) {
  return {
    ...constrainIsoDateInternals(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields),
  }
}

/*
accepts iso-date-like fields and will pass all through
accepts returnUndefinedI
*/
export function constrainIsoDateInternals(isoDateFields, overflowI = rejectI) {
  const isoMonth = clampProp(isoDateFields, 'isoMonth', 1, isoMonthsInYear, overflowI)
  if (isoMonth) {
    const daysInMonth = computeIsoDaysInMonth(isoDateFields.isoYear, isoMonth)
    const isoDay = clampProp(isoDateFields, 'isoDay', 1, daysInMonth, overflowI)
    if (isoDay) {
      return {
        ...isoDateFields, // calendar,(timeZone),isoYear
        isoMonth,
        isoDay,
      }
    }
  }
}

export function constrainIsoTimeFields(isoTimeFields, overflowI = rejectI) {
  // TODO: clever way to compress this, using functional programming
  // Will this kill need for clampProp?
  return {
    isoHour: clampProp(isoTimeFields, 'isoHour', 0, 23, overflowI),
    isoMinute: clampProp(isoTimeFields, 'isoMinute', 0, 59, overflowI),
    isoSecond: clampProp(isoTimeFields, 'isoSecond', 0, 59, overflowI),
    isoMillisecond: clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflowI),
    isoMicrosecond: clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflowI),
    isoNanosecond: clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflowI),
  }
}

// Epoch-checking
// -------------------------------------------------------------------------------------------------

const epochNanoMax = numberToLargeInt(nanoInUtcDay).mult(100000000) // inclusive
const epochNanoMin = epochNanoMax.mult(-1) // inclusive
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin

export function checkIsoDateTimeInternals(isoDateTimeInternals) {
  const isoYear = clampProp(isoDateTimeInternals, 'isoYear', isoYearMin, isoYearMax, rejectI)
  const nudge = isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  if (nudge) {
    const epochNano = isoToEpochNano(isoDateTimeInternals)
    checkEpochNano(epochNano && epochNano.addNumber((nanoInUtcDay - 1) * nudge))
  }

  return isoDateTimeInternals
}

export function checkEpochNano(epochNano) {
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

export function isoTimeFieldsToNano(isoTimeFields) {
  return givenFieldsToNano(isoTimeFields, hourIndex, isoTimeFieldNamesAsc)
}

export function nanoToIsoTimeAndDay(nano) {
  const [dayDelta, timeNano] = divFloorMod(nano, nanoInUtcDay)
  const isoTimeFields = nanoToGivenFields(timeNano, hourIndex, isoTimeFieldNamesAsc)
  return [isoTimeFields, dayDelta]
}

// Epoch Unit Conversion
// -------------------------------------------------------------------------------------------------

// nano -> [micro/milli/sec] (with floor)

export function epochNanoToSec(epochNano) {
  return epochNanoToSecMod(epochNano)[0].toNumber()
}

export function epochNanoToMilli(epochNano) {
  return epochNanoToMilliMod(epochNano)[0].toNumber()
}

function epochNanoToMicro(epochNano) {
  return epochNanoToMicroMod(epochNano)[0].toBigInt()
}

// nano -> [micro/milli/sec] (with remainder)

export function epochNanoToSecMod(epochNano) {
  return epochNano.divFloorMod(nanoInSec)
}

function epochNanoToMilliMod(epochNano) {
  return epochNano.divFloorMod(nanoInMilli)
}

function epochNanoToMicroMod(epochNano) {
  return epochNano.divFloorMod(nanoInMicro)
}

// [micro/milli/sec] -> nano

export function epochSecToNano(epochSec) {
  return numberToLargeInt(epochSec).mult(nanoInSec)
}

export function epochMilliToNano(epochMilli) {
  return numberToLargeInt(epochMilli).mult(nanoInMilli)
}

export function epochMicroToNano(epochMicro) {
  return epochMicro.mult(nanoInMicro)
}

// Epoch Getters
// -------------------------------------------------------------------------------------------------

export const epochGetters = {
  epochSeconds: epochNanoToSec,
  epochMilliseconds: epochNanoToMilli,
  epochMicroseconds: epochNanoToMicro,
  epochNanoseconds(epochNano) {
    return epochNano.toBigInt()
  },
}

// ISO <-> Epoch Conversion
// -------------------------------------------------------------------------------------------------

// ISO Fields -> Epoch

export function isoToEpochSec(isoDateTimeFields) {
  const epochSec = isoArgsToEpochSec(...pluckIsoDateTimeFields(isoDateTimeFields))
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
export function isoToEpochMilli(isoDateTimeFields) {
  return isoArgsToEpochMilli(...pluckIsoDateTimeFields(isoDateTimeFields))
}

/*
If out-of-bounds, returns undefined
*/
export function isoToEpochNano(isoDateTimeFields) {
  const epochMilli = isoToEpochMilli(isoDateTimeFields)

  if (epochMilli !== undefined) {
    return numberToLargeInt(epochMilli)
      .mult(nanoInMilli)
      .addNumber(
        isoDateTimeFields.isoMicrosecond * nanoInMicro +
        isoDateTimeFields.isoNanosecond,
      )
  }
}

// ISO Arguments -> Epoch

export function isoArgsToEpochSec(...args) {
  return isoArgsToEpochMilli(...args) / milliInSec // assume valid
}

/*
If out-of-bounds, returns undefined
*/
export function isoArgsToEpochMilli(...args) {
  const legacyDate = isoToLegacyDate(...args)
  const epochMilli = legacyDate.getTime()

  if (!isNaN(epochMilli)) {
    return epochMilli
  }
}

function isoToLegacyDate(
  isoYear,
  isoMonth = 1, // rest are optional...
  isoDate,
  isoHour,
  isoMinute,
  isoSec,
  isoMilli,
) {
  // Note: Date.UTC() interprets one and two-digit years as being in the
  // 20th century, so don't use it
  const legacyDate = new Date()
  legacyDate.setUTCHours(isoHour, isoMinute, isoSec, isoMilli)
  legacyDate.setUTCFullYear(isoYear, isoMonth - 1, isoDate)
  return legacyDate
}

// Epoch -> ISO Fields

export function epochNanoToIso(epochNano) {
  const [epochMilli, nanoRemainder] = epochNano.divFloorMod(nanoInMilli)
  const [isoMicrosecond, isoNanosecond] = divFloorMod(nanoRemainder, nanoInMicro)
  return {
    ...epochMilliToIso(epochMilli),
    isoMicrosecond,
    isoNanosecond,
  }
}

export function epochMilliToIso(epochMilli) {
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
