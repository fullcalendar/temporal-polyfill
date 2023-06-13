import { isoCalendarId } from './calendarConfig'
import { yearMonthGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import { createTemporalClass, isObjIdsEqual, neverValueOf, toLocaleStringMethod } from './class'
import {
  convertPlainYearMonthToDate,
  convertPlainYearMonthToIso,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
} from './convert'
import { diffDates } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { generatePublicIsoDateFields, refineIsoDateInternals } from './isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { compareIsoDateTimeFields } from './isoMath'
import { parsePlainYearMonth } from './isoParse'
import { optionsToOverflow } from './options'

export const [
  PlainYearMonth,
  createPlainYearMonth,
  toPlainYearMonthInternals,
] = createTemporalClass(
  'PlainYearMonth',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoYear, isoMonth, calendar = isoCalendarId, referenceIsoDay = 1) => {
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
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  yearMonthGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainYearMonth(mergePlainYearMonthBag(internals, bag, options))
    },

    add(internals, durationArg, options) {
      return movePlainYearMonth(
        this,
        internals.calendar,
        toDurationInternals(durationArg),
        optionsToOverflow(options),
      )
    },

    subtract(internals, durationArg, options) {
      return movePlainYearMonth(
        this,
        internals.calendar,
        negateDurationInternals(toDurationInternals(durationArg)),
        optionsToOverflow(options),
      )
    },

    until(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          convertPlainYearMonthToIso(internals),
          convertPlainYearMonthToIso(toPlainYearMonthInternals(otherArg)),
          options,
        ),
      )
    },

    since(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          convertPlainYearMonthToIso(toPlainYearMonthInternals(otherArg)),
          convertPlainYearMonthToIso(internals),
          options, // TODO: flip rounding args
        ),
      )
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainYearMonthInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isObjIdsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatPossibleDate(internals, options, formatIsoYearMonthFields)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return convertPlainYearMonthToDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoDateTimeFields(
        toPlainYearMonthInternals(arg0),
        toPlainYearMonthInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function movePlainYearMonth(
  plainYearMonth,
  calendar,
  durationFields,
  overflowHandling,
) {
  const isoDateFields = convertPlainYearMonthToIso(plainYearMonth, {
    day: durationFields.sign < 0
      ? calendar.daysInMonth(plainYearMonth)
      : 1,
  })

  return createPlainYearMonth(
    calendar.dateAdd(isoDateFields, durationFields, overflowHandling),
  )
}
