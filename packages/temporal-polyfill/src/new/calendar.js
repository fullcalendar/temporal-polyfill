import { createComplexBagRefiner, refineFields } from './bag'
import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
} from './calendarConfig'
import {
  dateFieldNames,
  dateGetterNames,
  yearMonthFieldNames,
} from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { createAdapterMethods, createTemporalClass, internalIdGetters, returnId } from './class'
import { createDuration, toDurationInternals } from './duration'
import { isoDaysInWeek } from './isoMath'
import { stringToCalendarId } from './isoParse'
import { optionsToLargestUnit, optionsToOverflow, strictArrayOfStrings, toObject } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { identityFunc, mapArrayToProps, noop, removeUndefines } from './util'

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
    ...mapArrayToProps(dateGetterNames, (propName) => {
      return (impl, plainDateArg) => {
        return impl[propName](toPlainDateInternals(plainDateArg))
      }
    }),

    daysInWeek() {
      return isoDaysInWeek
    },

    ...createAdapterMethods({
      dateAdd: [createPlainDate, toPlainDateInternals, toDurationInternals, optionsToLargestUnit],
      dateUntil: [createDuration, toPlainDateInternals, toPlainDateInternals, optionsToOverflow],
      fields: [identityFunc, strictArrayOfStrings],
      mergeFields: [identityFunc, removeUndefinesStrict, removeUndefinesStrict],
    }),

    dateFromFields(impl, fields, options) {
      return createPlainDate(
        impl.dateFromFields(
          refineFields(fields, impl.fields(dateFieldNames), getRequiredDateFields(impl)),
          optionsToOverflow(options),
        ),
      )
    },

    yearMonthFromFields(impl, fields, options) {
      return createPlainYearMonth(
        impl.yearMonthFromFields(
          refineFields(fields, impl.fields(yearMonthFieldNames), getRequiredYearMonthFields(impl)),
          optionsToOverflow(options),
        ),
      )
    },

    monthDayFromFields(impl, fields, options) {
      return createPlainMonthDay(
        ...impl.monthDayFromFields(
          // refine y/m/d fields
          refineFields(fields, impl.fields(dateFieldNames), getRequiredMonthDayFields(impl)),
          optionsToOverflow(options),
        ),
      )
    },

    toString: returnId,
  },
)

function removeUndefinesStrict(obj) {
  return removeUndefines(toObject(obj))
}
