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
import { isoDaysInWeek } from './isoMath'
import { parseCalendarId } from './isoParse'
import { refineOverflowOptions, strictArray, toObject } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { mapArrayToProps, noop, removeUndefines } from './utils'

export const calendarProtocolMethods = {
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
