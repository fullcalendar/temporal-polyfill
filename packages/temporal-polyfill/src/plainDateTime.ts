import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateFields, TimeFields, dateTimeGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar, queryCalendarOps } from './calendarOps'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergePlainDateTimeBag,
  refinePlainDateTimeBag,
} from './convert'
import { diffDateTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals, updateDurationFieldsSign } from './durationFields'
import {
  IsoDateTimeInternals,
  generatePublicIsoDateTimeFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
  pluckIsoDateTimeInternals,
  pluckIsoTimeFields,
} from './isoFields'
import { formatCalendar, formatIsoDateTimeFields } from './isoFormat'
import { compareIsoDateTimeFields, refineIsoDateTimeInternals } from './isoMath'
import { parsePlainDateTime } from './isoParse'
import { moveDateTime } from './move'
import {
  RoundingMode,
  refineDateTimeDisplayOptions,
  refineDiffOptions,
  refineEpochDisambigOptions,
  refineOverflowOptions,
  refineRoundOptions,
} from './options'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime, createPlainTime, toPlainTimeFields } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { roundDateTime, roundDateTimeToNano } from './round'
import { TimeZoneArg } from './timeZone'
import { getSingleInstantFor, queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { DayTimeUnit, Unit } from './units'
import { NumSign } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag | string
export type PlainDateTimeBag = DateFields & Partial<TimeFields> & { calendar?: CalendarArg }
export type PlainDateTimeMod = Partial<DateFields> & Partial<TimeFields>

export type PlainDateTime = TemporalInstance<IsoDateTimeInternals>
export const [PlainDateTime, createPlainDateTime, toPlainDateTimeInternals] = createTemporalClass(
  'PlainDateTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    isoMicrosecond: number = 0,
    isoNanosecond: number = 0,
    calendar: CalendarArg = isoCalendarId,
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
    with(internals: IsoDateTimeInternals, mod: PlainDateTimeMod, options): PlainDateTime {
      return createPlainDateTime(mergePlainDateTimeBag(this, mod, options))
    },

    withPlainTime(internals: IsoDateTimeInternals, plainTimeArg: PlainDateTimeArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        ...toPlainTimeFields(plainTimeArg),
      })
    },

    withPlainDate(internals: IsoDateTimeInternals, plainDateArg: PlainDateArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        ...toPlainDateInternals(plainDateArg),
      })
    },

    withCalendar(internals: IsoDateTimeInternals, calendarArg: CalendarArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals: IsoDateTimeInternals, durationArg: DurationArg, options): PlainDateTime {
      return movePlainDateTime(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals: IsoDateTimeInternals, durationArg: DurationArg, options): PlainDateTime {
      return movePlainDateTime(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg, options): Duration {
      return diffPlainDateTimes(internals, toPlainDateTimeInternals(otherArg), options)
    },

    since(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg, options): Duration {
      return diffPlainDateTimes(toPlainDateTimeInternals(otherArg), internals, options, true)
    },

    round(internals: IsoDateTimeInternals, options): PlainDateTime {
      const isoDateTimeFields = roundDateTime(
        internals,
        ...(refineRoundOptions(options) as [DayTimeUnit, number, RoundingMode]),
      )

      return createPlainDateTime({
        ...isoDateTimeFields,
        calendar: internals.calendar,
      })
    },

    equals(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg): boolean {
      const otherInternals = toPlainDateTimeInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals: IsoDateTimeInternals, options: any): string {
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
      internals: IsoDateTimeInternals,
      timeZoneArg: TimeZoneArg,
      options, // { disambiguation } - optional
    ): ZonedDateTime {
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

    toPlainDate(internals: IsoDateTimeInternals): PlainDate {
      return createPlainDate(pluckIsoDateInternals(internals))
    },

    toPlainYearMonth(): PlainYearMonth {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay(): PlainMonthDay {
      return convertToPlainMonthDay(this)
    },

    toPlainTime(internals: IsoDateTimeInternals): PlainTime {
      return createPlainTime(pluckIsoTimeFields(internals))
    },

    getISOFields: generatePublicIsoDateTimeFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumSign {
      return compareIsoDateTimeFields(
        toPlainDateTimeInternals(arg0),
        toPlainDateTimeInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function movePlainDateTime(
  internals: IsoDateTimeInternals,
  durationInternals: DurationInternals,
  options: any,
): PlainDateTime {
  return createPlainDateTime(
    moveDateTime(
      internals.calendar,
      internals,
      durationInternals,
      refineOverflowOptions(options),
    ),
  )
}

function diffPlainDateTimes(
  internals0: IsoDateTimeInternals,
  internals1: IsoDateTimeInternals,
  options: any,
  roundingModeInvert?: boolean
): Duration {
  return createDuration(
    updateDurationFieldsSign(
      diffDateTimes(
        getCommonCalendarOps(internals0, internals1),
        internals0,
        internals1,
        ...refineDiffOptions(roundingModeInvert, options, Unit.Day),
      ),
    )
  )
}
