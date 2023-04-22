import { isoCalendarId } from './calendarAdapter'
import { yearMonthGetters } from './calendarFields'
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
import {
  compareIsoFields,
  isoDateSlotRefiners,
  pluckIsoDateSlots,
  regulateIsoDateFields,
} from './isoFields'
import { movePlainYearMonth } from './move'
import { optionsToOverflow } from './options'
import { stringToPlainYearMonthInternals } from './parse'
import { createTemporalClass, neverValueOf } from './temporalClass'

export const [
  PlainYearMonth,
  createPlainYearMonth,
  toPlainYearMonthInternals,
] = createTemporalClass(
  'PlainYearMonth',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (isoYear, isoMonth, calendarArg = isoCalendarId, referenceIsoDay = 1) => {
    return regulateIsoDateFields(
      mapRefiners({
        isoYear,
        isoMonth,
        isoDay: referenceIsoDay,
        calendar: calendarArg,
      }, isoDateSlotRefiners),
    )
  },
  {},
  bagToPlainYearMonthInternals,
  stringToPlainYearMonthInternals,
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
        internals,
        toDurationInternals(durationArg),
        options,
      )
    },

    subtract(internals, durationArg, options) {
      return movePlainYearMonth(
        internals,
        negateDurationFields(toDurationInternals(durationArg)),
        options,
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

    getISOFields: pluckIsoDateSlots,
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
