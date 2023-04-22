import { getCommonCalendar, toCalendarSlot } from './calendarAdapter'
import { dateTimeGetters } from './calendarFields'
import {
  bagToZonedDateTimeInternals,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  isStringCastsEqual,
  zonedDateTimeInternalsToIso,
  zonedDateTimeWithBag,
} from './convert'
import { diffZoneEpochNanoseconds } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import {
  formatCalendar,
  formatIsoDateTimeFields,
  formatOffsetNanoseconds,
  formatTimeZone,
} from './format'
import { createInstant } from './instant'
import {
  isoTimeFieldDefaults,
  pluckIsoDateSlots,
  pluckIsoDateTimeSlots,
  pluckIsoTimeFields,
} from './isoFields'
import { compareLargeInts, toLargeInt } from './largeInt'
import { moveZonedDateTimeInternals } from './move'
import { epochGetters, nanosecondsInHour } from './nanoseconds'
import { mapProps } from './obj'
import { optionsToOverflow } from './options'
import { stringToZonedDateTimeInternals } from './parse'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundIsoDateTimeFields } from './round'
import { createTemporalClass, neverValueOf } from './temporalClass'
import {
  computeIsoFieldEpochNanoseconds,
  computeNanosecondsInDay,
  getCommonTimeZone,
  instantToOffsetNanoseconds,
  instantToPlainDateTimeInternals,
  plainDateTimeToEpochNanoseconds,
  toTimeZoneSlot,
  zonedDateTimeInternalsToOffsetNanoseconds,
} from './timeZoneProtocol'

export const [
  ZonedDateTime,
  createZonedDateTime,
  toZonedDateTimeInternals,
] = createTemporalClass(
  'ZonedDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (epochNanoseconds, timeZoneArg, calendarArg) => {
    return {
      epochNanoseconds: toLargeInt(epochNanoseconds), // TODO: stricter
      timeZone: toTimeZoneSlot(timeZoneArg),
      calendar: toCalendarSlot(calendarArg),
    }
  },
  {},
  bagToZonedDateTimeInternals,
  stringToZonedDateTimeInternals,
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    ...mapProps(epochGetters, (getter) => {
      return function(internals) {
        return getter(internals.epochNanoseconds)
      }
    }),

    ...mapProps(dateTimeGetters, (getter) => {
      return function(internals) {
        return getter(zonedDateTimeInternalsToIso(internals))
      }
    }),

    hoursInDay(internals) {
      return computeNanosecondsInDay(internals.epochNanoseconds, internals.timeZone) /
        nanosecondsInHour
    },

    offsetNanoseconds(internals) {
      return zonedDateTimeInternalsToOffsetNanoseconds(internals)
    },

    offset(internals) {
      return formatOffsetNanoseconds(zonedDateTimeInternalsToOffsetNanoseconds(internals))
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return zonedDateTimeWithBag(this, bag, options)
    },

    withPlainTime(internals, plainTimeArg) {
      const { timeZone } = internals
      const epochNanoseconds = plainDateTimeToEpochNanoseconds(
        timeZone,
        createPlainDateTime({
          ...zonedDateTimeInternalsToIso(internals),
          ...toPlainTimeInternals(plainTimeArg),
        }),
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar: internals.calendar,
      })
    },

    withPlainDate(internals, plainDateArg) {
      const { timeZone } = internals
      const epochNanoseconds = plainDateTimeToEpochNanoseconds(
        timeZone,
        createPlainDateTime({
          ...zonedDateTimeInternalsToIso(internals),
          ...toPlainDateInternals(plainDateArg),
          // calendar doesn't matter
        }),
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar: internals.calendar,
      })
    },

    withTimeZone(internals, timeZoneArg) {
      return createZonedDateTime({
        ...internals,
        timeZone: toTimeZoneSlot(timeZoneArg),
      })
    },

    withCalendar(internals, calendarArg) {
      return createZonedDateTime({
        ...internals,
        calendar: toCalendarSlot(calendarArg),
      })
    },

    add(internals, durationArg, options) {
      return createZonedDateTime(
        moveZonedDateTimeInternals(
          internals,
          toDurationInternals(durationArg),
          options,
        ),
      )
    },

    subtract(internals, durationArg, options) {
      return createZonedDateTime(
        moveZonedDateTimeInternals(
          internals,
          negateDurationFields(toDurationInternals(durationArg)),
          options,
        ),
      )
    },

    until(internals, otherArg, options) {
      const otherInternals = toZonedDateTimeInternals(otherArg)
      return diffZoneEpochNanoseconds(
        internals.epochNanoseconds,
        otherInternals.epochNanoseconds,
        getCommonTimeZone(internals, otherInternals),
        getCommonCalendar(internals, otherInternals),
        options, // TODO: spread out lots of options!!!
      )
    },

    since(internals, otherArg, options) {
      const otherInternals = toZonedDateTimeInternals(otherArg)
      return diffZoneEpochNanoseconds(
        otherInternals.epochNanoseconds,
        internals.epochNanoseconds,
        getCommonTimeZone(internals, otherInternals),
        getCommonCalendar(internals, otherInternals),
        options, // TODO: flip rounding options!!!!!
      )
    },

    round(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      const instant = createInstant(epochNanoseconds)
      const offsetNanoseconds = instantToOffsetNanoseconds(timeZone, instant)
      let isoFields = instantToPlainDateTimeInternals(timeZone, calendar, instant)
      isoFields = roundIsoDateTimeFields(
        isoFields,
        options,
        () => computeNanosecondsInDay(isoFields, timeZone),
      )
      epochNanoseconds = computeIsoFieldEpochNanoseconds(
        isoFields,
        timeZone,
        offsetNanoseconds,
        false, // z
        'prefer', // keep old offsetNanoseconds if possible
        'compatible',
        true, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar,
      })
    },

    startOfDay(internals) {
      let { epochNanoseconds, timeZone, calendar } = internals

      const isoFields = {
        ...zonedDateTimeInternalsToIso(internals),
        ...isoTimeFieldDefaults,
      }

      epochNanoseconds = computeIsoFieldEpochNanoseconds(
        isoFields,
        timeZone,
        undefined, // offsetNanoseconds
        false, // z
        'reject',
        'compatible',
        true, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar,
      })
    },

    equals(internals, otherZonedDateTimeArg) {
      const otherInternals = toZonedDateTimeInternals(otherZonedDateTimeArg)

      return !compareLargeInts(internals.epochNanoseconds, otherInternals.epochNanoseconds) &&
        isStringCastsEqual(internals.calendar, otherInternals.calendar) &&
        isStringCastsEqual(internals.timeZone, otherInternals.timeZone)
    },

    toString(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      // TODO: don't let options be accessed twice! once by rounding, twice by formatting

      let instant = createInstant(epochNanoseconds)
      let offsetNanoseconds = instantToOffsetNanoseconds(timeZone, instant)
      let isoFields = instantToPlainDateTimeInternals(timeZone, calendar, instant)
      isoFields = roundIsoDateTimeFields(
        isoFields,
        options,
        () => computeNanosecondsInDay(isoFields, timeZone),
      )
      epochNanoseconds = computeIsoFieldEpochNanoseconds(
        isoFields,
        timeZone,
        offsetNanoseconds,
        false, // z
        'prefer', // keep old offsetNanoseconds if possible
        'compatible',
        true, // fuzzy
      )
      instant = createInstant(epochNanoseconds)
      offsetNanoseconds = instantToOffsetNanoseconds(timeZone, instant)
      isoFields = instantToPlainDateTimeInternals(timeZone, calendar, instant)

      return formatIsoDateTimeFields(isoFields, options) +
        formatOffsetNanoseconds(offsetNanoseconds) +
        formatTimeZone(timeZone, options) +
        formatCalendar(calendar, options)
    },

    toLocaleString(internals, locales, options) {
      return ''
    },

    valueOf: neverValueOf,

    toInstant(internals) {
      return createInstant(internals.epochNanoseconds)
    },

    toPlainDate(internals) {
      return createPlainDate(pluckIsoDateSlots(zonedDateTimeInternalsToIso(internals)))
    },

    toPlainTime(internals) {
      return createPlainTime(pluckIsoTimeFields(zonedDateTimeInternalsToIso(internals)))
    },

    toPlainDateTime(internals) {
      return createPlainDateTime(zonedDateTimeInternalsToIso(internals))
    },

    toPlainYearMonth() {
      return dateToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return dateToPlainMonthDay(this)
    },

    getISOFields(internals) {
      const { timeZone, calendar } = internals

      return {
        // maintain alphabetical order
        calendar,
        ...pluckIsoDateTimeSlots(zonedDateTimeInternalsToIso(internals)),
        offset: formatOffsetNanoseconds(zonedDateTimeInternalsToOffsetNanoseconds(internals)),
        timeZone: String(timeZone),
      }
    },
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareLargeInts(
        toZonedDateTimeInternals(arg0).epochNanoseconds,
        toZonedDateTimeInternals(arg1).epochNanoseconds,
      )
    },
  },
)
