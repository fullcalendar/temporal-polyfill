import {
  bagToPlainDateTimeInternals,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  plainDateTimeWithBag,
  zonedDateTimeInternalsToIso,
} from './bag'
import { isoCalendarId } from './calendarConfig'
import { dateTimeGetters } from './calendarFields'
import { getPublicCalendar, queryCalendarOps } from './calendarOps'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import { diffDateTimes } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import {
  constrainIsoDateTimeFields,
  generatePublicIsoDateTimeFields,
  isoDateTimeSlotRefiners,
  isoTimeFieldDefaults,
  pluckIsoDateSlots,
  pluckIsoDateTimeSlots,
  pluckIsoTimeFields,
} from './isoFields'
import { formatCalendar, formatIsoDateTimeFields } from './isoFormat'
import { compareIsoFields } from './isoMath'
import { stringToPlainDateTimeInternals } from './isoParse'
import { moveDateTime } from './move'
import { optionsToOverflow, toDisambiguation, validateRoundingOptions } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundIsoDateTimeFields } from './round'
import { getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { isIdPropsEqual, mapRefiners } from './util'
import { createZonedDateTime } from './zonedDateTime'

export const [
  PlainDateTime,
  createPlainDateTime,
  toPlainDateTimeInternals,
] = createTemporalClass(
  'PlainDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoYear,
    isoMonth,
    isoDay,
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    isoMicrosecond = 0,
    isoNanosecond = 0,
    calendarArg = isoCalendarId,
  ) => {
    return constrainIsoDateTimeFields(
      mapRefiners({
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
        calendar: queryCalendarOps(calendarArg),
      }, isoDateTimeSlotRefiners),
    )
  },

  // internalsConversionMap
  {
    PlainDate: (argInternals) => ({ ...argInternals, ...isoTimeFieldDefaults }),
    ZonedDateTime: (argInternals) => {
      return pluckIsoDateTimeSlots(zonedDateTimeInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  bagToPlainDateTimeInternals,

  // stringToInternals
  stringToPlainDateTimeInternals,

  // handleUnusedOptions
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  dateTimeGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainDateTime(plainDateTimeWithBag(this, bag, options))
    },

    withPlainTime(internals, plainTimeArg) {
      return createPlainDateTime({
        ...internals,
        ...toPlainTimeInternals(plainTimeArg),
      })
    },

    withPlainDate(internals, plainDateArg) {
      return createPlainDateTime({
        ...internals,
        ...toPlainDateInternals(plainDateArg),
      })
    },

    withCalendar(internals, calendarArg) {
      return createPlainDateTime({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals, durationArg, options) {
      return createPlainDateTime(
        moveDateTime(
          internals.calendar,
          internals,
          toDurationInternals(durationArg),
          optionsToOverflow(options),
        ),
      )
    },

    subtract(internals, durationArg, options) {
      return createPlainDateTime(
        moveDateTime(
          internals.calendar,
          internals,
          negateDurationFields(toDurationInternals(durationArg)),
          optionsToOverflow(options),
        ),
      )
    },

    until(internals, otherArg, options) {
      return diffDateTimes(
        // TODO: give calendar arg
        internals,
        toPlainDateTimeInternals(otherArg),
        options, // TODO: spread out lots of options!!!
      )
    },

    since(internals, otherArg, options) {
      return diffDateTimes(
        // TODO: give calendar arg
        toPlainDateTimeInternals(otherArg),
        internals,
        options, // TODO: flip rounding options
      )
    },

    round(internals, options) {
      const isoFields = roundIsoDateTimeFields(internals, validateRoundingOptions(options))

      return createPlainDateTime({
        ...isoFields,
        calendar: internals.calendar,
      })
    },

    equals(internals, other) {
      const otherInternals = toPlainDateTimeInternals(other)
      return !compareIsoFields(internals, otherInternals) &&
        isIdPropsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      // TODO: don't let options (smallestUnit/fractionalWhatever) be access twice!!!
      return formatIsoDateTimeFields(roundIsoDateTimeFields(internals, options), options) +
        formatCalendar(internals.calendar, options)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime(
      internals,
      timeZoneArg,
      options, // { disambiguation } - optional
    ) {
      const { calendar } = internals
      const timeZone = queryTimeZoneOps(timeZoneArg)
      const epochNanoseconds = getSingleInstantFor(timeZone, internals, toDisambiguation(options))

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar,
      })
    },

    toPlainDate(internals) {
      return createPlainDate(pluckIsoDateSlots(internals))
    },

    toPlainYearMonth() {
      return dateToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return dateToPlainMonthDay(this)
    },

    toPlainTime(internals) {
      return createPlainTime(pluckIsoTimeFields(internals))
    },

    getISOFields: generatePublicIsoDateTimeFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoFields(
        toPlainDateTimeInternals(arg0),
        toPlainDateTimeInternals(arg1),
      )
    },
  },
)
