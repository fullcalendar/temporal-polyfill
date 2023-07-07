import { isoCalendarId } from './calendarConfig'
import { monthDayGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertPlainMonthDayToDate,
  mergePlainMonthDayBag,
  refinePlainMonthDayBag,
} from './convert'
import { generatePublicIsoDateFields } from './isoFields'
import { formatIsoMonthDayFields, formatPossibleDate } from './isoFormat'
import { compareIsoDateTimeFields, isoEpochFirstLeapYear, refineIsoDateInternals } from './isoMath'
import { parsePlainMonthDay } from './isoParse'
import { refineOverflowOptions } from './options'

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
  refinePlainMonthDayBag,

  // stringToInternals
  parsePlainMonthDay,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  monthDayGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainMonthDay(mergePlainMonthDayBag(this, bag, options))
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainMonthDayInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString: formatPossibleDate.bind(undefined, formatIsoMonthDayFields),

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return convertPlainMonthDayToDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },
)
