import { Calendar, calendarVitalMethods, createCalendar } from './calendar'
import { dateFieldRefiners, dateStatRefiners, eraYearFieldRefiners } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { adapterIdGetters, createWrapperClass, getInternals, getStrictInternals } from './class'
import { createDuration } from './duration'
import { strictArray, toObject, toString } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { createVitalsChecker, getCommonInternal, mapProps } from './util'

const checkCalendarVitals = createVitalsChecker(calendarVitalMethods)

export function queryCalendarOps(calendarArg) {
  if (typeof calendarArg === 'object') {
    if (calendarArg instanceof Calendar) {
      return getInternals(calendarArg)
    }

    checkCalendarVitals(calendarArg)
    return new CalendarOpsAdapter(calendarArg)
  }

  return queryCalendarImpl(toString(calendarArg))
}

export function getPublicCalendar(internals) {
  const { calendar } = internals

  return getInternals(calendar) || // CalendarOpsAdapter (return internal Calendar)
    createCalendar(calendar) // CalendarImpl (create outer Calendar)
}

export const getCommonCalendarOps = getCommonInternal.bind(undefined, 'calendar')

// Adapter
// -------------------------------------------------------------------------------------------------

const getPlainDateInternals = getStrictInternals(PlainDate)
const getPlainYearMonthInternals = getStrictInternals(PlainYearMonth)
const getPlainMonthDayInternals = getStrictInternals(PlainMonthDay)

const CalendarOpsAdapter = createWrapperClass(adapterIdGetters, {
  ...mapProps({
    ...eraYearFieldRefiners,
    ...dateFieldRefiners,
    ...dateStatRefiners,
  }, (refiner, propName) => {
    return (calendar, isoDateFields) => {
      return refiner(calendar[propName](createPlainDate(isoDateFields)))
    }
  }),

  dateAdd(calendar, isoDateFields, durationInternals, overflow) {
    return getPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields),
        createDuration(durationInternals),
        { overflow },
      ),
    )
  },

  dateUntil(calendar, isoDateFields0, isoDateFields1, largestUnit) {
    return getPlainDateInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0),
        createPlainDate(isoDateFields1),
        { largestUnit },
      ),
    )
  },

  dateFromFields(calendar, fields, overflow) {
    return getPlainDateInternals(calendar.dateFromFields(fields, { overflow }))
  },

  yearMonthFromFields(calendar, fields, overflow) {
    return getPlainYearMonthInternals(calendar.yearMonthFromFields(fields, { overflow }))
  },

  monthDayFromFields(calendar, fields, overflow) {
    return getPlainMonthDayInternals(calendar.monthDayFromFields(fields, { overflow }))
  },

  fields(calendar, fieldNames) {
    return strictArray(calendar.fields(fieldNames)).map(toString)
  },

  mergeFields(calendar, fields0, fields1) {
    return toObject(calendar.mergeFields(fields0, fields1))
  },
})
