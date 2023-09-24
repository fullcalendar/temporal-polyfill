import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBag, dateGetters } from './calendarFields'
import {
  queryCalendarOps,
} from './calendarOpsQuery'
import { getPublicCalendar } from './calendarPublic'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  createZonedDateTimeConverter,
  mergePlainDateBag,
  refinePlainDateBag,
} from './convert'
import { diffPlainDates } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { IsoDateInternals, generatePublicIsoDateFields, pluckIsoDateInternals, refineIsoDateInternals } from './isoInternals'
import { formatPlainDateIso } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from './isoMath'
import { isPlainDatesEqual } from './equality'
import { parsePlainDate } from './isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineDateDisplayOptions, refineOverflowOptions } from './options'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeFields } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { zonedInternalsToIso } from './timeZoneOps'
import { NumSign, isObjectlike } from './utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateArg = PlainDate | PlainDateBag | string
export type PlainDateBag = DateBag & { calendar?: CalendarArg }
export type PlainDateMod = DateBag

// only works with options object, not string timeZone name
const plainDateToZonedDateTimeConvert = createZonedDateTimeConverter((options: { plainTime?: PlainTimeArg }) => {
  return optionalToPlainTimeFields(options.plainTime)
})

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
      return createPlainDate(
        mergePlainDateBag(this, mod, options)
      )
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
      return createDuration(diffPlainDates(internals, toPlainDateInternals(otherArg), options))
    },

    since(internals: IsoDateInternals, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return createDuration(diffPlainDates(internals, toPlainDateInternals(otherArg), options, true))
    },

    equals(internals: IsoDateInternals, otherArg: PlainDateArg): boolean {
      return isPlainDatesEqual(internals, toPlainDateInternals(otherArg))
    },

    toString(internals: IsoDateInternals, options?: DateTimeDisplayOptions): string {
      return formatPlainDateIso(internals, options)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime(
      internals: IsoDateInternals,
      options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
    ): ZonedDateTime {
      return createZonedDateTime(
        plainDateToZonedDateTimeConvert(
          internals,
          isObjectlike(options) && !(options instanceof TimeZone)
            ? options as { timeZone: TimeZoneArg, plainTime?: PlainTimeArg }
            : { timeZone: options as TimeZoneArg }
        )
      )
    },

    toPlainDateTime(internals: IsoDateInternals, timeArg: PlainTimeArg): PlainDateTime {
      return createPlainDateTime(
        checkIsoDateTimeInBounds({
          ...internals,
          ...optionalToPlainTimeFields(timeArg),
        }),
      )
    },

    toPlainYearMonth(): PlainYearMonth {
      /*
      TODO: this is very wasteful. think about breaking spec and just using `movePlainYearMonthToDay`
      */
      return createPlainYearMonth(convertToPlainYearMonth(this))
    },

    toPlainMonthDay(): PlainMonthDay {
      return createPlainMonthDay(convertToPlainMonthDay(this))
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

// TODO: DRY
function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeFields(timeArg)
}
