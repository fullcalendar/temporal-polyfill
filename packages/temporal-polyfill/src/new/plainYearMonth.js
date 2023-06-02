import {
  bagToPlainYearMonthInternals,
  plainYearMonthToPlainDate,
  plainYearMonthToPlainDateFirst,
  plainYearMonthWithBag,
} from './bag'
import { isoCalendarId } from './calendarConfig'
import { yearMonthGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import { createTemporalClass, getInternals, neverValueOf, toLocaleStringMethod } from './class'
import { diffDates } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { generatePublicIsoDateFields, refineIsoDateInternals } from './isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { compareIsoFields } from './isoMath'
import { stringToPlainYearMonthInternals } from './isoParse'
import { optionsToOverflow } from './options'
import { isIdPropsEqual } from './util'

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
  bagToPlainYearMonthInternals,

  // stringToInternals
  stringToPlainYearMonthInternals,

  // handleUnusedOptions
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  yearMonthGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainYearMonth(plainYearMonthWithBag(internals, bag, options))
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
        negateDurationFields(toDurationInternals(durationArg)),
        optionsToOverflow(options),
      )
    },

    until(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          plainYearMonthToPlainDateFirst(internals),
          plainYearMonthToPlainDateFirst(toPlainYearMonthInternals(otherArg)),
          options,
        ),
      )
    },

    since(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          plainYearMonthToPlainDateFirst(toPlainYearMonthInternals(otherArg)),
          plainYearMonthToPlainDateFirst(internals),
          options, // TODO: flip rounding args
        ),
      )
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainYearMonthInternals(otherArg)
      return !compareIsoFields(internals, otherInternals) &&
        isIdPropsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatPossibleDate(internals, options, formatIsoYearMonthFields)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toPlainDate(internals, bag) {
      return plainYearMonthToPlainDate(this, bag)
    },

    getISOFields: generatePublicIsoDateFields,

    getCalendar: getPublicCalendar,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoFields(
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
  const plainDate = plainYearMonthToPlainDate(plainYearMonth, {
    day: durationFields.sign < 0
      ? calendar.daysInMonth(plainYearMonth)
      : 1,
  })

  let isoDateFields = getInternals(plainDate)
  isoDateFields = calendar.dateAdd(isoDateFields, durationFields, overflowHandling)

  return createPlainYearMonth({
    ...isoDateFields,
    calendar,
  })
}
