import { isoTimeFieldNamesAsc, pluckIsoDateTimeFields } from './isoFields'
import { LargeInt, compareLargeInts, numberToLargeInt } from './largeInt'
import { clamp, divMod, mapArrayToProps } from './util'

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
  return isoToLegacyDate(isoDateFields).getDay() + 1
}

export function computeIsoWeekOfYear(isoDateFields) {
}

export function computeIsoYearOfWeek(isoDateFields) {
}

// Constraining
// -------------------------------------------------------------------------------------------------

export function constrainIsoDateTimeInternals(isoDateTimeInternals) {
  return validateIsoDateTimeInternals({
    ...constrainIsoDateInternals(isoDateTimeInternals),
    ...constrainIsoTimeFields(isoDateTimeInternals),
  })
}

export function constrainIsoDateInternals(isoDateInternals) {
  return validateIsoDateTimeInternals({
    calendar: isoDateInternals.calendar,
    isoYear: isoDateInternals.isoYear,
    isoMonth: clamp(isoDateInternals.isoMonth, 1, isoMonthsInYear), // TODO: must error!
    isoDay: clamp( // TODO: must error!
      isoDateInternals.isoDay,
      1,
      computeIsoDaysInMonth(isoDateInternals.isoYear, isoDateInternals.isoMonth),
    ),
  })
}

export function constrainIsoTimeFields(isoTimeFields, overflow = 'reject') {
  return {
    isoHour: clamp(isoTimeFields.isoHour, 1, 23, overflow),
    isoMinute: clamp(isoTimeFields.isoMinute, 1, 59, overflow),
    isoSecond: clamp(isoTimeFields.isoSecond, 1, 59, overflow),
    isoMillisecond: clamp(isoTimeFields.isoMillisecond, 1, 999, overflow),
    isoMicrosecond: clamp(isoTimeFields.isoMicrosecond, 1, 999, overflow),
    isoNanosecond: clamp(isoTimeFields.isoNanosecond, 1, 999, overflow),
  }
}

// Unit Definitions
// -------------------------------------------------------------------------------------------------

export const secInDay = 86400 // TODO: rename 'sec' -> 'seconds'
export const milliInDay = 86400000 // TODO: not DRY
export const milliInSec = 1000

export const nanoInMicro = 1000 // consolidate with other 1000 units
export const nanoInMilli = 1000000
export const nanoInSec = 1000000000
export const nanoInHour = 3600000000000
export const nanoInUtcDay = 86400000000000

// Ordered by ascending size
export const nanoInUnit = {
  nanosecond: 1,
  microsecond: nanoInMicro,
  millisecond: nanoInMilli,
  second: nanoInSec,
  hour: nanoInHour,
  day: nanoInUtcDay,
  week: 0,
  month: 0,
  year: 0,
}

export const unitNamesAsc = Object.keys(nanoInUnit)
export const unitIndexes = mapArrayToProps(unitNamesAsc)

// Matches indexes in nanoInUnit
// (most are not used)
export const nanoIndex = 0
export const microIndex = 1
export const milliIndex = 2
export const secondsIndex = 3
export const minuteIndex = 4
export const hourIndex = 5
export const dayIndex = 6
export const weekIndex = 7
export const monthIndex = 8
export const yearIndex = 9

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
  return epochNanoToMicroMod(epochNano)[0]
}

// nano -> [micro/milli/sec] (with remainder)

export function epochNanoToSecMod(epochNano) {
  return epochNano.divMod(nanoInSec)
}

function epochNanoToMilliMod(epochNano) {
  return epochNano.divMod(nanoInMilli)
}

function epochNanoToMicroMod(epochNano) {
  return epochNano.divMod(nanoInMicro)
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

// fields <-> nano

export function isoTimeFieldsToNano(isoTimeFields) {
  return arbitraryFieldsToNano(isoTimeFields, hourIndex, isoTimeFieldNamesAsc)
}

export function nanoToIsoTimeAndDay(nano) {
  const [dayDelta, timeNano] = divMod(nano, nanoInUtcDay)

  return [
    nanoToArbitraryFields(timeNano, hourIndex, isoTimeFieldNamesAsc),
    dayDelta,
  ]
}

// nano field utils

export function arbitraryFieldsToLargeNano(fields, unitIndex, fieldNames) {
  let largeNano = new LargeInt(0, 0)

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    largeNano = largeNano.addLargeInt(
      numberToLargeInt(fields[fieldNames[unitIndex]]).mult(divisor),
    )
  }

  return largeNano
}

export function arbitraryFieldsToNano(fields, unitIndex, fieldNames) {
  let nano = 0

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    nano += fields[fieldNames[unitIndex]] * divisor
  }

  return nano
}

export function nanoToArbitraryFields(nano, unitIndex, fieldNames) {
  const fields = {}

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    fields[fieldNames[unitIndex]] = nano / divisor
    nano %= divisor
  }

  return fields
}

// Epoch Getters
// -------------------------------------------------------------------------------------------------

export const epochGetters = {
  epochSeconds: epochNanoToSec,

  epochMilliseconds: epochNanoToMilli,

  epochMicroseconds(epochNano) {
    return epochNanoToMicro(epochNano).toBigInt()
  },

  epochNanoseconds(epochNano) {
    return epochNano.toBigInt()
  },
}

// Validation
// -------------------------------------------------------------------------------------------------

const epochNanoMax = numberToLargeInt(nanoInUtcDay).mult(100000000) // inclusive
const epochNanoMin = epochNanoMax.mult(-1) // inclusive
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin

function validateIsoDateTimeInternals(isoDateTimeInternals) { // validateIsoInternals?
  const { isoYear } = isoDateTimeInternals
  clamp(isoYear, isoYearMin, isoYearMax) // TODO: must error!

  const nudge = isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  if (nudge) {
    const epochNano = isoToEpochNano(isoDateTimeInternals)
    validateEpochNano(epochNano && epochNano.add((nanoInUtcDay - 1) * nudge))
  }

  return isoDateTimeInternals
}

export function validateEpochNano(epochNano) {
  if (
    epochNano === undefined ||
    compareLargeInts(epochNano, epochNanoMin) === 1 || // epochNano < epochNanoMin
    compareLargeInts(epochNanoMax, epochNano) === 1 // epochNanoMax < epochNano
  ) {
    throw new RangeError('aahh')
  }
  return epochNano
}

// ISO <-> Epoch Conversion
// -------------------------------------------------------------------------------------------------

// ISO Fields -> Epoch
// (could be out-of-bounds, return undefined!)

export function isoToEpochSec(isoDateTimeFields) {
  const epochSec = isoArgsToEpochSec(
    isoDateTimeFields.year,
    isoDateTimeFields.month,
    isoDateTimeFields.day,
    isoDateTimeFields.hour,
    isoDateTimeFields.minute,
    isoDateTimeFields.second,
  )
  const subsecNano =
    isoDateTimeFields.millisecond * nanoInMilli +
    isoDateTimeFields.microsecond * nanoInMicro +
    isoDateTimeFields.nanosecond

  return [epochSec, subsecNano]
}

export function isoToEpochMilli(isoDateTimeFields) {
  return isoArgsToEpochMilli(...pluckIsoDateTimeFields(isoDateTimeFields))
}

export function isoToEpochNano(isoDateTimeFields) {
  // if invalid, should return undefined
}

// ISO Arguments -> Epoch
// (could be out-of-bounds, return undefined!)

export function isoArgsToEpochSec(...args) { // doesn't accept beyond sec
  return isoArgsToEpochMilli(...args) / milliInSec // no need for rounding
}

export function isoArgsToEpochMilli(
  isoYear,
  isoMonth = 1,
  isoDate, // rest are optional...
  isoHour,
  isMinute,
  isoSec,
  isoMilli,
) {
}

function isoToLegacyDate(isoDateTimeFields) {
}

// Epoch -> ISO Fields

export function epochNanoToIso() {
}

export function epochMilliToIso() {
}

// Comparison
// -------------------------------------------------------------------------------------------------

export function compareIsoDateTimeFields() {
  // TODO: (use Math.sign technique?)
}

export function compareIsoTimeFields() {
}
