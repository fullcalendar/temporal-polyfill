import {
  bagToZonedDateTimeInternals,
  dateToPlainMonthDay,
  dateToPlainYearMonth,
  zonedDateTimeInternalsToIso,
  zonedDateTimeWithBag,
} from './bag'
import { dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import { createTemporalClass, neverValueOf } from './class'
import { diffZonedEpochNanoseconds } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { createInstant } from './instant'
import { resolveZonedFormattable } from './intlFormat'
import {
  getPublicIdOrObj,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
  pluckIsoDateTimeInternals,
  pluckIsoTimeFields,
  validateEpochNano,
} from './isoFields'
import {
  formatCalendar,
  formatIsoDateTimeFields,
  formatOffsetNanoseconds,
  formatTimeZone,
} from './isoFormat'
import { epochGetters, epochNanosecondsToIso, nanosecondsInHour } from './isoMath'
import { stringToZonedDateTimeInternals } from './isoParse'
import { compareLargeInts, toLargeInt } from './largeInt'
import { moveZonedEpochNanoseconds } from './move'
import { optionsToOverflow } from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundIsoDateTimeFields } from './round'
import {
  computeNanosecondsInDay,
  getCommonTimeZoneOps,
  getMatchingInstantFor,
  getPublicTimeZone,
  queryTimeZoneOps,
} from './timeZoneOps'
import { isIdPropsEqual, mapProps } from './util'

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
      epochNanoseconds: validateEpochNano(toLargeInt(epochNanoseconds)), // TODO: strictly BigInt
      timeZone: queryTimeZoneOps(timeZoneArg),
      calendar: queryCalendarOps(calendarArg),
    }
  },

  // internalsConversionMap
  {},

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

    // TODO: make this a getter?
    offsetNanoseconds(internals) {
      // TODO: more DRY
      return zonedDateTimeInternalsToIso(internals).offsetNanoseconds
    },

    offset(internals) {
      return formatOffsetNanoseconds(
        // TODO: more DRY
        zonedDateTimeInternalsToIso(internals).offsetNanoseconds,
      )
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return zonedDateTimeWithBag(this, bag, options)
    },

    withPlainTime(internals, plainTimeArg) {
      const { calendar, timeZone } = internals
      const isoFields = {
        ...zonedDateTimeInternalsToIso(internals),
        ...toPlainTimeInternals(plainTimeArg),
      }

      const epochNano = getMatchingInstantFor(
        timeZone,
        isoFields,
        isoFields.offsetNano,
        false, // hasZ
        undefined, // offsetHandling
        undefined, // disambig
        false, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone,
        calendar,
      })
    },

    // TODO: more DRY with withPlainTime and zonedDateTimeWithBag?
    withPlainDate(internals, plainDateArg) {
      const { calendar, timeZone } = internals
      const isoFields = {
        ...zonedDateTimeInternalsToIso(internals),
        ...toPlainDateInternals(plainDateArg),
      }

      const epochNano = getMatchingInstantFor(
        timeZone,
        isoFields,
        isoFields.offsetNano,
        false, // hasZ
        undefined, // offsetHandling
        undefined, // disambig
        false, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone,
        calendar,
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
        getCommonCalendarOps(internals, otherInternals),
        getCommonTimeZoneOps(internals, otherInternals),
        internals.epochNanoseconds,
        otherInternals.epochNanoseconds,
        options, // TODO: spread out lots of options!!!
      )
    },

    since(internals, otherArg, options) {
      const otherInternals = toZonedDateTimeInternals(otherArg)
      return diffZonedEpochNanoseconds(
        getCommonCalendarOps(internals, otherInternals),
        getCommonTimeZoneOps(internals, otherInternals),
        otherInternals.epochNanoseconds,
        internals.epochNanoseconds,
        options, // TODO: flip rounding options!!!!!
      )
    },

    round(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoDateTimeFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      isoDateTimeFields = roundIsoDateTimeFields(
        isoDateTimeFields,
        options,
        () => computeNanosecondsInDay(timeZone, isoDateTimeFields),
      )
      epochNanoseconds = getMatchingInstantFor(
        isoDateTimeFields,
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

      epochNanoseconds = getMatchingInstantFor(
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
        isIdPropsEqual(internals.calendar, otherInternals.calendar) &&
        isIdPropsEqual(internals.timeZone, otherInternals.timeZone)
    },

    toString(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      // TODO: don't let options be accessed twice! once by rounding, twice by formatting

      let offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoDateTimeFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      isoDateTimeFields = roundIsoDateTimeFields(
        isoDateTimeFields,
        options,
        () => computeNanosecondsInDay(timeZone, isoDateTimeFields),
      )
      epochNanoseconds = getMatchingInstantFor(
        isoDateTimeFields,
        timeZone,
        offsetNanoseconds,
        false, // z
        'prefer', // keep old offsetNanoseconds if possible
        'compatible',
        true, // fuzzy
      )

      offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      isoDateTimeFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      return formatIsoDateTimeFields(isoDateTimeFields, options) +
        formatOffsetNanoseconds(offsetNanoseconds) +
        formatTimeZone(timeZone, options) +
        formatCalendar(calendar, options)
    },

    toLocaleString(internals, locales, options) {
      const [epochMilli, format] = resolveZonedFormattable(internals, locales, options)
      return format.format(epochMilli)
    },

    valueOf: neverValueOf,

    toInstant(internals) {
      return createInstant(internals.epochNanoseconds)
    },

    toPlainDate(internals) {
      return createPlainDate(pluckIsoDateInternals(zonedDateTimeInternalsToIso(internals)))
    },

    toPlainTime(internals) {
      return createPlainTime(pluckIsoTimeFields(zonedDateTimeInternalsToIso(internals)))
    },

    toPlainDateTime(internals) {
      return createPlainDateTime(pluckIsoDateTimeInternals(zonedDateTimeInternalsToIso(internals)))
    },

    toPlainYearMonth() {
      return dateToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return dateToPlainMonthDay(this)
    },

    getISOFields(internals) {
      return {
        // maintain alphabetical order
        calendar: getPublicIdOrObj(internals.calendar),
        ...pluckIsoDateTimeInternals(zonedDateTimeInternalsToIso(internals)),
        offset: formatOffsetNanoseconds(
          // TODO: more DRY
          zonedDateTimeInternalsToIso(internals).offsetNanoseconds,
        ),
        timeZone: getPublicIdOrObj(internals.timeZone),
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
    internals.calendar,
    internals.timeZone,
    internals.epochNanoseconds,
    durationFields,
    overflowHandling,
  )
}
