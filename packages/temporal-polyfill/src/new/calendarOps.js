import { createCalendar } from './calendar'
import { queryCalendarImpl } from './calendarImpl'
import { createDuration } from './duration'
import { strictArrayOfStrings, toObject } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import {
  createInternalGetter,
  createWrapperClass,
  getInternals,
  internalIdGetters,
} from './wrapperClass'

export function queryCalendarOps(calendarSlot) {
  if (typeof calendarSlot === 'object') {
    return new CalendarOpsAdapter(calendarSlot)
  }
  return queryCalendarImpl(calendarSlot) // string
}

export function getPublicCalendar(internals) {
  const { calendar } = internals
  return getInternals(calendar) || // if CalendarOpsAdapter
    createCalendar(calendar) // if CalendarImpl
}

export function getCommonCalendarOps(internals0, internals1) {
  // TODO
}

// Adapter
// -------------------------------------------------------------------------------------------------

const getStrictPlainDateInternals = createInternalGetter(PlainDate)

/*
Must do output-validation on whatever internal Calendar returns
*/
const CalendarOpsAdapter = createWrapperClass(internalIdGetters, {
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

  /*
  Fields should have already been plucked and refined from raw input
  */
  dateFromFields(calendar, fields, overflow) {
    return getStrictPlainDateInternals( // TODO: pluck away `calendar`Op
      calendar.dateFromFields(fields, { overflow }),
    )
  },

  /*
  Fields should have already been plucked and refined from raw input
  */
  yearMonthFromFields(calendar, fields, overflow) {
    return createInternalGetter(PlainYearMonth)(
      calendar.yearMonthFromFields(fields, { overflow }),
    )
  },

  /*
  Fields should have already been plucked and refined from raw input
  */
  monthDayFromFields(calendar, fields, overflow) {
    return createInternalGetter(PlainMonthDay)(
      calendar.monthDayFields(calendar, fields, { overflow }),
    )
  },

  fields(calendar, fieldNames) {
    return strictArrayOfStrings(calendar.fields(calendar, fieldNames))
  },

  mergeFields(calendar, fields0, fields1) {
    return toObject(calendar.mergeFields(fields0, fields1))
  },
})
