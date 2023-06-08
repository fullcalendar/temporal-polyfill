import { dateGetterNames } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { createTemporalClass, internalIdGetters, returnId } from './class'
import {
  createComplexBagRefiner,
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { createDuration, toDurationInternals } from './duration'
import { isoDaysInWeek } from './isoMath'
import { stringToCalendarId } from './isoParse'
import { optionsToOverflow, strictArray, toObject } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { mapArrayToProps, noop, removeUndefines } from './util'

export const calendarVitalMethods = {
  ...mapArrayToProps(dateGetterNames, (propName) => {
    return (impl, plainDateArg) => {
      return impl[propName](toPlainDateInternals(plainDateArg))
    }
  }),

  daysInWeek() {
    return isoDaysInWeek
  },

  dateAdd(impl, plainDateArg, durationArg, options) {
    return createPlainDate(
      impl.dateAdd(
        toPlainDateInternals(plainDateArg),
        toDurationInternals(durationArg),
        optionsToOverflow(options),
      ),
    )
  },

  dateUntil(impl, plainDateArg0, plainDateArg1, options) {
    return createDuration(
      impl.dateUntil(
        toPlainDateInternals(plainDateArg0),
        toPlainDateInternals(plainDateArg1),
        optionsToOverflow(options),
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
    return impl.fields(strictArray(fieldNames).map(toString))
  },

  mergeFields(impl, fields0, fields1) {
    return impl.mergeFields(
      removeUndefines(toObject(fields0)),
      removeUndefines(toObject(fields1)),
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
    ...calendarVitalMethods,

    toString: returnId,
  },
)
