import { dateGetterNames } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { createTemporalClass, getObjId, idGetters } from './class'
import {
  refineComplexBag,
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { createDuration, toDurationInternals } from './duration'
import { parseCalendarId } from './isoParse'
import { ensureArray, ensureObjectlike, ensureString, refineOverflowOptions } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { excludeUndefinedProps, mapPropNames, noop } from './utils'

export const calendarProtocolMethods = {
  ...mapPropNames((propName) => {
    return (impl, plainDateArg) => {
      return impl[propName](toPlainDateInternals(plainDateArg))
    }
  }, dateGetterNames),

  dateAdd(impl, plainDateArg, durationArg, options) {
    return createPlainDate(
      impl.dateAdd(
        toPlainDateInternals(plainDateArg),
        toDurationInternals(durationArg),
        refineOverflowOptions(options),
      ),
    )
  },

  dateUntil(impl, plainDateArg0, plainDateArg1, options) {
    return createDuration(
      impl.dateUntil(
        toPlainDateInternals(plainDateArg0),
        toPlainDateInternals(plainDateArg1),
        refineOverflowOptions(options),
      ),
    )
  },

  dateFromFields(impl, fields, options) {
    return createPlainDate(refinePlainDateBag(fields, options, impl))
  },

  yearMonthFromFields(impl, fields, options) {
    return createPlainYearMonth(refinePlainYearMonthBag(fields, options, impl))
  },

  monthDayFromFields(impl, fields, options) {
    return createPlainMonthDay(refinePlainMonthDayBag(fields, options, impl))
  },

  fields(impl, fieldNames) {
    return impl.fields(ensureArray(fieldNames).map(ensureString))
  },

  mergeFields(impl, fields0, fields1) {
    return impl.mergeFields(
      excludeUndefinedProps(ensureObjectlike(fields0)),
      excludeUndefinedProps(ensureObjectlike(fields1)),
    )
  },
}

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

  {
    ...calendarProtocolMethods,

    toString: getObjId,
  },
)
