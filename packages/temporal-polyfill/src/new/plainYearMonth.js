import {
  convertPlainYearMonthToDate,
  convertPlainYearMonthToFirst,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
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
import { compareIsoDateTimeFields } from './isoMath'
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
  refinePlainYearMonthBag,

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
        negateDurationFields(toDurationInternals(durationArg)),
        optionsToOverflow(options),
      )
    },

    until(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          convertPlainYearMonthToFirst(internals),
          convertPlainYearMonthToFirst(toPlainYearMonthInternals(otherArg)),
          options,
        ),
      )
    },

    since(internals, otherArg, options) {
      const { calendar } = internals
      return createPlainYearMonth(
        diffDates(
          calendar,
          convertPlainYearMonthToFirst(toPlainYearMonthInternals(otherArg)),
          convertPlainYearMonthToFirst(internals),
          options, // TODO: flip rounding args
        ),
      )
    },

    equals(internals, otherArg) {
      const otherInternals = toPlainYearMonthInternals(otherArg)
      return !compareIsoDateTimeFields(internals, otherInternals) &&
        isIdPropsEqual(internals.calendar, otherInternals.calendar)
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
  const plainDate = convertPlainYearMonthToDate(plainYearMonth, {
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
