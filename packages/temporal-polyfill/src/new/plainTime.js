import { timeGetters } from './calendarFields'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import {
  createZonedDateTimeConverter,
  mergePlainTimeBag,
  refinePlainTimeBag,
} from './convert'
import { diffTimes } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import { pluckIsoTimeFields, refineIsoTimeInternals } from './isoFields'
import { formatIsoTimeFields } from './isoFormat'
import { compareIsoTimeFields } from './isoMath'
import { stringToPlainTimeInternals } from './isoParse'
import { moveTime } from './move'
import { optionsToOverflow } from './options'
import { toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { roundIsoTimeFields } from './round'
import { zonedInternalsToIso } from './timeZoneOps'

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
    return refineIsoTimeInternals({
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      isoMicrosecond,
      isoNanosecond,
    })
  },

  // internalsConversionMap
  {
    PlainDateTime: pluckIsoTimeFields,
    ZonedDateTime(argInternals) {
      return pluckIsoTimeFields(zonedInternalsToIso(argInternals))
    },
  },

  // bagToInternals
  refinePlainTimeBag,

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
      return mergePlainTimeBag(this, bag, options)
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

    toLocaleString: toLocaleStringMethod,

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
