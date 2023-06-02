import {
  bagToPlainDateSlots,
  createZonedDateTimeConverter,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  plainDateWithBag,
  zonedDateTimeInternalsToIso,
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
  isoDateInternalRefiners,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateFields } from './isoFormat'
import { compareIsoFields } from './isoMath'
import { stringToPlainDateInternals } from './isoParse'
import { constrainIsoDateFields, optionsToOverflow } from './options'
import { createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { isIdPropsEqual, mapRefiners } from './util'

export const [
  PlainDate,
  createPlainDate,
  toPlainDateInternals,
] = createTemporalClass(
  'PlainDate',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoYear, isoMonth, isoDay, calendarArg = isoCalendarId) => {
    return constrainIsoDateFields(
      mapRefiners({
        isoYear,
        isoMonth,
        isoDay,
        calendar: calendarArg,
      }, isoDateInternalRefiners),
    )
  },

  // internalsConversionMap
  {
    PlainDateTime: pluckIsoDateInternals,
    ZonedDateTime(argInternals) {
      return pluckIsoDateInternals(zonedDateTimeInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  bagToPlainDateSlots,

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
      return createPlainDate(plainDateWithBag(this, bag, options))
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
      return !compareIsoFields(internals, otherInternals) &&
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
      return dateToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return dateToPlainMonthDay(this)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoFields(
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
