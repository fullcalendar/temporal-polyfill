import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { MonthDayBag, YearFields, monthDayGetters } from './calendarFields'
import { getPublicCalendar } from './calendarPublic'
import { TemporalInstance, createTemporalClass, isObjIdsEqual, neverValueOf } from './class'
import {
  convertPlainMonthDayToDate,
  mergePlainMonthDayBag,
  refinePlainMonthDayBag,
} from './convert'
import { IsoDateInternals, generatePublicIsoDateFields, refineIsoDateInternals } from './isoInternals'
import { formatIsoMonthDayFields, formatPossibleDate } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { compareIsoDateFields, isoEpochFirstLeapYear } from './isoMath'
import { parsePlainMonthDay } from './isoParse'
import { refineOverflowOptions } from './options'
import { PlainDate } from './plainDate'

export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag | string
export type PlainMonthDayBag = MonthDayBag & { calendar?: CalendarArg }
export type PlainMonthDayMod = MonthDayBag

export type PlainMonthDay = TemporalInstance<IsoDateInternals>
export const [
  PlainMonthDay,
  createPlainMonthDay,
  toPlainMonthDayInternals
] = createTemporalClass(
  'PlainMonthDay',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoMonth: number,
    isoDay: number,
    calendar: CalendarArg = isoCalendarId,
    referenceIsoYear: number = isoEpochFirstLeapYear
  ): IsoDateInternals => {
    return refineIsoDateInternals({
      isoYear: referenceIsoYear,
      isoMonth,
      isoDay,
      calendar,
    })
  },

  // internalsConversionMap
  // NOTE: PlainDate(Time) is refined as bag
  {},

  // bagToInternals
  refinePlainMonthDayBag,

  // stringToInternals
  parsePlainMonthDay,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  monthDayGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: IsoDateInternals, mod: PlainMonthDayMod, options): PlainMonthDay {
      return createPlainMonthDay(mergePlainMonthDayBag(this, mod, options))
    },

    equals(internals: IsoDateInternals, otherArg: PlainMonthDayArg): boolean {
      const otherInternals = toPlainMonthDayInternals(otherArg)

      return !compareIsoDateFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString: formatPossibleDate.bind(undefined, formatIsoMonthDayFields),

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals: IsoDateInternals, bag: YearFields): PlainDate {
      return convertPlainMonthDayToDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },
)
