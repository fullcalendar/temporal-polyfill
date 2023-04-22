import { queryCalendarImpl } from '../calendarImpl/calendarImplQuery' // ah
import { dateCalendarRefiners } from './calendarFields'
import { createComplexBagRefiner } from './convert'
import { createDuration, toDurationInternals } from './duration'
import { mapProps } from './obj'
import { optionsToLargestUnit, optionsToOverflow } from './options'
import { stringToCalendarId } from './parse'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { createTemporalClass } from './temporalClass'
import { TimeZone } from './timeZone'

export const [Calendar] = createTemporalClass(
  'Calendar',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (id) => {
    return queryCalendarImpl(id)
  },
  {},
  createComplexBagRefiner('calendar', TimeZone),
  stringToCalendarId,
  undefined,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    id(impl) {
      return impl.id // TODO: more DRY with toString()
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    ...mapProps(dateCalendarRefiners, (refiner, methodName) => {
      return (impl, plainDateArg) => {
        return impl[methodName](toPlainDateInternals(plainDateArg))
      }
    }),

    dateAdd(impl, plainDateArg, durationArg, options) {
      return createPlainDate(
        impl.dateAdd(
          toPlainDateInternals(plainDateArg),
          toDurationInternals(durationArg),
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

    ...mapProps({
      dateFromFields: createPlainDate,
      yearMonthFromFields: createPlainYearMonth,
      monthDayFromFields: createPlainMonthDay,
      fields: identityFunc,
      mergeFields: identityFunc,
    }, transformInternalMethod),

    toString(impl) {
      return impl.id // TODO: more DRY with toString()
    },
  },
)

// Misc
// ----

function identityFunc(input) { return input }

function transformInternalMethod(transformRes, methodName) {
  return (impl, ...args) => {
    return transformRes(impl[methodName](...args))
  }
}
