import { isoCalendarId } from './calendarConfig'
import { yearMonthGetters } from './calendarFields'
import { getPublicCalendar } from './calendarOps'
import {
  bagToPlainYearMonthInternals,
  isStringCastsEqual,
  mapRefiners,
  plainYearMonthToPlainDate,
  plainYearMonthToPlainDateFirst,
  plainYearMonthWithBag,
} from './convert'
import { diffDates } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { formatIsoYearMonthFields, formatPossibleDate } from './format'
import { getInternals, neverValueOf } from './internalClass'
import {
  compareIsoFields,
  constrainIsoDateFields,
  generatePublicIsoDateFields,
  isoDateSlotRefiners,
} from './isoFields'
import { noop } from './lang'
import { optionsToOverflow } from './options'
import { stringToPlainYearMonthInternals } from './parse'
import { createTemporalClass } from './temporalClass'

export const [
  PlainYearMonth,
  createPlainYearMonth,
  toPlainYearMonthInternals,
] = createTemporalClass(
  'PlainYearMonth',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (isoYear, isoMonth, calendarArg = isoCalendarId, referenceIsoDay = 1) => {
    return constrainIsoDateFields(
      mapRefiners({
        isoYear,
        isoMonth,
        isoDay: referenceIsoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },

  // massageOtherInternals
  noop,

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
        isStringCastsEqual(internals.calendar, otherInternals.calendar)
    },

    toString(internals, options) {
      return formatPossibleDate(internals, options, formatIsoYearMonthFields)
    },

    toLocaleString(internals, locales, options) {
      return ''
    },

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
