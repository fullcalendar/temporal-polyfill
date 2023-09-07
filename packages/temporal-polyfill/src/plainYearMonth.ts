import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { YearMonthBag, yearMonthGetters } from './calendarFields'
import { getPublicCalendar } from './calendarPublic'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf } from './class'
import {
  convertPlainYearMonthToDate,
  convertToPlainYearMonth,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
} from './convert'
import { diffDates } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals, updateDurationFieldsSign } from './durationFields'
import { IsoDateFields } from './isoFields'
import { IsoDateInternals, generatePublicIsoDateFields, refineIsoYearMonthInternals } from './isoInternals'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { compareIsoDateFields, moveByIsoDays } from './isoMath'
import { parsePlainYearMonth } from './isoParse'
import { DiffOptions, OverflowOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { Unit } from './units'
import { NumSign } from './utils'
import { getCommonCalendarOps } from './calendarOps'

export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string
export type PlainYearMonthBag = YearMonthBag & { calendar?: CalendarArg }
export type PlainYearMonthMod = YearMonthBag

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
    return refineIsoYearMonthInternals({
      isoYear,
      isoMonth,
      isoDay: referenceIsoDay,
      calendar,
    })
  },

  // internalsConversionMap
  // NOTE: PlainDate(Time) is refined as bag
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
    with(internals: IsoDateInternals, mod: PlainYearMonthMod, options?: OverflowOptions): PlainYearMonth {
      return createPlainYearMonth(mergePlainYearMonthBag(this, mod, options))
    },

    add(internals: IsoDateInternals, durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
      return movePlainYearMonth(
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals: IsoDateInternals, durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
      return movePlainYearMonth(
        internals,
        negateDurationInternals(toDurationInternals(durationArg)),
        options,
      )
    },

    until(internals: IsoDateInternals, otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
      return diffPlainYearMonths(internals, toPlainYearMonthInternals(otherArg), options)
    },

    since(internals: IsoDateInternals, otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
      return diffPlainYearMonths(internals, toPlainYearMonthInternals(otherArg), options, true)
    },

    equals(internals: IsoDateInternals, otherArg: PlainYearMonthArg): boolean {
      const otherInternals = toPlainYearMonthInternals(otherArg)

      return !compareIsoDateFields(internals, otherInternals) &&
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
      return compareIsoDateFields(
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
  options: DiffOptions | undefined,
  invert?: boolean,
): Duration {
  let durationInternals = updateDurationFieldsSign(
    diffDates(
      getCommonCalendarOps(internals0, internals1),
      movePlainYearMonthToDay(internals0),
      movePlainYearMonthToDay(internals1),
      ...refineDiffOptions(invert, options, Unit.Year, Unit.Year, Unit.Month),
    ),
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return createDuration(durationInternals)
}

function movePlainYearMonth(
  internals: IsoDateInternals,
  durationInternals: DurationInternals,
  options: OverflowOptions | undefined,
): PlainYearMonth {
  const { calendar } = internals
  const isoDateFields = movePlainYearMonthToDay(
    internals,
    durationInternals.sign < 0
      ? calendar.daysInMonth(internals)
      : 1,
  )
  const overflow = refineOverflowOptions(options)

  /*
  TODO: this is very wasteful. think about breaking spec and just using `movePlainYearMonthToDay`
  */
  return convertToPlainYearMonth(
    createPlainDate(calendar.dateAdd(isoDateFields, durationInternals, overflow)),
    overflow,
  )
}

// TODO: DRY
function movePlainYearMonthToDay(internals: IsoDateInternals, day = 1): IsoDateFields {
  return moveByIsoDays(
    internals,
    day - internals.calendar.day(internals),
  )
}
