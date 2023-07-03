import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOps'
import { createTemporalClass, neverValueOf } from './class'
import { diffEpochNano } from './diff'
import { createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { formatIsoDateTimeFields, formatOffsetNano } from './isoFormat'
import {
  epochGetters,
  epochMicroToNano,
  epochMilliToNano,
  epochNanoToIso,
  epochSecToNano,
  validateEpochNano,
} from './isoMath'
import { compareLargeInts } from './largeInt'
import { moveEpochNano } from './move'
import {
  ensureObjectlike,
  refineDiffOptions,
  refineInstantDisplayOptions,
  refineRoundOptions,
  toEpochNano,
} from './options'
import { computeNanoInc, roundByIncLarge } from './round'
import { queryTimeZoneOps, utcTimeZoneId } from './timeZoneOps'
import { hourIndex, secondsIndex } from './units'
import { noop } from './utils'
import { createZonedDateTime } from './zonedDateTime'

export const [
  Instant,
  createInstant,
  toInstantEpochNanoseconds,
] = createTemporalClass(
  'Instant',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (epochNanoseconds) => {
    return validateEpochNano(toEpochNano(epochNanoseconds))
  },

  // internalsConversionMap
  {
    ZonedDateTime: (argInternals) => argInternals.epochNanoseconds,
  },

  // bagToInternals
  noop,

  // stringToInternals
  stringToEpochNanoseconds,

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  epochGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    toZonedDateTimeISO(epochNanoseconds, timeZoneArg) {
      createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(timeZoneArg),
        calendar: isoCalendarId,
      })
    },

    toZonedDateTime(epochNanoseconds, options) {
      const refinedObj = ensureObjectlike(options)

      return createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(refinedObj.timeZone),
        calendar: queryCalendarOps(refinedObj.calendar),
      })
    },

    add(epochNanoseconds, durationArg) {
      return createInstant(
        moveEpochNano(
          epochNanoseconds,
          toDurationInternals(durationArg),
        ),
      )
    },

    subtract(epochNanoseconds, durationArg) {
      return createInstant(
        moveEpochNano(
          epochNanoseconds,
          negateDurationInternals(toDurationInternals(durationArg)),
        ),
      )
    },

    until(epochNanoseconds, otherArg, options) {
      return diffInstants(epochNanoseconds, toInstantEpochNanoseconds(otherArg), options)
    },

    since(epochNanoseconds, otherArg, options) {
      return diffInstants(toInstantEpochNanoseconds(otherArg), epochNanoseconds, options, true)
    },

    round(epochNano, options) {
      const [smallestUnitI, roundingInc, roundingModeI] = refineRoundOptions(options, hourIndex)

      return createInstant(
        roundByIncLarge(epochNano, computeNanoInc(smallestUnitI, roundingInc), roundingModeI),
      )
    },

    equals(epochNanoseconds, otherArg) {
      return !compareLargeInts(
        epochNanoseconds,
        toInstantEpochNanoseconds(otherArg),
      )
    },

    toString(epochNano, options) {
      const [
        timeZoneArg,
        nanoInc,
        roundingModeI,
        subsecDigits,
      ] = refineInstantDisplayOptions(options)
      const timeZone = queryTimeZoneOps(timeZoneArg || utcTimeZoneId)

      epochNano = roundByIncLarge(epochNano, nanoInc, roundingModeI)
      const offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
      const isoFields = epochNanoToIso(epochNano.addNumber(offsetNano))

      return formatIsoDateTimeFields(isoFields, subsecDigits) +
        formatOffsetNano(offsetNano)
    },

    toLocaleString(epochNanoseconds, locales, options) {
      return ''
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    fromEpochSeconds: epochSecToInstant,

    fromEpochMilliseconds: epochMilliToInstant,

    fromEpochMicroseconds(epochMicro) {
      return epochMicroToInstant(toEpochNano(epochMicro))
    },

    fromEpochNanoseconds(epochNanoseconds) {
      return createInstant(toEpochNano(epochNanoseconds))
    },
  },
)

function stringToEpochNanoseconds(str) {
  // TODO
}

function diffInstants(epochNano0, epochNano1, options, roundingModeInvert) {
  return createDuration(
    diffEpochNano(
      epochNano0,
      epochNano1,
      ...refineDiffOptions(roundingModeInvert, options, secondsIndex, hourIndex),
    ),
  )
}

// Unit Conversion
// -------------------------------------------------------------------------------------------------

function epochSecToInstant(epochSec) {
  return createInstant(epochSecToNano(epochSec))
}

function epochMilliToInstant(epochMilli) {
  return createInstant(epochMilliToNano(epochMilli))
}

function epochMicroToInstant(epochMicro) {
  return createInstant(epochMicroToNano(epochMicro))
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

export function toTemporalInstant() {
  return epochMilliToInstant(this.valueOf())
}
