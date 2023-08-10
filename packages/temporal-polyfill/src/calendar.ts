import { DateBagStrict, DateGetterFields, MonthDayBagStrict, YearMonthBagStrict, dateGetterNames } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { queryCalendarPublic } from './calendarPublic'
import { TemporalInstance, createProtocolChecker, createSimpleTemporalClass, getInternals, getObjId, getTemporalName, idGetters } from './class'
import {
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { IsoDateFields } from './isoFields'
import {
  LargestUnitOptions,
  OverflowOptions,
  refineCalendarDiffOptions,
  refineOverflowOptions,
} from './options'
import {
  ensureObjectlike,
  ensureString
} from './cast'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { excludeUndefinedProps, mapPropNames } from './utils'
import { ZonedDateTime } from './zonedDateTime'
import { validateFieldNames } from './calendarOps'

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
  dateFromFields(fields: DateBagStrict, options?: OverflowOptions): PlainDate
  yearMonthFromFields(fields: YearMonthBagStrict, options?: OverflowOptions): PlainYearMonth
  monthDayFromFields(fields: MonthDayBagStrict, options?: OverflowOptions): PlainMonthDay
  dateAdd(dateArg: PlainDateArg, duration: DurationArg, options?: OverflowOptions): PlainDate
  dateUntil(dateArg0: PlainDateArg, dateArg1: PlainDateArg, options: LargestUnitOptions): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
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
const calendarProtocolMethods = {
  ...mapPropNames((propName: keyof DateGetterFields) => {
    const whitelistName = dateArgWhitelist[propName]

    return (impl: CalendarImpl, dateArg: DateArg) => {
      const inWhitelist = whitelistName && (getTemporalName(dateArg) || '').includes(whitelistName)
      const getInternalsFunc = inWhitelist ? getInternals : toPlainDateInternals
      const isoFields = getInternalsFunc(dateArg) as IsoDateFields

      return impl[propName](isoFields)
    }
  }, dateGetterNames) as {
    [K in keyof DateGetterFields]: (impl: CalendarImpl, dateArg: DateArg) => DateGetterFields[K]
  },

  dateAdd(
    impl: CalendarImpl,
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
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
    options?: LargestUnitOptions,
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
    fields: DateBagStrict,
    options?: OverflowOptions,
  ): PlainDate {
    return createPlainDate(refinePlainDateBag(fields, options, impl))
  },

  yearMonthFromFields(
    impl: CalendarImpl,
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    return createPlainYearMonth(refinePlainYearMonthBag(fields, options, impl))
  },

  monthDayFromFields(
    impl: CalendarImpl,
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    return createPlainMonthDay(refinePlainMonthDayBag(fields, options, impl))
  },

  fields(impl: CalendarImpl, fieldNames: Iterable<string>): Iterable<string> {
    return impl.fields(validateFieldNames(fieldNames))
  },

  mergeFields(
    impl: CalendarImpl,
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    return impl.mergeFields(
      excludeUndefinedProps(ensureObjectlike(fields0)),
      excludeUndefinedProps(ensureObjectlike(fields1)),
    )
  },
}

// HACK to not require era-related methods
const crap = { ...calendarProtocolMethods } as any
delete crap.era
delete crap.eraYear

export const checkCalendarProtocol = createProtocolChecker(crap as typeof calendarProtocolMethods)

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
