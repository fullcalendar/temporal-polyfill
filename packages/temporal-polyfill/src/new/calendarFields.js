import { isoTimeFieldNames } from './isoFields'
import { ensureBoolean, ensureInteger, toInteger } from './options'
import { mapPropNames, mapPropNamesToConstant, remapProps } from './utils'

// Refiners
// -------------------------------------------------------------------------------------------------

const dayFieldRefiners = { day: toInteger }
const monthCodeFieldRefiners = { monthCode: toString }

// Ordered alphabetically
export const eraYearFieldRefiners = {
  era: toString,
  eraYear: toInteger,
}

// Ordered alphabetically
// Does not include era/eraYear
const yearMonthFieldRefiners = {
  month: toInteger,
  ...monthCodeFieldRefiners,
  year: toInteger,
}

// Ordered alphabetically
// Does not include era/eraYear
export const dateFieldRefiners = {
  ...dayFieldRefiners,
  ...yearMonthFieldRefiners,
}

// Ordered alphabetically
const timeFieldRefiners = {
  hour: toInteger,
  microsecond: toInteger,
  millisecond: toInteger,
  minute: toInteger,
  nanosecond: toInteger,
  second: toInteger,
}

// Unordered
// Does not include era/eraYear
export const dateTimeFieldRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
}

// Ordered alphabetically, for predictable macros
const yearStatRefiners = {
  daysInYear: ensureInteger,
  inLeapYear: ensureBoolean,
  monthsInYear: ensureInteger,
}

// Unordered
export const yearMonthStatRefiners = {
  ...yearStatRefiners,
  daysInMonth: ensureInteger,
}

// Unordered
export const dateStatRefiners = {
  ...yearMonthStatRefiners,
  dayOfWeek: ensureInteger,
  dayOfYear: ensureInteger,
  weekOfYear: ensureInteger,
  yearOfWeek: ensureInteger,
  daysInWeek: ensureInteger,
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

export const yearStatNames = Object.keys(yearStatRefiners)
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

export const timeGetters = mapPropNames((timeFieldName, i) => {
  return (isoTimeFieldsInternals) => {
    return isoTimeFieldsInternals[isoTimeFieldNames[i]]
  }
}, timeFieldNames)

export const dateTimeGetters = {
  ...dateGetters,
  ...timeGetters,
}

function createGetter(propName) {
  return (internals) => {
    return internals.calendar[propName](internals)
  }
}

function createGetters(getterNames) {
  const getters = mapPropNames(createGetter, getterNames)

  getters.calendarId = function(internals) {
    return internals.calendar.id // works for either CalendarOpsAdapter or CalendarImpl
  }

  return getters
}

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNames, 0)

// Conversion
// -------------------------------------------------------------------------------------------------

export const timeFieldsToIso = remapProps.bind(undefined, timeFieldNames, isoTimeFieldNames)
