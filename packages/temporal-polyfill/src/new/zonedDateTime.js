import { dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergeZonedDateTimeBag,
  refineZonedDateTimeBag,
} from './convert'
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
} from './isoFields'
import {
  formatCalendar,
  formatIsoDateTimeFields,
  formatOffsetNanoseconds,
  formatTimeZone,
} from './isoFormat'
import {
  epochGetters,
  epochNanoToIso,
  nanoInHour,
  validateEpochNano,
} from './isoMath'
import { parseZonedDateTime } from './isoParse'
import { compareLargeInts } from './largeInt'
import { moveZonedEpochNanoseconds } from './move'
import { optionsToOverflow, toEpochNano } from './options'
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
  zonedInternalsToIso,
} from './timeZoneOps'
import { mapProps } from './util'

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
      epochNanoseconds: validateEpochNano(toEpochNano(epochNanoseconds)),
      timeZone: queryTimeZoneOps(timeZoneArg), // TODO: validate string/object somehow?
      calendar: queryCalendarOps(calendarArg),
    }
  },

  // internalsConversionMap
  {},

  // bagToInternals
  refineZonedDateTimeBag,

  // stringToInternals
  parseZonedDateTime,

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
        return getter(zonedInternalsToIso(internals))
      }
    }),

    hoursInDay(internals) {
      return computeNanosecondsInDay(
        internals.timeZone,
        zonedInternalsToIso(internals),
      ) / nanoInHour
    },

    // TODO: make this a getter?
    offsetNanoseconds(internals) {
      // TODO: more DRY
      return zonedInternalsToIso(internals).offsetNanoseconds
    },

    offset(internals) {
      return formatOffsetNanoseconds(
        // TODO: more DRY
        zonedInternalsToIso(internals).offsetNanoseconds,
      )
    },

    timeZoneId(internals) {
      return internals.timeZone.id
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createZonedDateTime(mergeZonedDateTimeBag(this, bag, options))
    },

    withPlainTime(internals, plainTimeArg) {
      const { calendar, timeZone } = internals
      const isoFields = {
        ...zonedInternalsToIso(internals),
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
        ...zonedInternalsToIso(internals),
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
      let isoDateTimeFields = epochNanoToIso(epochNanoseconds.add(offsetNanoseconds))

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
        ...zonedInternalsToIso(internals),
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
        isObjIdsEqual(internals.calendar, otherInternals.calendar) &&
        isObjIdsEqual(internals.timeZone, otherInternals.timeZone)
    },

    toString(internals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals

      // TODO: don't let options be accessed twice! once by rounding, twice by formatting

      let offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoDateTimeFields = epochNanoToIso(epochNanoseconds.add(offsetNanoseconds))

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

      // waa? non-dry code?
      offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      isoDateTimeFields = epochNanoToIso(epochNanoseconds.add(offsetNanoseconds))

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
      return createPlainDate(pluckIsoDateInternals(zonedInternalsToIso(internals)))
    },

    toPlainTime(internals) {
      return createPlainTime(pluckIsoTimeFields(zonedInternalsToIso(internals)))
    },

    toPlainDateTime(internals) {
      return createPlainDateTime(pluckIsoDateTimeInternals(zonedInternalsToIso(internals)))
    },

    toPlainYearMonth() {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return convertToPlainMonthDay(this)
    },

    getISOFields(internals) {
      return {
        // maintain alphabetical order
        calendar: getPublicIdOrObj(internals.calendar),
        ...pluckIsoDateTimeInternals(zonedInternalsToIso(internals)),
        offset: formatOffsetNanoseconds(
          // TODO: more DRY
          zonedInternalsToIso(internals).offsetNanoseconds,
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
