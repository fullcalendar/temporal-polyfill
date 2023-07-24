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
import { DurationInternals } from './durationFields'
import { CalendarInternals, IsoDateFields, IsoDateInternals } from './isoFields'
import { Overflow, ensureArray, ensureObjectlike, ensureString, toString } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Unit, unitNamesAsc } from './units'
import { mapProps } from './utils'

// types

export interface CalendarOps {
  id: string
  era(isoFields: IsoDateFields): string | undefined
  eraYear(isoFields: IsoDateFields): number | undefined
  year(isoFields: IsoDateFields): number
  monthCode(isoFields: IsoDateFields): string
  month(isoFields: IsoDateFields): number
  day(isoFields: IsoDateFields): number
  daysInYear(isoFields: IsoDateFields): number
  inLeapYear(isoFields: IsoDateFields): boolean
  monthsInYear(isoFields: IsoDateFields): number
  daysInMonth(isoFields: IsoDateFields): number
  dayOfWeek(isoFields: IsoDateFields): number
  dayOfYear(isoFields: IsoDateFields): number
  weekOfYear(isoFields: IsoDateFields): number
  yearOfWeek(isoFields: IsoDateFields): number
  daysInWeek(isoFields: IsoDateFields): number
}

//

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

export const getCommonCalendarOps = getCommonInnerObj.bind<
  any, [any], [CalendarInternals, CalendarInternals], CalendarOps
>(undefined, 'calendar')

// Adapter
// -------------------------------------------------------------------------------------------------

const getPlainDateInternals = getStrictInternals.bind<
  any, [any], // bound
  [PlainDate], // unbound
  IsoDateInternals // return
>(undefined, PlainDate)

const getPlainYearMonthInternals = getStrictInternals.bind<
  any, [any], // bound
  [PlainYearMonth], // unbound
  IsoDateInternals // return
>(undefined, PlainYearMonth)

const getPlainMonthDayInternals = getStrictInternals.bind<
  any, [any], // bound
  [PlainMonthDay], // unbound
  IsoDateInternals // return
>(undefined, PlainMonthDay)

const CalendarOpsAdapter = createWrapperClass(idGettersStrict, {
  ...mapProps((refiner, propName) => {
    return (calendar: Calendar, isoDateFields: IsoDateInternals) => {
      return refiner(calendar[propName](createPlainDate(isoDateFields)))
    }
  }, {
    // TODO: more DRY with DateGetters or something?
    ...eraYearFieldRefiners,
    ...dateFieldRefiners,
    ...dateStatRefiners,
  }),

  dateAdd(
    calendar: Calendar,
    isoDateFields: IsoDateInternals,
    durationInternals: DurationInternals,
    overflow: Overflow,
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields),
        createDuration(durationInternals),
        { overflow },
      ),
    )
  },

  dateUntil(
    calendar: Calendar,
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit, // TODO: ensure year/month/week/day???
  ) {
    return getPlainDateInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0),
        createPlainDate(isoDateFields1),
        { largestUnit: unitNamesAsc[largestUnit] },
      ),
    )
  },

  dateFromFields(calendar: Calendar, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainDateInternals(calendar.dateFromFields(fields, { overflow }))
  },

  yearMonthFromFields(calendar: Calendar, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainYearMonthInternals(calendar.yearMonthFromFields(fields, { overflow }))
  },

  monthDayFromFields(calendar: Calendar, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainMonthDayInternals(calendar.monthDayFromFields(fields, { overflow }))
  },

  fields(calendar: Calendar, fieldNames: string[]) {
    return ensureArray(calendar.fields(fieldNames)).map(ensureString)
  },

  mergeFields(calendar: Calendar, fields0: any, fields1: any) {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1))
  },
})
