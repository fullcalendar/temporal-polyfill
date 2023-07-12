import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOps'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import { diffEpochNano } from './diff'
import { Duration, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { formatIsoDateTimeFields, formatOffsetNano } from './isoFormat'
import {
  epochGetters,
  epochMicroToNano,
  epochMilliToNano,
  epochNanoToIso,
  epochSecToNano,
  checkEpochNano,
} from './isoMath'
import { parseInstant } from './isoParse'
import { LargeInt, compareLargeInts } from './largeInt'
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
import { noop } from './utils'
import { createZonedDateTime } from './zonedDateTime'
import { Unit } from './units'

export type Instant = TemporalInstance<LargeInt>
export const [
  Instant,
  createInstant,
  toInstantEpochNano,
] = createTemporalClass(
  'Instant',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (epochNano: LargeInt) => {
    return checkEpochNano(toEpochNano(epochNano))
  },

  // internalsConversionMap
  {
    ZonedDateTime: (argInternals) => argInternals.epochNanoseconds,
  },

  // bagToInternals
  noop,

  // stringToInternals
  parseInstant,

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  epochGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    toZonedDateTimeISO(epochNanoseconds, timeZoneArg): any { // TODO!!!
      createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(timeZoneArg),
        calendar: isoCalendarId,
      })
    },

    toZonedDateTime(epochNanoseconds, options): any { // TODO!!!
      const refinedObj = ensureObjectlike(options)

      return createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(refinedObj.timeZone),
        calendar: queryCalendarOps(refinedObj.calendar),
      })
    },

    add(epochNanoseconds, durationArg): Instant {
      return createInstant(
        moveEpochNano(
          epochNanoseconds,
          toDurationInternals(durationArg),
        ),
      )
    },

    subtract(epochNanoseconds, durationArg): Instant {
      return createInstant(
        moveEpochNano(
          epochNanoseconds,
          negateDurationInternals(toDurationInternals(durationArg)),
        ),
      )
    },

    until(epochNanoseconds, otherArg, options): Duration {
      return diffInstants(epochNanoseconds, toInstantEpochNano(otherArg), options)
    },

    since(epochNanoseconds, otherArg, options): Duration {
      return diffInstants(toInstantEpochNano(otherArg), epochNanoseconds, options, true)
    },

    round(epochNano, options): Instant {
      const [smallestUnitI, roundingInc, roundingModeI] = refineRoundOptions(options, Unit.Hour)

      return createInstant(
        roundByIncLarge(epochNano, computeNanoInc(smallestUnitI, roundingInc), roundingModeI),
      )
    },

    equals(epochNanoseconds, otherArg): boolean {
      return !compareLargeInts(
        epochNanoseconds,
        toInstantEpochNano(otherArg),
      )
    },

    toString(epochNano: LargeInt, options): string {
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

    toLocaleString(epochNano: LargeInt, locales: string | string[], options): string {
      // TODO
      return ''
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    fromEpochSeconds: epochSecToInstant,

    fromEpochMilliseconds: epochMilliToInstant,

    fromEpochMicroseconds(epochMicro: LargeInt) {
      return epochMicroToInstant(toEpochNano(epochMicro))
    },

    fromEpochNanoseconds(epochNano: LargeInt) {
      return createInstant(toEpochNano(epochNano))
    },
  },
)

function diffInstants(
  epochNano0: LargeInt,
  epochNano1: LargeInt,
  options,
  roundingModeInvert?: boolean
): Duration {
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

function epochSecToInstant(epochSec: number): Instant {
  return createInstant(epochSecToNano(epochSec))
}

function epochMilliToInstant(epochMilli: number): Instant {
  return createInstant(epochMilliToNano(epochMilli))
}

function epochMicroToInstant(epochMicro: LargeInt): Instant {
  return createInstant(epochMicroToNano(epochMicro))
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

export function toTemporalInstant(this: Date) {
  return epochMilliToInstant(this.valueOf())
}
