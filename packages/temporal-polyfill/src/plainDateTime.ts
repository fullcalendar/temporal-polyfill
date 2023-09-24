import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBag, TimeBag, dateTimeGetters } from './calendarFields'
import { queryCalendarOps } from './calendarOpsQuery'
import { getPublicCalendar } from './calendarPublic'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import {
  convertPlainDateTimeToZoned,
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  mergePlainDateTimeBag,
  refinePlainDateTimeBag,
} from './convert'
import { diffPlainDateTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  IsoTimeFields,
  isoTimeFieldDefaults,
  pluckIsoTimeFields,
} from './isoFields'
import {
  IsoDateInternals,
  IsoDateTimeInternals,
  generatePublicIsoDateTimeFields,
  pluckIsoDateInternals,
  pluckIsoDateTimeInternals,
  refineIsoDateTimeInternals
} from './isoInternals'
import { formatPlainDateTimeIso } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { compareIsoDateTimeFields } from './isoMath'
import { isPlainDateTimesEqual } from './equality'
import { parsePlainDateTime } from './isoParse'
import { movePlainDateTime } from './move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
  refineOverflowOptions,
} from './options'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateInternals } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime, toPlainTimeFields } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { roundPlainDateTime } from './round'
import { TimeZoneArg } from './timeZone'
import { queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { UnitName } from './units'
import { NumSign } from './utils'
import { ZonedDateTime, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { CalendarOps } from './calendarOps'

export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag | string
export type PlainDateTimeBag = DateBag & TimeBag & { calendar?: CalendarArg }
export type PlainDateTimeMod = DateBag & TimeBag

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
  // TODO: add types to other conversion maps
  // Important that return types exactly match, because affects inferenced Internals
  {
    PlainDate: (argInternals: IsoDateInternals) => {
      return { ...argInternals, ...isoTimeFieldDefaults }
    },
    ZonedDateTime: (argInternals: ZonedInternals) => {
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
    with(internals: IsoDateTimeInternals, mod: PlainDateTimeMod, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(mergePlainDateTimeBag(this, mod, options))
    },

    withPlainTime(internals: IsoDateTimeInternals, plainTimeArg?: PlainTimeArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        ...optionalToPlainTimeFields(plainTimeArg),
      })
    },

    withPlainDate(internals: IsoDateTimeInternals, plainDateArg: PlainDateArg): PlainDateTime {
      const plainDateInternals = toPlainDateInternals(plainDateArg)
      return createPlainDateTime({
        ...internals,
        ...plainDateInternals,
        // TODO: more DRY with other datetime types
        calendar: getPreferredCalendar(plainDateInternals.calendar, internals.calendar),
      })
    },

    withCalendar(internals: IsoDateTimeInternals, calendarArg: CalendarArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals: IsoDateTimeInternals, durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(
          internals,
          toDurationInternals(durationArg),
          options,
        ),
      )
    },

    subtract(internals: IsoDateTimeInternals, durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(
          internals,
          negateDurationInternals(toDurationInternals(durationArg)),
          options,
        ),
      )
    },

    until(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(diffPlainDateTimes(internals, toPlainDateTimeInternals(otherArg), options))
    },

    since(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(diffPlainDateTimes(internals, toPlainDateTimeInternals(otherArg), options, true))
    },

    round(internals: IsoDateTimeInternals, options: RoundingOptions | UnitName): PlainDateTime {
      return createPlainDateTime(roundPlainDateTime(internals, options))
    },

    equals(internals: IsoDateTimeInternals, otherArg: PlainDateTimeArg): boolean {
      return isPlainDateTimesEqual(internals, toPlainDateTimeInternals(otherArg))
    },

    toString(internals: IsoDateTimeInternals, options?: DateTimeDisplayOptions): string {
      return formatPlainDateTimeIso(internals, options)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime(
      internals: IsoDateTimeInternals,
      timeZoneArg: TimeZoneArg,
      options?: EpochDisambigOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        convertPlainDateTimeToZoned(
          internals,
          queryTimeZoneOps(timeZoneArg),
          options,
        ),
      )
    },

    toPlainDate(internals: IsoDateTimeInternals): PlainDate {
      return createPlainDate(pluckIsoDateInternals(internals))
    },

    toPlainYearMonth(): PlainYearMonth {
      return createPlainYearMonth(convertToPlainYearMonth(this))
    },

    toPlainMonthDay(): PlainMonthDay {
      return createPlainMonthDay(convertToPlainMonthDay(this))
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
