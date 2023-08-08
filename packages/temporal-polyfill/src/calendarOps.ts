import { Calendar, CalendarArg, CalendarProtocol, calendarProtocolMethods } from './calendar'
import { DateBag, DateBagStrict, DateGetterFields, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateGetterRefiners } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import {
  createProtocolChecker,
  createWrapperClass,
  getCommonInnerObj,
  getInternals,
  getStrictInternals,
  idGettersStrict,
  TemporalInstance,
  WrapperInstance,
} from './class'
import { Duration, createDuration } from './duration'
import { DurationInternals } from './durationFields'
import { IsoDateFields } from './isoFields'
import { CalendarInternals, IsoDateInternals } from './isoInternals'
import { parseCalendarId } from './isoParse'
import { Overflow, overflowMapNames } from './options'
import { ensureObjectlike, ensureString, toString } from './cast'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Unit, unitNamesAsc } from './units'
import { BoundArg, Callable, isObjectlike, mapProps } from './utils'

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
  dateFromFields(fields: DateBag, overflow: Overflow): IsoDateInternals
  yearMonthFromFields(fields: YearMonthBag, overflow: Overflow): IsoDateInternals
  monthDayFromFields(fields: MonthDayBag, overflow: Overflow): IsoDateInternals
  dateAdd(isoFields: IsoDateFields, durationInternals: DurationInternals, overflow: Overflow): IsoDateInternals
  dateUntil(isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit): DurationInternals
  fields(fieldNames: string[]): string[]
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
}

//

export const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethods)

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (isObjectlike(calendarArg)) {
    if (calendarArg instanceof Calendar) {
      return getInternals(calendarArg as Calendar)
    }

    const { calendar } = getInternals(calendarArg as TemporalInstance<{ calendar: CalendarOps }>) || {}

    return calendar || (
      checkCalendarProtocol(calendarArg as CalendarProtocol),
      new CalendarOpsAdapter(calendarArg as CalendarProtocol)
    )
  }

  return queryCalendarImpl(parseCalendarId(toString(calendarArg)))
}

export const getCommonCalendarOps = getCommonInnerObj.bind<
  undefined, [BoundArg], // bound
  [CalendarInternals, CalendarInternals], // unbound
  CalendarOps // return
>(undefined, 'calendar')

// Adapter
// -------------------------------------------------------------------------------------------------

const getPlainDateInternals = getStrictInternals.bind<
  undefined, [BoundArg], // bound
  [PlainDate], // unbound
  IsoDateInternals // return
>(undefined, PlainDate)

const getPlainYearMonthInternals = getStrictInternals.bind<
  undefined, [BoundArg], // bound
  [PlainYearMonth], // unbound
  IsoDateInternals // return
>(undefined, PlainYearMonth)

const getPlainMonthDayInternals = getStrictInternals.bind<
  undefined, [BoundArg], // bound
  [PlainMonthDay], // unbound
  IsoDateInternals // return
>(undefined, PlainMonthDay)

const getDurationInternals = getStrictInternals.bind<
  undefined, [BoundArg], // bound
  [Duration], // unbound
  DurationInternals // return
>(undefined, Duration)

const calendarOpsAdapterMethods = {
  ...mapProps((refiner: Callable, propName) => {
    return ((calendar: CalendarProtocol, isoDateFields: IsoDateFields) => {
      // HACK: hopefully `calendar` not accessed
      const pd = createPlainDate(isoDateFields as IsoDateInternals)
      return refiner(calendar[propName](pd))
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
        { overflow: overflowMapNames[overflow] },
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

  dateFromFields(
    calendar: CalendarProtocol,
    fields: DateBag,
    overflow: Overflow,
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateFromFields(
        fields as DateBagStrict,
        { overflow: overflowMapNames[overflow] },
      )
    )
  },

  yearMonthFromFields(
    calendar: CalendarProtocol,
    fields: YearMonthBag,
    overflow: Overflow,
  ): IsoDateInternals {
    return getPlainYearMonthInternals(
      calendar.yearMonthFromFields(
        fields as YearMonthBagStrict,
        { overflow: overflowMapNames[overflow] },
      )
    )
  },

  monthDayFromFields(
    calendar: CalendarProtocol,
    fields: MonthDayBag,
    overflow: Overflow,
  ): IsoDateInternals {
    return getPlainMonthDayInternals(
      calendar.monthDayFromFields(
        fields as MonthDayBagStrict,
        { overflow: overflowMapNames[overflow] },
      )
    )
  },

  fields(calendar: CalendarProtocol, fieldNames: string[]): string[] {
    return [...calendar.fields(fieldNames)].map(ensureString)
    // TODO: kill ensureArray elsewhere?
  },

  mergeFields(
    calendar: CalendarProtocol,
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>,
  ): Record<string, unknown> {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1))
  },
}

export type CalendarOpsAdapter = WrapperInstance<
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>

export const CalendarOpsAdapter = createWrapperClass<
  [CalendarProtocol], // constructor
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>(idGettersStrict, calendarOpsAdapterMethods)
