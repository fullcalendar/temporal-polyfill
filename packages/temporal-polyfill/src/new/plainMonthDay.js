import {
  bagToPlainMonthDayInternals,
  plainMonthDayToPlainDate,
  plainMonthDayWithBag,
} from './bag'
import { isoCalendarId } from './calendarConfig'
import { monthDayGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import {
  constrainIsoDateFields,
  generatePublicIsoDateFields,
  isoDateSlotRefiners,
} from './isoFields'
import { formatIsoMonthDayFields, formatPossibleDate } from './isoFormat'
import { compareIsoFields, isoEpochFirstLeapYear } from './isoMath'
import { stringToMonthDayInternals } from './isoParse'
import { optionsToOverflow } from './options'
import { isIdPropsEqual, mapRefiners } from './util'

export const [
  PlainMonthDay,
  createPlainMonthDay,
  toPlainMonthDayInternals,
] = createTemporalClass(
  'PlainMonthDay',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoMonth, isoDay, calendarArg = isoCalendarId, referenceIsoYear = isoEpochFirstLeapYear) => {
    return constrainIsoDateFields(
      mapRefiners({
        isoYear: referenceIsoYear,
        isoMonth,
        isoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },

  // internalsConversionMap
  {},

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
        isIdPropsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatPossibleDate(internals, options, formatIsoMonthDayFields)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return plainMonthDayToPlainDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },
)
