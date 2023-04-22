import {
  getCommonCalendar,
  isoCalendarId,
  moveDate,
  toCalendarSlot,
} from './calendarAdapter'
import { dateGetters } from './calendarFields'
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
import {
  compareIsoFields,
  isoDateSlotRefiners,
  isoTimeFieldDefaults,
  pluckIsoDateSlots,
  regulateIsoDateFields,
} from './isoFields'
import { optionsToOverflow } from './options'
import { stringToPlainDateInternals } from './parse'
import { createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { createTemporalClass, neverValueOf } from './temporalClass'

export const [
  PlainDate,
  createPlainDate,
  toPlainDateInternals,
] = createTemporalClass(
  'PlainDate',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (isoYear, isoMonth, isoDay, calendarArg = isoCalendarId) => {
    return regulateIsoDateFields(
      mapRefiners({
        isoYear,
        isoMonth,
        isoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },
  {
    PlainDateTime: pluckIsoDateSlots,
    ZonedDateTime: zonedDateTimeInternalsToIso,
  },
  bagToPlainDateSlots,
  stringToPlainDateInternals,
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
        calendar: toCalendarSlot(calendarArg),
      })
    },

    add(internals, durationArg, options) {
      return moveDate(
        internals.calendar,
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals, durationArg, options) {
      return moveDate(
        internals.calendar,
        internals,
        negateDurationFields(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals, otherArg, options) {
      const otherInternals = toPlainDateInternals(otherArg)
      const calendar = getCommonCalendar(internals, otherInternals)
      return diffDates(calendar, internals, otherInternals, options, 1)
    },

    since(internals, otherArg, options) {
      const otherInternals = toPlainDateInternals(otherArg)
      const calendar = getCommonCalendar(internals, otherInternals)
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

    getISOFields: pluckIsoDateSlots,
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
