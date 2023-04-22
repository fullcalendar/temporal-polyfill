import { strictArrayOfStrings, strictInstanceOf, toObject } from './cast'
import { createDuration } from './duration'
import { mapProps } from './obj'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { getInternals } from './temporalClass'

// first attempt
// -------------

export const moveDate = createCalendarFallback(
  'dateAdd',
  createInternalGetter(PlainDate),
  (isoDateFields, durationFields, overflow) => [
    createPlainDate(isoDateFields),
    createDuration(durationFields),
    { overflow },
  ],
)

export const diffExactDates = createCalendarFallback(
  'dateUntil',
  createInternalGetter(PlainDate),
  (startIsoDateFields, endIsoDateFields, largestUnit) => [
    createPlainDate(startIsoDateFields),
    createPlainDate(endIsoDateFields),
    { largestUnit },
  ],
)

export const dateFieldsToIso = createCalendarFallback(
  'dateFromFields',
  createInternalGetter(PlainDate),
)

export const yearMonthFieldsToIso = createCalendarFallback(
  'yearMonthFromFields',
  createInternalGetter(PlainYearMonth),
)

export const monthDayFieldsToIso = createCalendarFallback(
  'monthDayFields',
  createInternalGetter(PlainMonthDay),
)

export const mergeFields = createCalendarFallback('mergeFields', toObject)

export const transformFieldNames = createCalendarFallback('fields', strictArrayOfStrings)

function createCalendarFallback(
  methodName,
  transformRes,
  transformArgs = identityFunc,
) {
  return (calendar, ...args) => {
    if (typeof calendar === 'string') {
      return queryCalendarImpl(calendar)[methodName](...args)
    }
    return transformRes(calendar[methodName](...transformArgs(...args)))
  }
}

// second attempt
// --------------
// CHOOSE THIS APPROACH
// All methods will query this adapter once in the beginning
// Better than querying adapter-ness multiple times throughout a multi-step operation

const getStrictPlainDateInternals = createInternalGetter(PlainDate)

export const CalendarOpsAdapter = createInternalClass({
  dateAdd(calendar, isoDateFields, durationFields, overflow) {
    return getStrictPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields), // hopefully won't look at blank .calendar
        createDuration(durationFields),
        { overflow },
      ),
    )
  },

  dateUntil(calendar, startIsoDateFields, endIsoDateFields, largestUnit) {
    return getStrictPlainDateInternals(
      calendar.dateUntil(
        createPlainDate(startIsoDateFields), // hopefully won't look at blank .calendar
        createPlainDate(endIsoDateFields), // hopefully won't look at blank .calendar
        { largestUnit },
      ),
    )
  },

  ...mapProps({
    dateFromFields: getStrictPlainDateInternals,
    yearMonthFromFields: createInternalGetter(PlainYearMonth),
    monthDayFields: createInternalGetter(PlainMonthDay),
    mergeFields: toObject,
    fields: strictArrayOfStrings,
  }, transformInternalMethod),
})

// Misc
// ----

// same thing used in calendar.js
function transformInternalMethod(transformRes, methodName) {
  return (impl, ...args) => {
    return transformRes(impl[methodName](...args))
  }
}

function createInternalClass() {

}

function createInternalGetter(Class) {
  return (res) => getInternals(strictInstanceOf(Class), res)
}

function queryCalendarImpl() {
}

export const isoCalendarId = 'iso8601'

export function getCommonCalendar(internals0, internals1) {
}

export function toCalendarSlot() {

}

function identityFunc(input) { return input }
