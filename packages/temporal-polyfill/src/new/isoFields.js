import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import { toIntegerThrowOnInfinity, toIntegerWithoutRounding, toPositiveInteger } from './options'
import { pluckProps, zipSingleValue } from './util'

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
