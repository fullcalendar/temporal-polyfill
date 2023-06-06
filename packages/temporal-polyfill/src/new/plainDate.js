import {
  refinePlainDateBag,
  createZonedDateTimeConverter,
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergePlainDateBag,
} from './bag'
import { isoCalendarId } from './calendarConfig'
import { dateGetters } from './calendarFields'
import {
  getCommonCalendarOps,
  getPublicCalendar,
  queryCalendarOps,
} from './calendarOps'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import { diffDates } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import {
  generatePublicIsoDateFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
  refineIsoDateInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateFields } from './isoFormat'
import { compareIsoDateTimeFields } from './isoMath'
import { stringToPlainDateInternals } from './isoParse'
import { optionsToOverflow } from './options'
import { createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { zonedInternalsToIso } from './timeZoneOps'
import { isIdPropsEqual } from './util'

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
  stringToPlainDateInternals,

  // handleUnusedOptions
  optionsToOverflow,

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
        negateDurationFields(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals, otherArg, options) {
      const otherInternals = toPlainDateInternals(otherArg)
      const calendar = getCommonCalendarOps(internals, otherInternals)
      return diffDates(calendar, internals, otherInternals, options, 1)
    },

    since(internals, otherArg, options) {
      const otherInternals = toPlainDateInternals(otherArg)
      const calendar = getCommonCalendarOps(internals, otherInternals)
      return diffDates(calendar, internals, otherInternals, options, -1)
    },

    equals(internals, other) {
      const otherInternals = toPlainDateInternals(other)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isIdPropsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatIsoDateFields(internals) +
        formatCalendar(internals.calendar, options)
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

// move to options file?
function optionalToPlainTimeInternals(timeArg) {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeInternals(timeArg)
}
