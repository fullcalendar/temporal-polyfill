import { dateGetterNames } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { TemporalInstance, createTemporalClass, getInternals, getObjId, getTemporalName, idGetters } from './class'
import {
  refineComplexBag,
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { parseCalendarId } from './isoParse'
import {
  ensureObjectlike,
  ensureString,
  refineCalendarDiffOptions,
  refineOverflowOptions,
} from './options'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { excludeUndefinedProps, mapPropNames, noop } from './utils'

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
const dateArgWhitelist = {
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

// the *required* protocol methods
export const calendarProtocolMethods = {
  ...mapPropNames((propName) => {
    const whitelistName = dateArgWhitelist[propName as keyof typeof dateArgWhitelist]

    return ((impl: CalendarImpl, dateArg: any) => {
      const isoFields = whitelistName && (getTemporalName(dateArg) || '').includes(whitelistName)
        ? getInternals(dateArg)
        : toPlainDateInternals(dateArg)

      return impl[propName](isoFields)
    }) as any
  }, dateGetterNames),

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

// TODO: move elsewhere
// TODO: use TS `satisfies` on main class?
type Unmethodize<F> = F extends ((...args: infer A) => infer R)
  ? (impl: CalendarImpl, ...args: A) => R
  : never

const calendarMethods: {
  [K in keyof CalendarProtocolMethods]: Unmethodize<CalendarProtocolMethods[K]>
} = {
  ...calendarProtocolMethods,
  toString: getObjId,
}

export type CalendarArg = CalendarProtocol | string

export type Calendar = TemporalInstance<
  CalendarImpl, // internals
  typeof idGetters, // getters
  typeof calendarMethods // methods
>

export const [Calendar, createCalendar] = createTemporalClass(
  'Calendar',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryCalendarImpl,

  // internalsConversionMap
  {},

  // bagToInternals
  refineComplexBag.bind(undefined, 'calendar', TimeZone),

  // stringToInternals
  (str) => queryCalendarImpl(parseCalendarId(str)),

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  idGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  calendarMethods,
)
