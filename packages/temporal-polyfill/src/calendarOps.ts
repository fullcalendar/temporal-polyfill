import { Calendar, CalendarArg, CalendarProtocol, calendarProtocolMethods, createCalendar } from './calendar'
import { DateGetterFields, dateGetterRefiners } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import {
  createProtocolChecker,
  createWrapperClass,
  getCommonInnerObj,
  getInternals,
  getStrictInternals,
  idGettersStrict,
  WrapperInstance,
} from './class'
import { Duration, createDuration } from './duration'
import { DurationInternals } from './durationFields'
import { CalendarInternals, IsoDateFields, IsoDateInternals } from './isoFields'
import { Overflow, ensureObjectlike, ensureString, toString } from './options'
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
  dateFromFields(fields: any, overflow: Overflow): IsoDateInternals
  yearMonthFromFields(fields: any, overflow: Overflow): IsoDateInternals
  monthDayFromFields(fields: any, overflow: Overflow): IsoDateInternals
  dateAdd(isoFields: IsoDateFields, durationInternals: DurationInternals, overflow: Overflow): IsoDateInternals
  dateUntil(isoFields0: IsoDateFields, isoFields1: IsoDateFields, options: any): DurationInternals
  fields(fieldNames: string[]): string[]
  mergeFields(fields0: any, fields1: any): any
}

//

const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethods)

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (typeof calendarArg === 'object') {
    if (calendarArg instanceof Calendar) {
      return getInternals(calendarArg as Calendar)
    }

    checkCalendarProtocol(calendarArg)
    return new CalendarOpsAdapter(calendarArg)
  }

  return queryCalendarImpl(toString(calendarArg))
}

export function getPublicCalendar(internals: { calendar: CalendarOps }): CalendarProtocol {
  const { calendar } = internals

  return getInternals(calendar as CalendarOpsAdapter) ||
    createCalendar(calendar as CalendarImpl)
}

export const getCommonCalendarOps = getCommonInnerObj.bind<
  any, [any], // bound
  [CalendarInternals, CalendarInternals], // unbound
  CalendarOps // return
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

const getDurationInternals = getStrictInternals.bind<
  any, [any], // bound
  [Duration], // unbound
  DurationInternals // return
>(undefined, Duration)

const calendarOpsAdapterMethods = {
  ...mapProps((refiner, propName) => {
    return ((calendar: CalendarProtocol, isoDateFields: IsoDateFields) => {
      // TODO: fix type error by having more specific refiner inputs
      return refiner(calendar[propName](createPlainDate(isoDateFields)))
    })
  }, dateGetterRefiners) as {
    [K in keyof DateGetterFields]: (calendar: CalendarProtocol, isoFields: IsoDateFields) => DateGetterFields[K]
  },

  dateAdd(
    calendar: CalendarProtocol,
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
    calendar: CalendarProtocol,
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit, // TODO: ensure year/month/week/day???
  ): DurationInternals {
    return getDurationInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0 as IsoDateInternals), // hopefully internal calendar never used
        createPlainDate(isoDateFields1 as IsoDateInternals), // "
        { largestUnit: unitNamesAsc[largestUnit] },
      )
    )
  },

  dateFromFields(calendar: CalendarProtocol, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainDateInternals(calendar.dateFromFields(fields, { overflow }))
  },

  yearMonthFromFields(calendar: CalendarProtocol, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainYearMonthInternals(calendar.yearMonthFromFields(fields, { overflow }))
  },

  monthDayFromFields(calendar: CalendarProtocol, fields: any, overflow: Overflow): IsoDateInternals {
    return getPlainMonthDayInternals(calendar.monthDayFromFields(fields, { overflow }))
  },

  fields(calendar: CalendarProtocol, fieldNames: string[]): string[] {
    return [...calendar.fields(fieldNames)].map(ensureString)
    // TODO: kill ensureArray elsewhere?
  },

  mergeFields(calendar: CalendarProtocol, fields0: any, fields1: any): any {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1))
  },
}

type CalendarOpsAdapter = WrapperInstance<
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>

const CalendarOpsAdapter = createWrapperClass<
  [CalendarProtocol], // constructor
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>(idGettersStrict, calendarOpsAdapterMethods)
