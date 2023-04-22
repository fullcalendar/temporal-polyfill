import { isoCalendarId } from './calendarAdapter'
import { monthDayGetters } from './calendarFields'
import {
  bagToPlainMonthDayInternals,
  isStringCastsEqual,
  mapRefiners,
  plainMonthDayToPlainDate,
  plainMonthDayWithBag,
} from './convert'
import { formatIsoMonthDayFields, formatPossibleDate } from './format'
import {
  compareIsoFields,
  isoDateSlotRefiners,
  pluckIsoDateSlots,
  regulateIsoDateFields,
} from './isoFields'
import { optionsToOverflow } from './options'
import { stringToMonthDayInternals } from './parse'
import { createTemporalClass, neverValueOf } from './temporalClass'

export const [
  PlainMonthDay,
  createPlainMonthDay,
  toPlainMonthDayInternals,
] = createTemporalClass(
  'PlainMonthDay',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (isoMonth, isoDay, calendarArg = isoCalendarId, referenceIsoYear = 1972) => {
    return regulateIsoDateFields(
      mapRefiners({
        isoYear: referenceIsoYear,
        isoMonth,
        isoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },
  {},
  bagToPlainMonthDayInternals,
  stringToMonthDayInternals,
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  monthDayGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainMonthDay(plainMonthDayWithBag(this, bag, options))
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainMonthDayInternals(otherArg)
      return !compareIsoFields(internals, otherInternals) &&
        isStringCastsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatPossibleDate(internals, options, formatIsoMonthDayFields)
    },

    toLocaleString(internals, locales, options) {
      return ''
    },

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return plainMonthDayToPlainDate(this, bag)
    },

    getISOFields: pluckIsoDateSlots,
  },
)
