import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import {
  constrainIsoDateInternals,
  constrainIsoDateTimeInternals,
  constrainIsoTimeFields,
} from './isoMath'
import { toInteger } from './options'
import { mapPropNamesToConstant, mapPropsWithRefiners, pluckProps } from './utils'

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: queryCalendarOps,
  isoDay: toInteger, // happens to be ascending
  isoMonth: toInteger, // "
  isoYear: toInteger, // "
}

// Ordered by ascending size
export const isoTimeFieldRefiners = {
  isoNanosecond: toInteger,
  isoMicrosecond: toInteger,
  isoMillisecond: toInteger,
  isoSecond: toInteger,
  isoMinute: toInteger,
  isoHour: toInteger,
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

export const isoDateFieldNames = isoDateInternalNames.slice(1) // no calendar. ascending
export const isoTimeFieldNamesAsc = Object.keys(isoTimeFieldRefiners)
export const isoTimeFieldNames = isoTimeFieldNamesAsc.sort()
export const isoDateTimeFieldNamesAsc = [...isoDateFieldNames, ...isoTimeFieldNamesAsc]

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = mapPropNamesToConstant(isoTimeFieldNames, 0)

// Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoTimeInternals(rawIsoTimeInternals) {
  return constrainIsoTimeFields(
    mapPropsWithRefiners(rawIsoTimeInternals, isoTimeFieldRefiners),
  )
}

export function refineIsoDateInternals(rawIsoDateInternals) {
  return constrainIsoDateInternals(
    mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
  )
}

export function refineIsoDateTimeInternals(rawIsoDateTimeInternals) {
  return constrainIsoDateTimeInternals(
    mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
  )
}

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoDateInternals = pluckProps.bind(undefined, isoDateInternalNames)
export const pluckIsoDateTimeInternals = pluckProps.bind(undefined, isoDateTimeInternalNames)
export const pluckIsoDateTimeFields = pluckProps.bind(undefined, isoDateTimeFieldNamesAsc)
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
