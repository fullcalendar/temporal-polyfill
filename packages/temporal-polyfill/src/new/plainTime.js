import { timeGetters } from './calendarFields'
import {
  bagToPlainTimeInternals,
  createZonedDateTimeConverter,
  mapRefiners,
  plainTimeWithBag,
  zonedDateTimeInternalsToIso,
} from './convert'
import { diffTimes } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { formatIsoTimeFields } from './format'
import { neverValueOf } from './internalClass'
import {
  compareIsoTimeFields,
  isoTimeFieldRefiners,
  pluckIsoTimeFields,
  constrainIsoTimeFields,
} from './isoFields'
import { moveTime } from './move'
import { optionsToOverflow } from './options'
import { stringToPlainTimeInternals } from './parse'
import { toPlainDateInternals } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { roundIsoTimeFields } from './round'
import { createTemporalClass } from './temporalClass'
import { ZonedDateTime } from './zonedDateTime'

export const [
  PlainTime,
  createPlainTime,
  toPlainTimeInternals,
] = createTemporalClass(
  'PlainTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    isoMicrosecond = 0,
    isoNanosecond = 0,
  ) => {
    return constrainIsoTimeFields(
      mapRefiners({
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
      }, isoTimeFieldRefiners),
    )
  },

  // massageOtherInternals
  (arg, argInternals) => {
    if (arg instanceof PlainDateTime) {
      return pluckIsoTimeFields(argInternals)
    }
    if (arg instanceof ZonedDateTime) {
      return pluckIsoTimeFields(zonedDateTimeInternalsToIso(argInternals))
    }
  },

  // bagToInternals
  bagToPlainTimeInternals,

  // stringToInternals
  stringToPlainTimeInternals,

  // handleUnusedOptions
  optionsToOverflow,

  // Getters
  // -----------------------------------------------------------------------------------------------

  timeGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return plainTimeWithBag(this, bag, options)
    },

    add(internals, durationArg) {
      return createPlainTime(
        moveTime(
          internals,
          toDurationInternals(durationArg),
        ),
      )
    },

    subtract(internals, durationArg) {
      return createPlainTime(
        moveTime(
          internals,
          negateDurationFields(toDurationInternals(durationArg)),
        ),
      )
    },

    until(internals, options) {
      return createDuration(
        diffTimes(
          internals,
          toPlainTimeInternals(internals),
          options,
        ),
      )
    },

    since(internals, options) {
      return createDuration(
        diffTimes(
          toPlainTimeInternals(internals),
          internals,
          options, // TODO: reverse rounding
        ),
      )
    },

    round(internals, options) {
      return roundIsoTimeFields(internals, options)
    },

    equals(internals, other) {
      const otherInternals = toPlainTimeInternals(other)
      return compareIsoTimeFields(internals, otherInternals)
    },

    toString(internals, options) {
      // TODO: don't let options (smallestUnit/fractionalWhatever) be access twice!!!
      return formatIsoTimeFields(roundIsoTimeFields(internals, options), options)
    },

    toLocaleString(internals, locales, options) {
      return ''
    },

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options) => {
      return toPlainDateInternals(options.plainDate)
    }),

    toPlainDateTime(internals, plainDateArg) {
      return createPlainDateTime({
        ...internals,
        ...toPlainDateInternals(plainDateArg),
      })
    },

    getISOFields: pluckIsoTimeFields,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0, arg1) {
      return compareIsoTimeFields(
        toPlainTimeInternals(arg0),
        toPlainTimeInternals(arg1),
      )
    },
  },
)
