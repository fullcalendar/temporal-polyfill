import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOpsQuery'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import { diffInstants } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals } from './durationFields'
import { formatInstantIso } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { epochGetters, checkEpochNanoInBounds } from './isoMath'
import { parseInstant } from './isoParse'
import { moveEpochNano } from './move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from './options'
import { toBigInt, ensureObjectlike } from './cast'
import { roundInstant } from './round'
import { queryTimeZoneOps } from './timeZoneOps'
import { NumSign, noop } from './utils'
import { ZonedDateTime, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { UnitName, nanoInMicro, nanoInMilli, nanoInSec } from './units'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { DayTimeNano, bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from './dayTimeNano'

export type InstantArg = Instant | string

export type Instant = TemporalInstance<DayTimeNano>
export const [
  Instant,
  createInstant,
  toInstantEpochNano
] = createTemporalClass(
  'Instant',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (epochNano: bigint) => {
    return checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano)))
  },

  // internalsConversionMap
  {
    ZonedDateTime: (argInternals: ZonedInternals) => argInternals.epochNanoseconds,
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
    toZonedDateTimeISO(epochNano: DayTimeNano, timeZoneArg: TimeZoneArg): ZonedDateTime {
      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone: queryTimeZoneOps(timeZoneArg),
        calendar: queryCalendarOps(isoCalendarId),
      })
    },

    toZonedDateTime(
      epochNano: DayTimeNano,
      options: { timeZone: TimeZoneArg, calendar: CalendarArg },
    ): ZonedDateTime {
      const refinedObj = ensureObjectlike(options)

      return createZonedDateTime({
        epochNanoseconds: epochNano,
        timeZone: queryTimeZoneOps(refinedObj.timeZone),
        calendar: queryCalendarOps(refinedObj.calendar),
      })
    },

    add(epochNano: DayTimeNano, durationArg: DurationArg): Instant {
      return createInstant(
        moveEpochNano(
          epochNano,
          toDurationInternals(durationArg),
        ),
      )
    },

    subtract(epochNano: DayTimeNano, durationArg: DurationArg): Instant {
      return createInstant(
        moveEpochNano(
          epochNano,
          negateDurationInternals(toDurationInternals(durationArg)),
        ),
      )
    },

    until(epochNano: DayTimeNano, otherArg: InstantArg, options?: DiffOptions): Duration {
      return createDuration(diffInstants(epochNano, toInstantEpochNano(otherArg), options))
    },

    since(epochNano: DayTimeNano, otherArg: InstantArg, options?: DiffOptions): Duration {
      return createDuration(diffInstants(epochNano, toInstantEpochNano(otherArg), options, true))
    },

    round(epochNano: DayTimeNano, options: RoundingOptions | UnitName): Instant {
      return createInstant(roundInstant(epochNano, options))
    },

    equals(epochNano: DayTimeNano, otherArg: InstantArg): boolean {
      return !compareDayTimeNanos(
        epochNano,
        toInstantEpochNano(otherArg),
      )
    },

    toString(
      epochNano: DayTimeNano,
      options?: InstantDisplayOptions
    ): string {
      return formatInstantIso(epochNano, options)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    fromEpochSeconds(epochSec: number): Instant {
      return createInstant(checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec)))
    },

    fromEpochMilliseconds(epochMilli: number): Instant {
      return createInstant(checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)))
    },

    fromEpochMicroseconds(epochMicro: bigint): Instant {
      return createInstant(checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro)))
    },

    fromEpochNanoseconds(epochNano: bigint): Instant {
      return createInstant(checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))))
    },

    compare(a: InstantArg, b: InstantArg): NumSign {
      return compareDayTimeNanos(
        toInstantEpochNano(a),
        toInstantEpochNano(b),
      )
    }
  },
)

// Legacy Date
// -------------------------------------------------------------------------------------------------

export function toTemporalInstant(this: Date): Instant {
  // TODO: more DRY
  return createInstant(numberToDayTimeNano(this.valueOf(), nanoInMilli))
}
