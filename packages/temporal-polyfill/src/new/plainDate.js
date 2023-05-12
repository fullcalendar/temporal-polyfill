import { isoCalendarId } from './calendarConfig'
import { dateGetters } from './calendarFields'
import {
  getCommonCalendarOps,
  getPublicCalendar,
  queryCalendarOps,
} from './calendarOps'
import {
  bagToPlainDateSlots,
  createZonedDateTimeConverter,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  isStringCastsEqual,
  mapRefiners,
  plainDateWithBag,
  zonedDateTimeInternalsToIso,
} from './convert'
import { diffDates } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { formatCalendar, formatIsoDateFields } from './format'
import { neverValueOf } from './internalClass'
import {
  compareIsoFields,
  constrainIsoDateFields,
  generatePublicIsoDateFields,
  isoDateSlotRefiners,
  isoTimeFieldDefaults,
  pluckIsoDateSlots,
} from './isoFields'
import { optionsToOverflow } from './options'
import { stringToPlainDateInternals } from './parse'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { createTemporalClass } from './temporalClass'
import { ZonedDateTime } from './zonedDateTime'

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
      }, isoDateSlotRefiners),
    )
  },

  // massageOtherInternals
  (arg, argInternals) => {
    if (arg instanceof PlainDateTime) {
      return pluckIsoDateSlots(argInternals)
    }
    if (arg instanceof ZonedDateTime) {
      return zonedDateTimeInternalsToIso(argInternals)
    }
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
        isStringCastsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatIsoDateFields(internals) +
        formatCalendar(internals.calendar, options)
    },

    toLocaleString(internals, locales, options) {
      return ''
    },

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

function optionalToPlainTimeInternals(timeArg) {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeInternals(timeArg)
}
