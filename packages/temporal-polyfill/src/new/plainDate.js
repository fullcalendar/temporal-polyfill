import { isoCalendarId } from './calendarConfig'
import { dateGetters } from './calendarFields'
import {
  getCommonCalendarOps,
  getPublicCalendar,
  queryCalendarOps,
} from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  createZonedDateTimeConverter,
  mergePlainDateBag,
  refinePlainDateBag,
} from './convert'
import { diffDates } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  generatePublicIsoDateFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
  refineIsoDateInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateFields } from './isoFormat'
import { compareIsoDateTimeFields } from './isoMath'
import { parsePlainDate } from './isoParse'
import { refineDateDisplayOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { zonedInternalsToIso } from './timeZoneOps'
import { dayIndex, yearIndex } from './units'

export const [
  PlainDate,
  createPlainDate,
  toPlainDateInternals,
] = createTemporalClass(
  'PlainDate',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoYear, isoMonth, isoDay, calendar = isoCalendarId) => {
    return refineIsoDateInternals({
      isoYear,
      isoMonth,
      isoDay,
      calendar,
    })
  },

  // internalsConversionMap
  {
    PlainDateTime: pluckIsoDateInternals,
    ZonedDateTime(argInternals) {
      return pluckIsoDateInternals(zonedInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  refinePlainDateBag,

  // stringToInternals
  parsePlainDate,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  dateGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainDate(mergePlainDateBag(this, bag, options))
    },

    withCalendar(internals, calendarArg) {
      return createPlainDate({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals, durationArg, options) {
      return internals.calendar.dateAdd(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals, durationArg, options) {
      return internals.calendar.dateAdd(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals, otherArg, options) {
      return diffPlainDates(internals, toPlainDateInternals(otherArg), options)
    },

    since(internals, otherArg, options) {
      return diffPlainDates(toPlainDateInternals(otherArg), internals, options, true)
    },

    equals(internals, other) {
      const otherInternals = toPlainDateInternals(other)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatIsoDateFields(internals) +
        formatCalendar(internals.calendar, refineDateDisplayOptions(options))
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options) => {
      return optionalToPlainTimeInternals(options.time)
    }),

    toPlainDateTime(internals, timeArg) {
      return createPlainDateTime({
        ...internals,
        ...optionalToPlainTimeInternals(timeArg),
      })
    },

    toPlainYearMonth() {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return convertToPlainMonthDay(this)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoDateTimeFields(
        toPlainDateInternals(arg0),
        toPlainDateInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function diffPlainDates(internals0, internals1, options, roundingModeInvert) {
  return createDuration(
    diffDates(
      getCommonCalendarOps(internals0, internals1),
      internals0,
      internals1,
      ...refineDiffOptions(roundingModeInvert, options, dayIndex, yearIndex, dayIndex),
    ),
  )
}

function optionalToPlainTimeInternals(timeArg) {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeInternals(timeArg)
}
