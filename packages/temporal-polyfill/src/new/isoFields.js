import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import {
  constrainIsoDateInternals,
  constrainIsoDateTimeInternals,
  constrainIsoTimeFields,
} from './isoMath'
import { toInteger } from './options'
import { mapRefiners, pluckProps, zipSingleValue } from './utils'

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: queryCalendarOps,
  isoDay: toInteger,
  isoMonth: toInteger,
  isoYear: toInteger,
}

// Ordered by ascending size
export const isoTimeFieldRefiners = {
  isoHour: toInteger,
  isoMicrosecond: toInteger,
  isoMillisecond: toInteger,
  isoMinute: toInteger,
  isoNanosecond: toInteger,
  isoSecond: toInteger,
}

// Unordered
export const isoDateTimeInternalRefiners = {
  ...isoDateInternalRefiners,
  ...isoTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

const isoDateInternalNames = Object.keys(isoDateInternalRefiners)
export const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort()

export const isoDateFieldNames = isoDateInternalNames.slice(1) // no calendar
const isoDateTimeFieldNames = isoDateTimeInternalRefiners.slice(1) // no calendar
export const isoTimeFieldNamesAsc = Object.keys(isoTimeFieldRefiners)
export const isoTimeFieldNames = isoTimeFieldNamesAsc.sort()

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

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoDateInternals = pluckProps.bind(undefined, isoDateInternalNames)
export const pluckIsoDateTimeInternals = pluckProps.bind(undefined, isoDateTimeInternalNames)
export const pluckIsoDateTimeFields = pluckProps.bind(undefined, isoDateTimeFieldNames)
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
