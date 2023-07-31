import { DateGetterFields, dateGetterNames } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { queryCalendarPublic } from './calendarOps'
import { TemporalInstance, createSimpleTemporalClass, getInternals, getObjId, getTemporalName, idGetters } from './class'
import {
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { IsoDateFields } from './isoFields'
import {
  ensureObjectlike,
  ensureString,
  refineCalendarDiffOptions,
  refineOverflowOptions,
} from './options'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { excludeUndefinedProps, mapPropNames } from './utils'
import { ZonedDateTime } from './zonedDateTime'

interface CalendarProtocolMethods {
  year(dateArg: PlainYearMonth | PlainDateArg): number
  month(dateArg: PlainYearMonth | PlainDateArg): number
  monthCode(dateArg: PlainYearMonth | PlainMonthDay | PlainDateArg): string
  day(dateArg: PlainMonthDay | PlainDateArg): number
  era(dateArg: PlainYearMonth | PlainDateArg): string | undefined
  eraYear(dateArg: PlainYearMonth | PlainDateArg): number | undefined
  dayOfWeek(dateArg: PlainDateArg): number
  dayOfYear(dateArg: PlainDateArg): number
  weekOfYear(dateArg: PlainDateArg): number
  yearOfWeek(dateArg: PlainDateArg): number
  daysInWeek(dateArg: PlainDateArg): number
  daysInMonth(dateArg: PlainYearMonth | PlainDateArg): number
  daysInYear(dateArg: PlainYearMonth | PlainDateArg): number
  monthsInYear(dateArg: PlainYearMonth | PlainDateArg): number
  inLeapYear(dateArg: PlainYearMonth | PlainDateArg): boolean
  dateFromFields(fields: any, options: any): PlainDate
  yearMonthFromFields(fields: any, options: any): PlainYearMonth
  monthDayFromFields(fields: any, options: any): PlainMonthDay
  dateAdd(dateArg: PlainDateArg, duration: DurationArg, options: any): PlainDate
  dateUntil(dateArg0: PlainDateArg, dateArg1: PlainDateArg, options: any): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(fields0: any, fields1: any): any
  toString?(): string;
  toJSON?(): string;
}

export interface CalendarProtocol extends CalendarProtocolMethods{
  id: string
}

// TODO: compress this somehow
const dateArgWhitelist: Record<string, string> = {
  era: 'PlainYearMonth',
  eraYear: 'PlainYearMonth',
  year: 'PlainYearMonth',
  daysInYear: 'PlainYearMonth',
  monthsInYear: 'PlainYearMonth',
  inLeapYear: 'PlainYearMonth',
  daysInMonth: 'PlainYearMonth',
  month: 'PlainYearMonth',
  monthCode: 'Month', // PlainYearMonth or PlainMonthDay
  day: 'PlainMonthDay',
}

type DateArg = PlainYearMonth | PlainMonthDay | PlainDateTime | PlainDateArg

/*
the *required* protocol methods
*/
export const calendarProtocolMethods = {
  ...mapPropNames((propName: keyof DateGetterFields) => {
    const whitelistName = dateArgWhitelist[propName]

    return (impl: CalendarImpl, dateArg: DateArg) => {
      const inWhitelist = whitelistName && (getTemporalName(dateArg) || '').includes(whitelistName)
      const getInternalsFunc = inWhitelist ? getInternals : toPlainDateInternals
      const isoFields = getInternalsFunc(dateArg) as IsoDateFields

      return impl[propName](isoFields)
    }
  }, dateGetterNames) as {
    [K in keyof DateGetterFields]: (impl: CalendarImpl, dateArg: any) => DateGetterFields[K]
  },

  dateAdd(
    impl: CalendarImpl,
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: any,
  ): PlainDate {
    return createPlainDate(
      impl.dateAdd(
        toPlainDateInternals(plainDateArg),
        toDurationInternals(durationArg),
        refineOverflowOptions(options),
      ),
    )
  },

  dateUntil(
    impl: CalendarImpl,
    plainDateArg0: PlainDateArg,
    plainDateArg1: PlainDateArg,
    options?: any,
  ): Duration {
    return createDuration(
      impl.dateUntil(
        toPlainDateInternals(plainDateArg0),
        toPlainDateInternals(plainDateArg1),
        refineCalendarDiffOptions(options),
      ),
    )
  },

  dateFromFields(
    impl: CalendarImpl,
    fields: any,
    options?: any,
  ): PlainDate {
    return createPlainDate(refinePlainDateBag(fields, options, impl))
  },

  yearMonthFromFields(
    impl: CalendarImpl,
    fields: any,
    options?: any,
  ): PlainYearMonth {
    return createPlainYearMonth(refinePlainYearMonthBag(fields, options, impl))
  },

  monthDayFromFields(
    impl: CalendarImpl,
    fields: any,
    options?: any,
  ): PlainMonthDay {
    return createPlainMonthDay(refinePlainMonthDayBag(fields, options, impl))
  },

  fields(impl: CalendarImpl, fieldNames: Iterable<string>): Iterable<string> {
    return impl.fields([...fieldNames].map(ensureString))
    // TODO: kill ensureArray everywhere? use [...] technique?
  },

  mergeFields(impl: CalendarImpl, fields0: any, fields1: any): any {
    return impl.mergeFields(
      excludeUndefinedProps(ensureObjectlike(fields0)),
      excludeUndefinedProps(ensureObjectlike(fields1)),
    )
  },
}

const calendarMethods = {
  ...calendarProtocolMethods,
  toString: getObjId,
}

export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth

export type Calendar = TemporalInstance<
  CalendarImpl, // internals
  typeof idGetters, // getters
  typeof calendarMethods // methods
>

export const [Calendar, createCalendar] = createSimpleTemporalClass(
  'Calendar',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryCalendarImpl,

  // Getters
  // -----------------------------------------------------------------------------------------------

  idGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  calendarMethods,

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    from: queryCalendarPublic,
  }
)
