import { Calendar, calendarProtocolMethods, createCalendar } from './calendar'
import { dateFieldRefiners, dateStatRefiners, eraYearFieldRefiners } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import {
  createProtocolChecker,
  createWrapperClass,
  getCommonInnerObj,
  getInternals,
  getStrictInternals,
  idGettersStrict,
} from './class'
import { createDuration } from './duration'
import { ensureArray, ensureObjectlike, ensureString, toString } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { unitNamesAsc } from './units'
import { mapProps } from './utils'

const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethods)

export function queryCalendarOps(calendarArg) {
  if (typeof calendarArg === 'object') {
    if (calendarArg instanceof Calendar) {
      return getInternals(calendarArg)
    }

    checkCalendarProtocol(calendarArg)
    return new CalendarOpsAdapter(calendarArg)
  }

  return queryCalendarImpl(toString(calendarArg))
}

export function getPublicCalendar(internals) {
  const { calendar } = internals

  return getInternals(calendar) || // CalendarOpsAdapter (return internal Calendar)
    createCalendar(calendar) // CalendarImpl (create outer Calendar)
}

export const getCommonCalendarOps = getCommonInnerObj.bind(undefined, 'calendar')

// Adapter
// -------------------------------------------------------------------------------------------------

const getPlainDateInternals = getStrictInternals.bind(undefined, PlainDate)
const getPlainYearMonthInternals = getStrictInternals.bind(undefined, PlainYearMonth)
const getPlainMonthDayInternals = getStrictInternals.bind(undefined, PlainMonthDay)

const CalendarOpsAdapter = createWrapperClass(idGettersStrict, {
  ...mapProps((refiner, propName) => {
    return (calendar, isoDateFields) => {
      return refiner(calendar[propName](createPlainDate(isoDateFields)))
    }
  }, {
    // TODO: more DRY with DateGetters or something?
    ...eraYearFieldRefiners,
    ...dateFieldRefiners,
    ...dateStatRefiners,
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

  dateUntil(calendar, isoDateFields0, isoDateFields1, largestUnitIndex) {
    return getPlainDateInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0),
        createPlainDate(isoDateFields1),
        { largestUnit: unitNamesAsc[largestUnitIndex] },
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
    return ensureArray(calendar.fields(fieldNames)).map(ensureString)
  },

  mergeFields(calendar, fields0, fields1) {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1))
  },
})
