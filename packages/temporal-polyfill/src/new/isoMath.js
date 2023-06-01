import { createLargeInt } from './largeInt'

export const nanosecondsInMicrosecond = 1000
export const nanosecondsInMillisecond = 1000000
export const nanosecondsInSecond = 1000000000
export const nanosecondsInMinute = 60000000000 // used?
export const nanosecondsInHour = 3600000000000
export const nanosecondsInIsoDay = 86400000000000

export const nanosecondsInUnit = {} // include iso-day as well

export function epochNanoToMilli(epochNano) {
  return epochNano.div(nanosecondsInMillisecond).toNumber()
}

export const epochGetters = {
  epochNanoseconds(epochNanoseconds) {
    return epochNanoseconds.toBigInt()
  },

  epochMicroseconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInMicrosecond).toBigInt()
  },

  epochMilliseconds: epochNanoToMilli,

  epochSeconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInSecond).toNumber()
  },
}

export function regulateEpochNanoseconds(epochNanoseconds) {
  // ensure the browser allows it
}

// Stuff

export const isoMonthsInYear = 12
export const isoDaysInWeek = 7
export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972

export function computeIsoMonthsInYear(isoYear) {
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
  return generateLegacyDate(isoDateFields).getDay() + 1
}

export function computeIsoWeekOfYear(isoDateFields) {
}

export function computeIsoYearOfWeek(isoDateFields) {
}

export function isoFieldsToEpochMilli(isoFields) {
}

export function isoToEpochMilli(isoYear, isoMonth, isoDate) {
}

export function diffDaysMilli(milli0, milli1) {
}

export function addDaysMilli(epochMilli, milli) {
}

export function generateLegacyDate(isoDateTimeFields) {
}

export function epochMilliToIsoFields() {
}

// TIME math...

export function isoTimeFieldsToNanoseconds() {

}

export function nanosecondsToIsoTimeFields() {
  /*
  const dayDelta = Math.floor(nanoseconds / nanosecondsInIsoDay)
  nanoseconds %= nanosecondsInIsoDay
  */
  // return [isoTimeFields, dayDelta]
}

// does floor
export function epochNanoToSec(epochNano) {
  let epochSec = epochNano.div(nanosecondsInSecond).toNumber() // does truncation
  let subsecNano = epochNano.sub(createLargeInt(epochSec).mult(nanosecondsInSecond)).toNumber()

  if (subsecNano < 0) {
    epochSec--
    subsecNano += nanosecondsInSecond
  }

  return [epochSec, subsecNano]
}

export function epochSecToNano(epochSec) {
  return createLargeInt(epochSec).mult(nanosecondsInSecond)
}

export function epochNanoToIsoFields() {
}

export function isoToUtcEpochNanoseconds(isoFields) {
}

export function isoFieldsToEpochNano(isoFields) {
}

export function isoTimeToNanoseconds(isoTimeFields) {
}

export function nanosecondsToTimeDuration(nanoseconds) { // nanoseconds is a number
  // returns an (incomplete?) Duration?
  // good idea to put here?
}

export function epochNanosecondsToIso(epochNanoseconds, timeZone) {
}

export function compareIsoFields() {
  // uses Date.UTC
}

export function compareIsoTimeFields() {
  // uses conversion to milliseconds
}

export function addDaysToIsoFields() {
  // short-circuit if nothing to add
}

export const milliInSec = 1000
export const nanoInMicro = 1000
export const nanoInMilli = 1000
export const secInDay = 86400

export function isoToEpochSec(...args) { // doesn't accept beyond sec
  return isoToEpochMilli(...args) / milliInSec // no need for rounding
}

export function isoFieldsToEpochSec(isoDateTimeFields) {
  const epochSec = isoToEpochSec(
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
