import {
  bagToPlainMonthDayInternals,
  plainMonthDayToPlainDate,
  plainMonthDayWithBag,
} from './bag'
import { isoCalendarId } from './calendarConfig'
import { monthDayGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import { generatePublicIsoDateFields, refineIsoDateInternals } from './isoFields'
import { formatIsoMonthDayFields, formatPossibleDate } from './isoFormat'
import { compareIsoDateTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { stringToMonthDayInternals } from './isoParse'
import { optionsToOverflow } from './options'
import { isIdPropsEqual } from './util'

export const [
  PlainMonthDay,
  createPlainMonthDay,
  toPlainMonthDayInternals,
] = createTemporalClass(
  'PlainMonthDay',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoMonth, isoDay, calendar = isoCalendarId, referenceIsoYear = isoEpochFirstLeapYear) => {
    return refineIsoDateInternals({
      isoYear: referenceIsoYear,
      isoMonth,
      isoDay,
      calendar,
    })
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
      return !compareIsoDateTimeFields(internals, otherInternals) &&
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
