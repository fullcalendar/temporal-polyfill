import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOpsQuery'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import { diffEpochNano } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { negateDurationInternals, updateDurationFieldsSign } from './durationFields'
import { formatIsoDateTimeFields, formatOffsetNano } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { epochGetters, epochNanoToIso, checkEpochNanoInBounds } from './isoMath'
import { parseInstant } from './isoParse'
import { moveEpochNano } from './move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingMode,
  RoundingOptions,
  refineDiffOptions,
  refineInstantDisplayOptions,
  refineRoundOptions,
} from './options'
import { toBigInt, ensureObjectlike } from './cast'
import { roundDayTimeNano, roundDayTimeNanoByInc, roundToMinute } from './round'
import { queryTimeZoneOps, utcTimeZoneId } from './timeZoneOps'
import { NumSign, noop } from './utils'
import { ZonedDateTime, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { TimeUnit, Unit, UnitName, nanoInMicro, nanoInMilli, nanoInMinute, nanoInSec } from './units'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { DayTimeNano, addDayTimeNanoAndNumber, bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from './dayTimeNano'

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
      return diffInstants(epochNano, toInstantEpochNano(otherArg), options)
    },

    since(epochNano: DayTimeNano, otherArg: InstantArg, options?: DiffOptions): Duration {
      return diffInstants(epochNano, toInstantEpochNano(otherArg), options, true)
    },

    round(epochNano: DayTimeNano, options: RoundingOptions | UnitName): Instant {
      const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(
        options,
        Unit.Hour,
        true, // solarMode
      )

      return createInstant(
        roundDayTimeNano(
          epochNano,
          smallestUnit as TimeUnit,
          roundingInc,
          roundingMode,
          true, // useDayOrigin
        ),
      )
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
      const [
        timeZoneArg,
        nanoInc,
        roundingMode,
        subsecDigits,
      ] = refineInstantDisplayOptions(options)
      const timeZone = queryTimeZoneOps(timeZoneArg !== undefined ? timeZoneArg : utcTimeZoneId)

      epochNano = roundDayTimeNanoByInc(
        epochNano,
        nanoInc,
        roundingMode,
        true, // useDayOrigin
      )

      let offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
      const isoFields = epochNanoToIso(epochNano, offsetNano)

      return formatIsoDateTimeFields(isoFields, subsecDigits) +
        (timeZoneArg
          ? formatOffsetNano(roundToMinute(offsetNano))
          : 'Z'
        )
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

function diffInstants(
  epochNano0: DayTimeNano,
  epochNano1: DayTimeNano,
  options?: DiffOptions,
  invert?: boolean
): Duration {
  let durationInternals = updateDurationFieldsSign(
    diffEpochNano(
      epochNano0,
      epochNano1,
      ...(
        refineDiffOptions(invert, options, Unit.Second, Unit.Hour) as
          [TimeUnit, TimeUnit, number, RoundingMode]
      ),
    ),
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return createDuration(durationInternals)
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

export function toTemporalInstant(this: Date): Instant {
  // TODO: more DRY
  return createInstant(numberToDayTimeNano(this.valueOf(), nanoInMilli))
}
