import { dateGetterNames } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { TemporalInstance, createTemporalClass, getObjId, idGetters } from './class'
import {
  refineComplexBag,
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { parseCalendarId } from './isoParse'
import {
  ensureArray,
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

export const calendarProtocolMethods = {
  ...mapPropNames((propName) => {
    return ((impl: CalendarImpl, plainDateArg: PlainDateArg) => {
      return impl[propName](toPlainDateInternals(plainDateArg))
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

  fields(impl: CalendarImpl, fieldNames: string[]): string[] {
    return impl.fields(ensureArray(fieldNames).map(ensureString))
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

export type CalendarArg = Calendar | string

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
