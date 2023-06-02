import { createCalendar } from './calendar'
import { dateFieldRefiners, dateStatRefiners, eraYearFieldRefiners } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import {
  createAdapterMethods,
  createWrapperClass,
  getInternals,
  getStrictInternals,
  internalIdGetters,
} from './class'
import { createDuration } from './duration'
import { largestUnitToOptions, overflowToOptions, strictArrayOfStrings, toObject } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { identityFunc, mapProps } from './util'

export function queryCalendarOps(calendarSlot) {
  if (typeof calendarSlot === 'object') {
    return new CalendarOpsAdapter(calendarSlot)
  }
  return queryCalendarImpl(calendarSlot) // string
}

export function getPublicCalendar(internals) {
  const calendarOps = internals.calendar
  return getInternals(calendarOps) || // CalendarOpsAdapter (return internal Calendar)
    createCalendar(calendarOps) // CalendarImpl (create outer Calendar)
}

export function getCommonCalendarOps(internals0, internals1) {
  // TODO
}

// Adapter
// -------------------------------------------------------------------------------------------------

const getPlainDateInternals = getStrictInternals(PlainDate)

const CalendarOpsAdapter = createWrapperClass(
  internalIdGetters,
  createAdapterMethods({
    ...mapProps({
      ...eraYearFieldRefiners,
      ...dateFieldRefiners,
      ...dateStatRefiners,
    }, (refiner) => [refiner, createPlainDate]),
    dateAdd: [getPlainDateInternals, createPlainDate, createDuration, overflowToOptions],
    dateUntil: [getPlainDateInternals, createPlainDate, createPlainDate, largestUnitToOptions],
    dateFromFields: [getPlainDateInternals, identityFunc, overflowToOptions],
    yearMonthFromFields: [getStrictInternals(PlainYearMonth), identityFunc, overflowToOptions],
    monthDayFromFields: [getStrictInternals(PlainMonthDay), identityFunc, overflowToOptions],
    fields: [strictArrayOfStrings, identityFunc],
    mergeFields: [toObject, identityFunc, identityFunc],
  }),
)
