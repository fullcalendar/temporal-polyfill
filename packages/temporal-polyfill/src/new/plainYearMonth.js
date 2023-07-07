import { isoCalendarId } from './calendarConfig'
import { yearMonthGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar } from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertPlainYearMonthToDate,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
} from './convert'
import { diffDates } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { generatePublicIsoDateFields } from './isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { compareIsoDateTimeFields, refineIsoDateInternals } from './isoMath'
import { parsePlainYearMonth } from './isoParse'
import { moveDateByDays } from './move'
import { refineDiffOptions, refineOverflowOptions } from './options'
import { dayIndex, yearIndex } from './units'

export const [
  PlainYearMonth,
  createPlainYearMonth,
  toPlainYearMonthInternals,
] = createTemporalClass(
  'PlainYearMonth',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoYear, isoMonth, calendar = isoCalendarId, referenceIsoDay = 1) => {
    return refineIsoDateInternals({
      isoYear,
      isoMonth,
      isoDay: referenceIsoDay,
      calendar,
    })
  },

  // internalsConversionMap
  {},

  // bagToInternals
  refinePlainYearMonthBag,

  // stringToInternals
  parsePlainYearMonth,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  yearMonthGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainYearMonth(mergePlainYearMonthBag(internals, bag, options))
    },

    add(internals, durationArg, options) {
      return movePlainYearMonth(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals, durationArg, options) {
      return movePlainYearMonth(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals, otherArg, options) {
      return diffPlainYearMonths(internals, toPlainYearMonthInternals(otherArg), options)
    },

    since(internals, otherArg, options) {
      return diffPlainYearMonths(toPlainYearMonthInternals(otherArg), internals, options, true)
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainYearMonthInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString: formatPossibleDate.bind(undefined, formatIsoYearMonthFields),

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return convertPlainYearMonthToDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoDateTimeFields(
        toPlainYearMonthInternals(arg0),
        toPlainYearMonthInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function diffPlainYearMonths(internals0, internals1, options, roundingModeInvert) {
  return createDuration(
    diffDates(
      getCommonCalendarOps(internals0, internals1),
      movePlainYearMonthToDay(internals0),
      movePlainYearMonthToDay(internals1),
      ...refineDiffOptions(roundingModeInvert, options, yearIndex, yearIndex, dayIndex),
    ),
  )
}

function movePlainYearMonth(
  internals,
  durationFields,
  options,
) {
  const { calendar } = internals
  const isoDateFields = movePlainYearMonthToDay(
    internals,
    durationFields.sign < 0
      ? calendar.daysInMonth(internals)
      : 1,
  )

  return createPlainYearMonth(
    calendar.dateAdd(isoDateFields, durationFields, refineOverflowOptions(options)),
  )
}

function movePlainYearMonthToDay(internals, day = 1) {
  return moveDateByDays(
    internals,
    day - internals.calendar.day(internals),
  )
}
