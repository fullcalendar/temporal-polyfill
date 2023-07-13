import { DateFields, dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergeZonedDateTimeBag,
  refineZonedDateTimeBag,
} from './convert'
import { diffZonedEpochNano } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationFields, negateDurationInternals } from './durationFields'
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
  formatOffsetNano,
  formatTimeZone,
} from './isoFormat'
import {
  checkEpochNano,
  epochGetters,
  epochNanoToIso,
} from './isoMath'
import { parseZonedDateTime } from './isoParse'
import { LargeInt, compareLargeInts } from './largeInt'
import { moveZonedEpochNano } from './move'
import {
  Overflow,
  refineDiffOptions,
  refineOverflowOptions,
  refineRoundOptions,
  refineZonedDateTimeDisplayOptions,
  toEpochNano,
} from './options'
import { createPlainDate, toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime, toPlainTimeInternals } from './plainTime'
import { roundDateTime, roundDateTimeToNano } from './round'
import {
  computeNanosecondsInDay,
  getCommonTimeZoneOps,
  getMatchingInstantFor,
  getPublicTimeZone,
  queryTimeZoneOps,
  zonedInternalsToIso,
} from './timeZoneOps'
import { Unit, nanoInHour } from './units'
import { mapProps } from './utils'

export interface ZonedInternals {
  epochNanoseconds: LargeInt
  timeZone: TimeZoneOps
  calendar: CalendarOps
}

export interface ZonedDateTimeBag extends DateFields {
  timeZone: TimeZoneArg
  calendar?: CalendarArg
}

export type ZonedDateTime = TemporalInstance<ZonedInternals>
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag | string
export const [ZonedDateTime, createZonedDateTime, toZonedInternals] = createTemporalClass(
  'ZonedDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    epochNano: LargeInt,
    timeZoneArg: TimeZoneArg,
    calendarArg: CalendarArg,
  ): ZonedInternals => {
    return {
      epochNanoseconds: checkEpochNano(toEpochNano(epochNano)),
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
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    ...mapProps((getter) => {
      return function(internals: ZonedInternals) {
        return getter(internals.epochNanoseconds)
      }
    }, epochGetters),

    ...mapProps((getter) => {
      return function(internals: ZonedInternals) {
        return getter(zonedInternalsToIso(internals))
      }
    }, dateTimeGetters),

    hoursInDay(internals: ZonedInternals) {
      return computeNanosecondsInDay(
        internals.timeZone,
        zonedInternalsToIso(internals),
      ) / nanoInHour
    },

    // TODO: make this a getter?
    offsetNanoseconds(internals: ZonedInternals): LargeInt {
      // TODO: more DRY
      return zonedInternalsToIso(internals).offsetNanoseconds
    },

    offset(internals): string {
      return formatOffsetNano(
        // TODO: more DRY
        zonedInternalsToIso(internals).offsetNanoseconds,
      )
    },

    timeZoneId(internals): string {
      return internals.timeZone.id
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: ZonedInternals, bag: ZonedBag, options): ZonedDateTime {
      return createZonedDateTime(mergeZonedDateTimeBag(this, bag, options))
    },

    withPlainTime(internals: ZonedInternals, plainTimeArg): ZonedDateTime {
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
    withPlainDate(internals: ZonedInternals, plainDateArg): ZonedDateTime {
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

    withTimeZone(internals: ZonedInternals, timeZoneArg: TimeZoneArg): ZonedDateTime {
      return createZonedDateTime({
        ...internals,
        timeZone: queryTimeZoneOps(timeZoneArg),
      })
    },

    withCalendar(internals: ZonedInternals, calendarArg: CalendarArg): ZonedDateTime {
      return createZonedDateTime({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals: ZonedInternals, durationArg: DurationArg, options): ZonedDateTime {
      return moveZonedDateTime(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals: ZonedInternals, durationArg: DurationArg, options): ZonedDateTime {
      return moveZonedDateTime(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals: ZonedInternals, otherArg, options): Duration {
      return diffZonedDateTimes(internals, toZonedInternals(otherArg), options)
    },

    since(internals: ZonedInternals, otherArg, options): Duration {
      return diffZonedDateTimes(toZonedInternals(otherArg), internals, options, true)
    },

    /*
    Do param-list destructuring here and other methods!
    */
    round(internals: ZonedInternals, options): ZonedDateTime {
      let { epochNanoseconds, timeZone, calendar } = internals

      const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoDateTimeFields = epochNanoToIso(epochNanoseconds.addNumber(offsetNanoseconds))

      isoDateTimeFields = roundDateTime(
        isoDateTimeFields,
        ...refineRoundOptions(options),
        timeZone,
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

    startOfDay(internals: ZonedInternals): ZonedDateTime {
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

    equals(internals: ZonedInternals, otherZonedDateTimeArg): boolean {
      const otherInternals = toZonedInternals(otherZonedDateTimeArg)

      return !compareLargeInts(internals.epochNanoseconds, otherInternals.epochNanoseconds) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar) &&
        isObjIdsEqual(internals.timeZone, otherInternals.timeZone)
    },

    toString(internals: ZonedInternals, options) {
      let { epochNanoseconds, timeZone, calendar } = internals
      const [
        calendarDisplayI,
        timeZoneDisplayI,
        offsetDisplayI,
        nanoInc,
        roundingMode,
        subsecDigits,
      ] = refineZonedDateTimeDisplayOptions(options)

      let offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      let isoDateTimeFields = epochNanoToIso(epochNanoseconds.addNumber(offsetNanoseconds))

      isoDateTimeFields = roundDateTimeToNano(isoDateTimeFields, nanoInc, roundingMode)
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
      isoDateTimeFields = epochNanoToIso(epochNanoseconds.addNumber(offsetNanoseconds))

      return formatIsoDateTimeFields(isoDateTimeFields, subsecDigits) +
        formatOffsetNano(offsetNanoseconds, offsetDisplayI) +
        formatTimeZone(timeZone, timeZoneDisplayI) +
        formatCalendar(calendar, calendarDisplayI)
    },

    toLocaleString(
      internals: ZonedInternals,
      locales: string | string[],
      options
    ): string {
      const [epochMilli, format] = resolveZonedFormattable(internals, locales, options)
      return format.format(epochMilli)
    },

    valueOf: neverValueOf,

    toInstant(internals: ZonedInternals) {
      return createInstant(internals.epochNanoseconds)
    },

    toPlainDate(internals: ZonedInternals) {
      return createPlainDate(pluckIsoDateInternals(zonedInternalsToIso(internals)))
    },

    toPlainTime(internals: ZonedInternals) {
      return createPlainTime(pluckIsoTimeFields(zonedInternalsToIso(internals)))
    },

    toPlainDateTime(internals: ZonedInternals) {
      return createPlainDateTime(pluckIsoDateTimeInternals(zonedInternalsToIso(internals)))
    },

    toPlainYearMonth() {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay() {
      return convertToPlainMonthDay(this)
    },

    getISOFields(internals: ZonedInternals) {
      return {
        ...pluckIsoDateTimeInternals(zonedInternalsToIso(internals)),
        // alphabetical
        calendar: getPublicIdOrObj(internals.calendar),
        offset: formatOffsetNano(
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
    compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg) {
      return compareLargeInts(
        toZonedInternals(arg0).epochNanoseconds,
        toZonedInternals(arg1).epochNanoseconds,
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function moveZonedDateTime(
  internals: ZonedInternals,
  durationFields: DurationFields,
  overflowHandling: Overflow
): ZonedDateTime {
  return createZonedDateTime(
    moveZonedEpochNano(
      internals.calendar,
      internals.timeZone,
      internals.epochNanoseconds,
      durationFields,
      overflowHandling,
    ),
  )
}

function diffZonedDateTimes(
  internals: ZonedInternals,
  otherInternals: ZonedInternals,
  options,
  roundingModeInvert?: boolean
): Duration {
  return createDuration(
    diffZonedEpochNano(
      getCommonCalendarOps(internals, otherInternals),
      getCommonTimeZoneOps(internals, otherInternals),
      internals.epochNanoseconds,
      otherInternals.epochNanoseconds,
      ...refineDiffOptions(roundingModeInvert, options, Unit.Hour),
    ),
  )
}
