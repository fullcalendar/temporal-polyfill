import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { dateTimeGetters } from './calendarFields'
import { queryCalendarOps } from './calendarOpsQuery'
import { CalendarOps } from './calendarOps'
import { getPublicCalendar } from './calendarPublic'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergeZonedDateTimeBag,
  refineZonedDateTimeBag,
} from './convert'
import { diffZonedDateTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { Instant, createInstant } from './instant'
import { LocalesArg, toLocaleStringMethod } from './intlFormat'
import {
  IsoTimeFields,
  isoTimeFieldDefaults,
  pluckIsoTimeFields,
} from './isoFields'
import {
  CalendarPublic,
  IsoDateTimePublic,
  getPublicIdOrObj, pluckIsoDateInternals,
  pluckIsoDateTimeInternals
} from './isoInternals'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
} from './isoFormat'
import {
  checkEpochNanoInBounds,
  epochGetters,
} from './isoMath'
import { isZonedDateTimesEqual } from './equality'
import { parseZonedDateTime } from './isoParse'
import { moveZonedDateTime } from './move'
import {
  DiffOptions,
  EpochDisambig,
  OffsetDisambig,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './options'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainDateTime, PlainDateTimeBag, PlainDateTimeMod, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime, toPlainTimeFields } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { roundZonedDateTime } from './round'
import { TimeZoneArg, TimeZoneProtocol } from './timeZone'
import {
  TimeZoneOps,
  computeNanosecondsInDay,
  getMatchingInstantFor,
  getPublicTimeZone,
  queryTimeZoneOps,
  zonedInternalsToIso,
} from './timeZoneOps'
import { UnitName, nanoInHour } from './units'
import { NumSign, mapProps } from './utils'
import { DayTimeNano, bigIntToDayTimeNano, compareDayTimeNanos } from './dayTimeNano'
import { toBigInt } from './cast'

export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag | string
export type ZonedDateTimeBag = PlainDateTimeBag & { timeZone: TimeZoneArg, offset?: string }
export type ZonedDateTimeMod = PlainDateTimeMod

// TODO: make DRY with TimeZoneArg (it's a subset)
export type TimeZonePublic = TimeZoneProtocol | string
export type ZonedPublic = IsoDateTimePublic & { timeZone: TimeZonePublic, offset: string }

export interface ZonedInternals {
  epochNanoseconds: DayTimeNano
  timeZone: TimeZoneOps
  calendar: CalendarOps
}

export type ZonedDateTime = TemporalInstance<ZonedInternals>
export const [
  ZonedDateTime,
  createZonedDateTime,
  toZonedInternals
] = createTemporalClass(
  'ZonedDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    epochNano: bigint,
    timeZoneArg: TimeZoneArg,
    calendarArg: CalendarArg = isoCalendarId,
  ): ZonedInternals => {
    return {
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
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
  refineZonedFieldOptions,

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

    hoursInDay(internals: ZonedInternals): number {
      return computeNanosecondsInDay(
        internals.timeZone,
        zonedInternalsToIso(internals),
      ) / nanoInHour
    },

    offsetNanoseconds(internals: ZonedInternals): number {
      // TODO: more DRY
      return zonedInternalsToIso(internals).offsetNanoseconds
    },

    offset(internals: ZonedInternals): string {
      return formatOffsetNano(
        // TODO: more DRY
        zonedInternalsToIso(internals).offsetNanoseconds,
      )
    },

    timeZoneId(internals: ZonedInternals): string {
      return internals.timeZone.id
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: ZonedInternals, mod: ZonedDateTimeMod, options): ZonedDateTime {
      return createZonedDateTime(mergeZonedDateTimeBag(this, mod, options))
    },

    withPlainTime(internals: ZonedInternals, plainTimeArg?: PlainTimeArg): ZonedDateTime {
      const { calendar, timeZone } = internals
      const isoFields = {
        ...zonedInternalsToIso(internals),
        ...optionalToPlainTimeFields(plainTimeArg),
      }

      const epochNano = getMatchingInstantFor(
        timeZone,
        isoFields,
        isoFields.offsetNanoseconds,
        false, // hasZ
        OffsetDisambig.Prefer, // OffsetDisambig
        undefined, // EpochDisambig
        false, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone,
        calendar,
      })
    },

    // TODO: more DRY with withPlainTime and zonedDateTimeWithBag?
    withPlainDate(internals: ZonedInternals, plainDateArg: PlainDateArg): ZonedDateTime {
      const { timeZone } = internals
      const plainDateInternals = toPlainDateInternals(plainDateArg)

      const isoFields = {
        ...zonedInternalsToIso(internals),
        ...plainDateInternals,
      }

      const epochNano = getMatchingInstantFor(
        timeZone,
        isoFields,
        isoFields.offsetNanoseconds,
        false, // hasZ
        OffsetDisambig.Prefer, // OffsetDisambig
        undefined, // EpochDisambig
        false, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone,
        // TODO: more DRY with other datetime types
        calendar: getPreferredCalendar(plainDateInternals.calendar, internals.calendar),
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

    add(internals: ZonedInternals, durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          internals,
          toDurationInternals(durationArg),
          refineOverflowOptions(options),
        ),
      )
    },

    subtract(internals: ZonedInternals, durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          internals,
          negateDurationInternals(toDurationInternals(durationArg)),
          refineOverflowOptions(options),
        ),
      )
    },

    until(internals: ZonedInternals, otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffZonedDateTimes(internals, toZonedInternals(otherArg), options)
      )
    },

    since(internals: ZonedInternals, otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffZonedDateTimes(internals, toZonedInternals(otherArg), options, true)
      )
    },

    /*
    Do param-list destructuring here and other methods!
    */
    round(internals: ZonedInternals, options: RoundingOptions | UnitName): ZonedDateTime {
      return createZonedDateTime(
        roundZonedDateTime(internals, options)
      )
    },

    startOfDay(internals: ZonedInternals): ZonedDateTime {
      let { epochNanoseconds, timeZone, calendar } = internals

      const isoFields = {
        ...zonedInternalsToIso(internals),
        ...isoTimeFieldDefaults,
      }

      epochNanoseconds = getMatchingInstantFor(
        timeZone,
        isoFields,
        undefined, // offsetNanoseconds
        false, // z
        OffsetDisambig.Reject,
        EpochDisambig.Compat,
        true, // fuzzy
      )

      return createZonedDateTime({
        epochNanoseconds,
        timeZone,
        calendar,
      })
    },

    equals(internals: ZonedInternals, otherArg: ZonedDateTimeArg): boolean {
      return isZonedDateTimesEqual(internals, toZonedInternals(otherArg))
    },

    /*
    TODO: more DRY with Instant::toString
    */
    toString(internals: ZonedInternals, options?: ZonedDateTimeDisplayOptions): string {
      return formatZonedDateTimeIso(internals, options)
    },

    toLocaleString(this: ZonedDateTime, internals: ZonedInternals, locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
      // Copy options so accessing doesn't cause side-effects
      // TODO: stop this from happening twice, in toLocaleStringMethod too
      options = { ...options }

      if ('timeZone' in options) {
        throw new TypeError('Cannot specify TimeZone')
      }

      return toLocaleStringMethod.call(this, internals, locales, options)
    },

    valueOf: neverValueOf,

    toInstant(internals: ZonedInternals): Instant {
      return createInstant(internals.epochNanoseconds)
    },

    toPlainDate(internals: ZonedInternals): PlainDate {
      return createPlainDate(pluckIsoDateInternals(zonedInternalsToIso(internals)))
    },

    toPlainTime(internals: ZonedInternals): PlainTime {
      return createPlainTime(pluckIsoTimeFields(zonedInternalsToIso(internals)))
    },

    toPlainDateTime(internals: ZonedInternals): PlainDateTime {
      return createPlainDateTime(pluckIsoDateTimeInternals(zonedInternalsToIso(internals)))
    },

    toPlainYearMonth(): PlainYearMonth {
      return createPlainYearMonth(convertToPlainYearMonth(this))
    },

    toPlainMonthDay(): PlainMonthDay {
      return createPlainMonthDay(convertToPlainMonthDay(this))
    },

    getISOFields(internals: ZonedInternals): ZonedPublic {
      return {
        ...pluckIsoDateTimeInternals(zonedInternalsToIso(internals)),
        // alphabetical
        calendar: getPublicIdOrObj(internals.calendar) as CalendarPublic,
        offset: formatOffsetNano(
          // TODO: more DRY
          zonedInternalsToIso(internals).offsetNanoseconds,
        ),
        timeZone: getPublicIdOrObj(internals.timeZone) as TimeZonePublic,
      }
    },

    getCalendar: getPublicCalendar,
    getTimeZone: getPublicTimeZone,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumSign {
      return compareDayTimeNanos(
        toZonedInternals(arg0).epochNanoseconds,
        toZonedInternals(arg1).epochNanoseconds,
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

// TODO: DRY
function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeFields(timeArg)
}

// TODO: DRY
// similar to checkCalendarsCompatible
// `a` takes precedence if both the same ID
function getPreferredCalendar(a: CalendarOps, b: CalendarOps): CalendarOps {
  // fast path. doesn't read IDs
  if (a === b) {
    return a
  }

  const aId = a.id
  const bId = b.id

  if (aId !== isoCalendarId) {
    if (aId !== bId && bId !== isoCalendarId) {
      throw new RangeError('Incompatible calendars')
    }

    return a
  }

  return b
}
