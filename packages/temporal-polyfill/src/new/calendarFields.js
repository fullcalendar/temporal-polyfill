import { isoTimeFieldNames } from './isoFields'
import { toBoolean, toInteger, toIntegerThrowOnInfinity, toPositiveInteger } from './options'
import { mapArrayToProps, remapProps, zipSingleValue } from './util'

// Refiners
// -------------------------------------------------------------------------------------------------

const dayFieldRefiners = { day: toPositiveInteger }
const monthCodeFieldRefiners = { monthCode: toString }

// Ordered alphabetically
export const eraYearFieldRefiners = {
  era: toString,
  eraYear: toInteger,
}

// Ordered alphabetically
// Does not include era/eraYear
const yearMonthFieldRefiners = {
  month: toPositiveInteger,
  ...monthCodeFieldRefiners,
  year: toIntegerThrowOnInfinity,
}

// Ordered alphabetically
// Does not include era/eraYear
export const dateFieldRefiners = {
  ...dayFieldRefiners,
  ...yearMonthFieldRefiners,
}

// Ordered alphabetically
const timeFieldRefiners = {
  hour: toIntegerThrowOnInfinity,
  microsecond: toIntegerThrowOnInfinity,
  millisecond: toIntegerThrowOnInfinity,
  minute: toIntegerThrowOnInfinity,
  nanosecond: toIntegerThrowOnInfinity,
  second: toIntegerThrowOnInfinity,
}

// Unordered
// Does not include era/eraYear
export const dateTimeFieldRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
}

// Ordered alphabetically, for predictable macros
const yearStatRefiners = {
  daysInYear: toPositiveInteger,
  inLeapYear: toBoolean,
  monthsInYear: toPositiveInteger,
}

// Unordered
export const yearMonthStatRefiners = {
  ...yearStatRefiners,
  daysInMonth: toPositiveInteger,
}

// Unordered
export const dateStatRefiners = {
  ...yearMonthStatRefiners,
  dayOfWeek: toPositiveInteger,
  dayOfYear: toPositiveInteger,
  weekOfYear: toPositiveInteger,
  yearOfWeek: toPositiveInteger,
  daysInWeek: toPositiveInteger,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const eraYearFieldNames = Object.keys(eraYearFieldRefiners)
export const allYearFieldNames = [...eraYearFieldNames, 'year']

export const dateFieldNames = Object.keys(dateFieldRefiners)
export const yearMonthFieldNames = Object.keys(yearMonthFieldRefiners) // month/monthCode/year
export const monthDayFieldNames = dateFieldNames.slice(0, 3) // day/month/monthCode
export const monthFieldNames = monthDayFieldNames.slice(1) // month/monthCode
export const dateTimeFieldNames = Object.keys(dateTimeFieldRefiners).sort()
export const timeFieldNames = Object.keys(timeFieldRefiners)

export const dateBasicNames = ['day', 'month', 'year']
export const yearMonthBasicNames = yearMonthFieldNames.slice(1) // monthCode/year
export const monthDayBasicNames = ['day', 'monthCode']

export const yearStatNames = Object.keys(yearStatRefiners) // ordered, for predictable macros
export const yearMonthStatNames = Object.keys(yearMonthStatRefiners) // unordered
export const dateStatNames = Object.keys(dateStatRefiners) // unordered

export const dateGetterNames = [...dateFieldNames, ...dateStatNames] // unordered
export const yearMonthGetterNames = [...yearMonthFieldNames, ...yearMonthStatNames] // unordered
export const monthDayGetterNames = monthDayFieldNames // unordered

// Getters
// -------------------------------------------------------------------------------------------------

export const dateGetters = createGetters(dateGetterNames)
export const yearMonthGetters = createGetters(yearMonthGetterNames)
export const monthDayGetters = createGetters(monthDayGetterNames)

export const timeGetters = mapArrayToProps(timeFieldNames, (timeFieldName, i) => {
  return (isoTimeFieldsInternals) => {
    return isoTimeFieldsInternals[isoTimeFieldNames[i]]
  }
})

export const dateTimeGetters = {
  ...dateGetters,
  ...timeGetters,
}

function createGetters(getterNames) {
  const getters = mapArrayToProps(getterNames, (fieldName) => {
    return (internals) => {
      return internals.calendar[fieldName](internals)
    }
  })

  getters.calendarId = function(internals) {
    return internals.calendar.id
  }

  return getters
}

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = zipSingleValue(timeFieldNames, 0)

// Conversion
// -------------------------------------------------------------------------------------------------

export function timeFieldsToIso(timeFields) {
  return remapProps(timeFields, timeFieldNames, isoTimeFieldNames)
}
