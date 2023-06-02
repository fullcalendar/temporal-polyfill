import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import {
  computeIsoDaysInMonth,
  isoFieldsToEpochNano,
  isoMonthsInYear,
  nanosecondsInIsoDay,
} from './isoMath'
import { compareLargeInts, createLargeInt } from './largeInt'
import {
  toIntegerThrowOnInfinity,
  toIntegerWithoutRounding,
  toPositiveInteger,
} from './options'
import { clamp, mapRefiners, pluckProps, zipSingleValue } from './util'

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: queryCalendarOps,
  isoDay: toPositiveInteger,
  isoMonth: toPositiveInteger,
  isoYear: toIntegerWithoutRounding,
}

// Ordered alphabetically
export const isoTimeFieldRefiners = {
  isoHour: toIntegerThrowOnInfinity,
  isoMicrosecond: toIntegerThrowOnInfinity,
  isoMillisecond: toIntegerThrowOnInfinity,
  isoMinute: toIntegerThrowOnInfinity,
  isoNanosecond: toPositiveInteger, // why different?
  isoSecond: toPositiveInteger, // why different?
}

// Unordered
export const isoDateTimeInternalRefiners = {
  ...isoDateInternalRefiners,
  ...isoTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const isoDateInternalNames = Object.keys(isoDateInternalRefiners)
export const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort()

export const isoDateFieldNames = isoDateInternalNames.slice(1) // no calendar
export const isoTimeFieldNames = Object.keys(isoTimeFieldRefiners)

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = zipSingleValue(isoTimeFieldNames, 0)

// Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoTimeInternals(rawIsoTimeInternals) {
  return constrainIsoTimeFields(
    mapRefiners(rawIsoTimeInternals, isoTimeFieldRefiners),
  )
}

export function refineIsoDateInternals(rawIsoDateInternals) {
  return constrainIsoDateInternals(
    mapRefiners(rawIsoDateInternals, isoDateInternalRefiners),
  )
}

export function refineIsoDateTimeInternals(rawIsoDateTimeInternals) {
  return constrainIsoDateTimeInternals(
    mapRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
  )
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

// Validation
// TODO: move elsewhere
// -------------------------------------------------------------------------------------------------

const epochNanoMax = createLargeInt(nanosecondsInIsoDay).mult(100000000) // inclusive
const epochNanoMin = createLargeInt.mult(-1) // inclusive
const isoYearMin = -271821
const isoYearMax = 275760

function validateIsoDateTimeInternals(isoDateTimeInternals) {
  const { isoYear } = isoDateTimeInternals
  clamp(isoYear, isoYearMin, isoYearMax) // TODO: must error!

  const nudge =
    isoYear === isoYearMin
      ? 1
      : isoYear === isoYearMax
        ? -1
        : 0

  if (nudge) {
    const epochNano = isoFieldsToEpochNano(isoDateTimeInternals)
    validateEpochNano(epochNano && epochNano.add((nanosecondsInIsoDay - 1) * nudge))
  }

  return isoDateTimeInternals
}

export function validateEpochNano(epochNano) {
  if (
    epochNano == null || // TODO: pick null or undefined
    compareLargeInts(epochNano, epochNanoMin) === 1 || // epochNano < epochNanoMin
    compareLargeInts(epochNanoMax, epochNano) === 1 // epochNanoMax < epochNano
  ) {
    throw new RangeError('aahh')
  }
  return epochNano
}

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoDateInternals = pluckProps.bind(undefined, isoDateInternalNames)
export const pluckIsoDateTimeInternals = pluckProps.bind(undefined, isoDateTimeInternalNames)
export const pluckIsoTimeFields = pluckProps.bind(undefined, isoTimeFieldNames)

export const generatePublicIsoDateFields =
  generatePublicIsoFields.bind(undefined, pluckIsoDateInternals)

export const generatePublicIsoDateTimeFields =
  generatePublicIsoFields.bind(undefined, pluckIsoDateTimeInternals)

function generatePublicIsoFields(pluckFunc, internals) {
  const publicFields = pluckFunc(internals)
  publicFields.calendar = getPublicIdOrObj(internals.calendar)
  return publicFields
}

// Similar to getPublicCalendar and getPublicTimeZone
export function getPublicIdOrObj(ops) {
  return getInternals(ops) || // adapter (return internal object)
    ops.id // impl (return id)
}
