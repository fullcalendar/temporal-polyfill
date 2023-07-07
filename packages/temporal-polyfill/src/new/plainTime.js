import { timeGetters } from './calendarFields'
import { createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import {
  createZonedDateTimeConverter,
  mergePlainTimeBag,
  refinePlainTimeBag,
} from './convert'
import { diffTimes } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { pluckIsoTimeFields } from './isoFields'
import { formatIsoTimeFields } from './isoFormat'
import { compareIsoTimeFields, refineIsoTimeInternals } from './isoMath'
import { parsePlainTime } from './isoParse'
import { moveTime } from './move'
import {
  refineDiffOptions,
  refineOverflowOptions,
  refineRoundOptions,
  refineTimeDisplayOptions,
} from './options'
import { toPlainDateInternals } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { roundTime, roundTimeToNano } from './round'
import { zonedInternalsToIso } from './timeZoneOps'
import { hourIndex } from './units'

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
  parsePlainTime,

  // handleUnusedOptions
  refineOverflowOptions,

  // Getters
  // -----------------------------------------------------------------------------------------------

  timeGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals, bag, options) {
      return createPlainTime(mergePlainTimeBag(this, bag, options))
    },

    add(internals, durationArg) {
      return movePlainTime(internals, toDurationInternals(durationArg))
    },

    subtract(internals, durationArg) {
      return movePlainTime(internals, negateDurationInternals(toDurationInternals(durationArg)))
    },

    until(internals, otherArg, options) {
      return diffPlainTimes(internals, toPlainTimeInternals(otherArg), options)
    },

    since(internals, otherArg, options) {
      return diffPlainTimes(toPlainTimeInternals(otherArg), internals, options, true)
    },

    round(internals, options) {
      return createPlainTime(
        roundTime(internals, ...refineRoundOptions(options, hourIndex)),
      )
    },

    equals(internals, other) {
      const otherInternals = toPlainTimeInternals(other)
      return compareIsoTimeFields(internals, otherInternals)
    },

    toString(internals, options) {
      const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options)

      return formatIsoTimeFields(
        roundTimeToNano(internals, nanoInc, roundingMode),
        subsecDigits,
      )
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

// Utils
// -------------------------------------------------------------------------------------------------

function movePlainTime(internals, durationInternals) {
  return createPlainTime(moveTime(internals, durationInternals)[0])
}

function diffPlainTimes(internals0, internals1, options, roundingModeInvert) {
  return createDuration(
    diffTimes(
      internals0,
      internals1,
      ...refineDiffOptions(roundingModeInvert, options, hourIndex, hourIndex),
    ),
  )
}
