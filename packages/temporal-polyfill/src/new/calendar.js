import { dateGetterNames } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { createAdapterMethods, createTemporalClass, internalIdGetters, returnId } from './class'
import {
  createComplexBagRefiner,
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
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
      return createPlainDate(refinePlainDateBag(fields, options, impl))
    },

    yearMonthFromFields(impl, fields, options) {
      return createPlainYearMonth(refinePlainYearMonthBag(fields, options, impl))
    },

    monthDayFromFields(impl, fields, options) {
      return createPlainMonthDay(refinePlainMonthDayBag(fields, options, impl))
    },

    toString: returnId,
  },
)

function removeUndefinesStrict(obj) {
  return removeUndefines(toObject(obj))
}
