import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { YearMonthFields, yearMonthGetters } from './calendarFields'
import { getCommonCalendarOps, getPublicCalendar } from './calendarOps'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertPlainYearMonthToDate,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
} from './convert'
import { diffDates } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals } from './durationFields'
import { IsoDateFields, IsoDateInternals, generatePublicIsoDateFields } from './isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { compareIsoDateTimeFields, refineIsoDateInternals } from './isoMath'
import { parsePlainYearMonth } from './isoParse'
import { moveDateByDays } from './move'
import { refineDiffOptions, refineOverflowOptions } from './options'
import { PlainDate } from './plainDate'
import { Unit } from './units'
import { NumSign } from './utils'

export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string
export type PlainYearMonthBag = YearMonthFields & { calendar?: CalendarArg }
export type PlainYearMonthMod = Partial<YearMonthFields>

export type PlainYearMonth = TemporalInstance<IsoDateInternals>
export const [
  PlainYearMonth,
  createPlainYearMonth,
  toPlainYearMonthInternals
] = createTemporalClass(
  'PlainYearMonth',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoYear: number,
    isoMonth: number,
    calendar: CalendarArg = isoCalendarId,
    referenceIsoDay: number = 1
  ): IsoDateInternals => {
    return refineIsoDateInternals({
      isoYear,
      isoMonth,
      isoDay: referenceIsoDay,
      calendar,
    })
  },

  // internalsConversionMap
  {},

  // bagToInternals
  refinePlainYearMonthBag,

  // stringToInternals
  parsePlainYearMonth,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  yearMonthGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: IsoDateInternals, mod: PlainYearMonthMod, options): PlainYearMonth {
      return createPlainYearMonth(mergePlainYearMonthBag(internals, mod, options))
    },

    add(internals: IsoDateInternals, durationArg: DurationArg, options): PlainYearMonth {
      return movePlainYearMonth(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals: IsoDateInternals, durationArg: DurationArg, options): PlainYearMonth {
      return movePlainYearMonth(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals: IsoDateInternals, otherArg: PlainYearMonthArg, options): Duration {
      return diffPlainYearMonths(internals, toPlainYearMonthInternals(otherArg), options)
    },

    since(internals: IsoDateInternals, otherArg: PlainYearMonthArg, options): Duration {
      return diffPlainYearMonths(toPlainYearMonthInternals(otherArg), internals, options, true)
    },

    equals(internals: IsoDateInternals, otherArg: PlainYearMonthArg): boolean {
      const otherInternals = toPlainYearMonthInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString: formatPossibleDate.bind(undefined, formatIsoYearMonthFields),

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals: IsoDateInternals, bag: { day: number }): PlainDate {
      return convertPlainYearMonthToDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumSign {
      return compareIsoDateTimeFields(
        toPlainYearMonthInternals(arg0),
        toPlainYearMonthInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function diffPlainYearMonths(
  internals0: IsoDateInternals,
  internals1: IsoDateInternals,
  options,
  roundingModeInvert?: boolean
): Duration {
  return createDuration(
    diffDates(
      getCommonCalendarOps(internals0, internals1),
      movePlainYearMonthToDay(internals0),
      movePlainYearMonthToDay(internals1),
      ...refineDiffOptions(roundingModeInvert, options, Unit.Year, Unit.Year, Unit.Day),
    ),
  )
}

function movePlainYearMonth(
  internals: IsoDateInternals,
  durationInternals: DurationInternals,
  options,
): PlainYearMonth {
  const { calendar } = internals
  const isoDateFields = movePlainYearMonthToDay(
    internals,
    durationInternals.sign < 0
      ? calendar.daysInMonth(internals)
      : 1,
  )

  return createPlainYearMonth(
    calendar.dateAdd(isoDateFields, durationInternals, refineOverflowOptions(options)),
  )
}

function movePlainYearMonthToDay(internals: IsoDateInternals, day = 1): IsoDateFields {
  return moveDateByDays(
    internals,
    day - internals.calendar.day(internals),
  )
}
