import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBag, dateGetters } from './calendarFields'
import {
  getCommonCalendarOps,
  getPublicCalendar,
  queryCalendarOps,
} from './calendarOps'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  createZonedDateTimeConverter,
  mergePlainDateBag,
  refinePlainDateBag,
} from './convert'
import { diffDates } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals, updateDurationFieldsSign } from './durationFields'
import {
  IsoDateInternals,
  IsoTimeFields,
  generatePublicIsoDateFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateFields } from './isoFormat'
import { compareIsoDateFields, refineIsoDateInternals } from './isoMath'
import { parsePlainDate } from './isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineDateDisplayOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeFields } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { zonedInternalsToIso } from './timeZoneOps'
import { Unit } from './units'
import { NumSign } from './utils'

export type PlainDateArg = PlainDate | PlainDateBag | string
export type PlainDateBag = DateBag & { calendar?: CalendarArg }
export type PlainDateMod = DateBag

export type PlainDate = TemporalInstance<IsoDateInternals>
export const [
  PlainDate,
  createPlainDate,
  toPlainDateInternals
] = createTemporalClass(
  'PlainDate',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar: CalendarArg = isoCalendarId
  ): IsoDateInternals => {
    return refineIsoDateInternals({
      isoYear,
      isoMonth,
      isoDay,
      calendar,
    })
  },

  // internalsConversionMap
  {
    PlainDateTime: pluckIsoDateInternals,
    ZonedDateTime(argInternals) {
      return pluckIsoDateInternals(zonedInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  refinePlainDateBag,

  // stringToInternals
  parsePlainDate,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  dateGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: IsoDateInternals, mod: PlainDateMod, options?: OverflowOptions): PlainDate {
      return createPlainDate(mergePlainDateBag(this, mod, options))
    },

    withCalendar(internals: IsoDateInternals, calendarArg: CalendarArg): PlainDate {
      return createPlainDate({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals: IsoDateInternals, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        internals.calendar.dateAdd(
          internals,
          toDurationInternals(durationArg),
          refineOverflowOptions(options),
        ),
      )
    },

    subtract(internals: IsoDateInternals, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        internals.calendar.dateAdd(
          internals,
          negateDurationInternals(toDurationInternals(durationArg)),
          refineOverflowOptions(options),
        ),
      )
    },

    until(internals: IsoDateInternals, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return diffPlainDates(internals, toPlainDateInternals(otherArg), options)
    },

    since(internals: IsoDateInternals, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return diffPlainDates(toPlainDateInternals(otherArg), internals, options, true)
    },

    equals(internals: IsoDateInternals, otherArg: PlainDateArg): boolean {
      const otherInternals = toPlainDateInternals(otherArg)

      return !compareIsoDateFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals: IsoDateInternals, options?: DateTimeDisplayOptions): string {
      return formatIsoDateFields(internals) +
        formatCalendar(internals.calendar, refineDateDisplayOptions(options))
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options: { plainTime: PlainTimeArg }) => {
      return optionalToPlainTimeFields(options.plainTime)
    }),

    toPlainDateTime(internals, timeArg): PlainDateTime {
      return createPlainDateTime({
        ...internals,
        ...optionalToPlainTimeFields(timeArg),
      })
    },

    toPlainYearMonth(): PlainYearMonth {
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay(): PlainMonthDay {
      return convertToPlainMonthDay(this)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
      return compareIsoDateFields(
        toPlainDateInternals(arg0),
        toPlainDateInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function diffPlainDates(
  internals0: IsoDateInternals,
  internals1: IsoDateInternals,
  options: DiffOptions | undefined,
  roundingModeInvert?: boolean,
): Duration {
  const calendarOps = getCommonCalendarOps(internals0, internals1)

  return createDuration(
    updateDurationFieldsSign(
      diffDates(
        calendarOps,
        internals0,
        internals1,
        ...refineDiffOptions(roundingModeInvert, options, Unit.Day, Unit.Year, Unit.Day),
      )
    )
  )
}

function optionalToPlainTimeFields(timeArg: PlainTimeArg): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeFields(timeArg)
}
