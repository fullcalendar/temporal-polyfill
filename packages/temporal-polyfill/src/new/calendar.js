import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
} from './calendarConfig'
import { dateCalendarRefiners, dateFieldNames, yearMonthFieldNames } from './calendarFields'
import { isoDaysInWeek, queryCalendarImpl } from './calendarImpl'
import { strictArrayOfStrings, toObject } from './cast'
import { createComplexBagRefiner, prepareFields } from './convert'
import { createDuration, toDurationInternals } from './duration'
import { internalIdGetters, returnId } from './internalClass'
import { noop } from './lang'
import { mapProps } from './obj'
import { optionsToLargestUnit, optionsToOverflow } from './options'
import { stringToCalendarId } from './parse'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { createTemporalClass } from './temporalClass'
import { TimeZone } from './timeZone'

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
          toPlainDateInternals(plainDateArg), // round time parts???
          toDurationInternals(durationArg),
          optionsToLargestUnit(options),
        ),
      )
    },

    dateUntil(impl, startPlainDateArg, endPlainDateArg, options) {
      return createDuration(
        impl.dateUntil(
          toPlainDateInternals(startPlainDateArg), // round time parts???
          toPlainDateInternals(endPlainDateArg), // round time parts???
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

// utils

function removeUndefines(obj) { // and copy

}
