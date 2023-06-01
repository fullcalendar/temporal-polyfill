import { createComplexBagRefiner, prepareFields } from './bag'
import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
} from './calendarConfig'
import { dateCalendarRefiners, dateFieldNames, yearMonthFieldNames } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { createDuration, toDurationInternals } from './duration'
import { isoDaysInWeek } from './isoMath'
import { stringToCalendarId } from './isoParse'
import { optionsToLargestUnit, optionsToOverflow, strictArrayOfStrings, toObject } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { createTemporalClass } from './temporalClass'
import { TimeZone } from './timeZone'
import { mapProps, noop, removeUndefines } from './util'
import { internalIdGetters, returnId } from './wrapperClass'

/*
Must do input validation
*/
export const [Calendar, createCalendar] = createTemporalClass(
  'Calendar',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryCalendarImpl,

  // internalsConversionMap
  {},

  // bagToInternals
  createComplexBagRefiner('calendar', TimeZone),

  // stringToInternals
  (str) => queryCalendarImpl(stringToCalendarId(str)),

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  internalIdGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    ...mapProps(dateCalendarRefiners, (refiner, methodName) => {
      return (impl, plainDateArg) => {
        return impl[methodName](toPlainDateInternals(plainDateArg))
      }
    }),

    daysInWeek() {
      return isoDaysInWeek
    },

    dateAdd(impl, plainDateArg, durationArg, options) {
      return createPlainDate(
        impl.dateAdd(
          toPlainDateInternals(plainDateArg),
          toDurationInternals(durationArg), // TODO: balance-up time parts to days
          optionsToLargestUnit(options),
        ),
      )
    },

    dateUntil(impl, startPlainDateArg, endPlainDateArg, options) {
      return createDuration(
        impl.dateUntil(
          toPlainDateInternals(startPlainDateArg),
          toPlainDateInternals(endPlainDateArg),
          optionsToOverflow(options),
        ),
      )
    },

    dateFromFields(impl, fields, options) {
      return createPlainDate({
        calendar: impl,
        ...impl.dateFromFields(
          prepareFields(fields, impl.fields(dateFieldNames), getRequiredDateFields(impl)),
          optionsToOverflow(options),
        ),
      })
    },

    yearMonthFromFields(impl, fields, options) {
      return createPlainYearMonth({
        calendar: impl,
        ...impl.yearMonthFromFields(
          prepareFields(fields, impl.fields(yearMonthFieldNames), getRequiredYearMonthFields(impl)),
          optionsToOverflow(options),
        ),
      })
    },

    monthDayFromFields(impl, fields, options) {
      return createPlainMonthDay({
        calendar: impl,
        ...impl.monthDayFromFields(
          // refine y/m/d fields
          prepareFields(fields, impl.fields(dateFieldNames), getRequiredMonthDayFields(impl)),
          optionsToOverflow(options),
        ),
      })
    },

    fields(impl, fieldNames) {
      return impl.fields(strictArrayOfStrings(fieldNames))
    },

    mergeFields(impl, fields0, fields1) {
      return impl.mergeFields(
        removeUndefines(toObject(fields0)),
        removeUndefines(toObject(fields1)),
      )
    },

    toString: returnId,
  },
)
