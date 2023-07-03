import { isoCalendarId } from './calendarConfig'
import { dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergePlainDateTimeBag,
  refinePlainDateTimeBag,
} from './convert'
import { diffDateTimes } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  generatePublicIsoDateTimeFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
  pluckIsoDateTimeInternals,
  pluckIsoTimeFields,
  refineIsoDateTimeInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateTimeFields } from './isoFormat'
import { compareIsoDateTimeFields } from './isoMath'
import { parsePlainDateTime } from './isoParse'
import { moveDateTime } from './move'
import {
  refineDateTimeDisplayOptions,
  refineDiffOptions,
  refineEpochDisambigOptions,
  refineOverflowOptions,
  refineRoundOptions,
} from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundDateTime, roundDateTimeToNano } from './round'
import { getSingleInstantFor, queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { dayIndex } from './units'
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
    calendar = isoCalendarId,
  ) => {
    return refineIsoDateTimeInternals({
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      isoMicrosecond,
      isoNanosecond,
      calendar,
    })
  },

  // internalsConversionMap
  {
    PlainDate: (argInternals) => ({ ...argInternals, ...isoTimeFieldDefaults }),
    ZonedDateTime: (argInternals) => {
      return pluckIsoDateTimeInternals(zonedInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  refinePlainDateTimeBag,

  // stringToInternals
  parsePlainDateTime,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  dateTimeGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainDateTime(mergePlainDateTimeBag(this, bag, options))
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
      return movePlainDateTime(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals, durationArg, options) {
      return movePlainDateTime(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals, otherArg, options) {
      return diffPlainDateTimes(internals, toPlainDateTimeInternals(otherArg), options)
    },

    since(internals, otherArg, options) {
      return diffPlainDateTimes(toPlainDateTimeInternals(otherArg), internals, options, true)
    },

    round(internals, options) {
      const isoDateTimeFields = roundDateTime(
        internals,
        ...refineRoundOptions(options),
      )

      return createPlainDateTime({
        ...isoDateTimeFields,
        calendar: internals.calendar,
      })
    },

    equals(internals, other) {
      const otherInternals = toPlainDateTimeInternals(other)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      const [
        calendarDisplayI,
        nanoInc,
        roundingMode,
        subsecDigits,
      ] = refineDateTimeDisplayOptions(options)

      const roundedIsoFields = roundDateTimeToNano(internals, nanoInc, roundingMode)

      return formatIsoDateTimeFields(roundedIsoFields, subsecDigits) +
        formatCalendar(internals.calendar, calendarDisplayI)
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
      const epochDisambig = refineEpochDisambigOptions(options)
      const epochNanoseconds = getSingleInstantFor(timeZone, internals, epochDisambig)

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar,
      })
    },

    toPlainDate(internals) {
      return createPlainDate(pluckIsoDateInternals(internals))
    },

    toPlainYearMonth() {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return convertToPlainMonthDay(this)
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
      return compareIsoDateTimeFields(
        toPlainDateTimeInternals(arg0),
        toPlainDateTimeInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function movePlainDateTime(internals, durationInternals, options) {
  return createPlainDateTime(
    moveDateTime(
      internals.calendar,
      internals,
      durationInternals,
      refineOverflowOptions(options),
    ),
  )
}

function diffPlainDateTimes(internals0, internals1, options, roundingModeInvert) {
  return createDuration(
    diffDateTimes(
      getCommonCalendarOps(internals0, internals1),
      internals0,
      internals1,
      ...refineDiffOptions(roundingModeInvert, options, dayIndex),
    ),
  )
}
