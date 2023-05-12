import { dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import {
  bagToZonedDateTimeInternals,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  isStringCastsEqual,
  zonedDateTimeInternalsToIso,
  zonedDateTimeWithBag,
} from './convert'
import { diffZonedEpochNanoseconds } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import {
  formatCalendar,
  formatIsoDateTimeFields,
  formatOffsetNanoseconds,
  formatTimeZone,
} from './format'
import { createInstant } from './instant'
import { neverValueOf } from './internalClass'
import {
  isoTimeFieldDefaults,
  pluckIsoDateSlots,
  pluckIsoDateTimeSlots,
  pluckIsoTimeFields,
} from './isoFields'
import { noop } from './lang'
import { compareLargeInts, toLargeInt } from './largeInt'
import { moveZonedEpochNanoseconds } from './move'
import { epochGetters, nanosecondsInHour } from './nanoseconds'
import { mapProps } from './obj'
import { optionsToOverflow } from './options'
import { stringToZonedDateTimeInternals } from './parse'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundIsoDateTimeFields } from './round'
import { createTemporalClass } from './temporalClass'
import {
  computeIsoFieldEpochNanoseconds,
  computeNanosecondsInDay,
  getBestInstantFor,
  getCommonTimeZoneOps,
  getPublicTimeZone,
  queryTimeZoneOps,
} from './timeZoneOps'

export const [
  ZonedDateTime,
  createZonedDateTime,
  toZonedDateTimeInternals,
] = createTemporalClass(
  'ZonedDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (epochNanoseconds, timeZoneArg, calendarArg) => {
    return {
      epochNanoseconds: toLargeInt(epochNanoseconds), // TODO: stricter
      timeZone: queryTimeZoneOps(timeZoneArg),
      calendar: queryCalendarOps(calendarArg),
    }
  },

  // massageOtherInternals
  noop,

  // bagToInternals
  bagToZonedDateTimeInternals,

  // stringToInternals
  stringToZonedDateTimeInternals,

  // handleUnusedOptions
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
      return computeNanosecondsInDay(
        internals.timeZone,
        zonedDateTimeInternalsToIso(internals),
      ) / nanosecondsInHour
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
      const epochNanoseconds = getBestInstantFor(
        timeZone,
        {
          ...zonedDateTimeInternalsToIso(internals),
          ...toPlainTimeInternals(plainTimeArg),
        },
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar: internals.calendar,
      })
    },

    withPlainDate(internals, plainDateArg) {
      const { timeZone } = internals
      const epochNanoseconds = getBestInstantFor(
        timeZone,
        {
          ...zonedDateTimeInternalsToIso(internals),
          ...toPlainDateInternals(plainDateArg),
        },
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
        timeZone: queryTimeZoneOps(timeZoneArg),
      })
    },

    withCalendar(internals, calendarArg) {
      return createZonedDateTime({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
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
      return diffZonedEpochNanoseconds(
        internals.epochNanoseconds,
        otherInternals.epochNanoseconds,
        getCommonTimeZoneOps(internals, otherInternals),
        getCommonCalendarOps(internals, otherInternals),
        options, // TODO: spread out lots of options!!!
      )
    },

    since(internals, otherArg, options) {
      const otherInternals = toZonedDateTimeInternals(otherArg)
      return diffZonedEpochNanoseconds(
        otherInternals.epochNanoseconds,
        internals.epochNanoseconds,
        getCommonTimeZoneOps(internals, otherInternals),
        getCommonCalendarOps(internals, otherInternals),
        options, // TODO: flip rounding options!!!!!
      )
    },

    round(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      isoFields = roundIsoDateTimeFields(
        isoFields,
        options,
        () => computeNanosecondsInDay(timeZone, isoFields),
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

      let offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      isoFields = roundIsoDateTimeFields(
        isoFields,
        options,
        () => computeNanosecondsInDay(timeZone, isoFields),
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

      offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      isoFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

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
        calendar: calendar.id, // correct?
        ...pluckIsoDateTimeSlots(zonedDateTimeInternalsToIso(internals)),
        offset: formatOffsetNanoseconds(zonedDateTimeInternalsToOffsetNanoseconds(internals)),
        timeZone: timeZone.id, // correct?
      }
    },

    getCalendar: getPublicCalendar,
    getTimeZone: getPublicTimeZone,
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

// Utils
// -------------------------------------------------------------------------------------------------

function moveZonedDateTimeInternals(internals, durationFields, overflowHandling) {
  return moveZonedEpochNanoseconds(
    internals.epochNanoseconds,
    durationFields,
    internals.calendar,
    internals.timeZone,
    overflowHandling,
  )
}

function zonedDateTimeInternalsToOffsetNanoseconds(internals) {
  return internals.timeZone // TimeZoneOps
    .getOffsetNanosecondsFor(internals.epochNanoseconds)
}

function epochNanosecondsToIso() {
}
