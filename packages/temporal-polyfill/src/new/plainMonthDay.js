import { isoCalendarId } from './calendarConfig'
import { monthDayGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import {
  bagToPlainMonthDayInternals,
  isStringCastsEqual,
  mapRefiners,
  plainMonthDayToPlainDate,
  plainMonthDayWithBag,
} from './convert'
import { formatIsoMonthDayFields, formatPossibleDate } from './format'
import { neverValueOf } from './internalClass'
import {
  compareIsoFields,
  constrainIsoDateFields,
  generatePublicIsoDateFields,
  isoDateSlotRefiners,
} from './isoFields'
import { noop } from './lang'
import { optionsToOverflow } from './options'
import { stringToMonthDayInternals } from './parse'
import { createTemporalClass } from './temporalClass'

export const [
  PlainMonthDay,
  createPlainMonthDay,
  toPlainMonthDayInternals,
] = createTemporalClass(
  'PlainMonthDay',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoMonth, isoDay, calendarArg = isoCalendarId, referenceIsoYear = 1972) => {
    return constrainIsoDateFields(
      mapRefiners({
        isoYear: referenceIsoYear,
        isoMonth,
        isoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },

  // massageOtherInternals
  noop,

  // bagToInternals
  bagToPlainMonthDayInternals,

  // stringToInternals
  stringToMonthDayInternals,

  // handleUnusedOptions
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

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },
)
