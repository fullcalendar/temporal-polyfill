import { isoCalendarId } from './calendarConfig'
import { DateFields, dateGetters } from './calendarFields'
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
import { Duration, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  IsoDateInternals,
  generatePublicIsoDateFields,
  isoTimeFieldDefaults,
  pluckIsoDateInternals,
} from './isoFields'
import { formatCalendar, formatIsoDateFields } from './isoFormat'
import { compareIsoDateTimeFields, refineIsoDateInternals } from './isoMath'
import { parsePlainDate } from './isoParse'
import { refineDateDisplayOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { createPlainDateTime } from './plainDateTime'
import { toPlainTimeInternals } from './plainTime'
import { zonedInternalsToIso } from './timeZoneOps'
import { Unit } from './units'
import { NumSign } from './utils'

export type PlainDateBag = DateFields
export type PlainDateArg = PlainDate | PlainDateBag | string

export type PlainDate = TemporalInstance<IsoDateInternals>
export const [PlainDate, createPlainDate, toPlainDateInternals] = createTemporalClass(
  'PlainDate',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar: any = isoCalendarId
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
    with(internals: IsoDateInternals, bag: PlainDateBag, options): PlainDate {
      return createPlainDate(mergePlainDateBag(this, bag, options))
    },

    withCalendar(internals: IsoDateInternals, calendarArg): PlainDate {
      return createPlainDate({
        ...internals,
        calendar: queryCalendarOps(calendarArg),
      })
    },

    add(internals: IsoDateInternals, durationArg, options): PlainDate {
      return internals.calendar.dateAdd(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals: IsoDateInternals, durationArg, options): PlainDate {
      return internals.calendar.dateAdd(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals: IsoDateInternals, otherArg, options): Duration {
      return diffPlainDates(internals, toPlainDateInternals(otherArg), options)
    },

    since(internals: IsoDateInternals, otherArg, options): Duration {
      return diffPlainDates(toPlainDateInternals(otherArg), internals, options, true)
    },

    equals(internals: IsoDateInternals, other): boolean {
      const otherInternals = toPlainDateInternals(other)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals: IsoDateInternals, options): string {
      return formatIsoDateFields(internals) +
        formatCalendar(internals.calendar, refineDateDisplayOptions(options))
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options) => {
      return optionalToPlainTimeInternals(options.time)
    }),

    toPlainDateTime(internals, timeArg) {
      return createPlainDateTime({
        ...internals,
        ...optionalToPlainTimeInternals(timeArg),
      })
    },

    toPlainYearMonth(): any { // TODO!!!
      return convertToPlainYearMonth(this)
    },

    toPlainMonthDay(): any { // TODO!!!
      return convertToPlainMonthDay(this)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
      return compareIsoDateTimeFields(
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
  options,
  roundingModeInvert?: boolean,
) {
  return createDuration(
    diffDates(
      getCommonCalendarOps(internals0, internals1),
      internals0,
      internals1,
      ...refineDiffOptions(roundingModeInvert, options, Unit.Day, Unit.Year, Unit.Day),
    ),
  )
}

function optionalToPlainTimeInternals(timeArg) {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeInternals(timeArg)
}
