import { TimeFields, timeGetters } from './calendarFields'
import { TemporalInstance, createTemporalClass, neverValueOf, toLocaleStringMethod } from './class'
import {
  createZonedDateTimeConverter,
  mergePlainTimeBag,
  refinePlainTimeBag,
} from './convert'
import { diffTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals } from './durationFields'
import { IsoTimeFields, pluckIsoTimeFields } from './isoFields'
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
import { Unit } from './units'

export type PlainTimeBag = Partial<TimeFields>
export type PlainTimeArg = PlainTime | PlainTimeBag | string

export type PlainTime = TemporalInstance<IsoTimeFields>
export const [PlainTime, createPlainTime, toPlainTimeInternals] = createTemporalClass(
  'PlainTime',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    isoMicrosecond: number = 0,
    isoNanosecond: number = 0,
  ): IsoTimeFields => {
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
    with(internals: IsoTimeFields, bag, options): PlainTime {
      return createPlainTime(mergePlainTimeBag(this, bag, options))
    },

    add(internals: IsoTimeFields, durationArg: DurationArg): PlainTime {
      return movePlainTime(internals, toDurationInternals(durationArg))
    },

    subtract(internals: IsoTimeFields, durationArg: DurationArg): PlainTime {
      return movePlainTime(internals, negateDurationInternals(toDurationInternals(durationArg)))
    },

    until(internals: IsoTimeFields, otherArg: PlainTimeArg, options): Duration {
      return diffPlainTimes(internals, toPlainTimeInternals(otherArg), options)
    },

    since(internals: IsoTimeFields, otherArg: PlainTimeArg, options): Duration {
      return diffPlainTimes(toPlainTimeInternals(otherArg), internals, options, true)
    },

    round(internals: IsoTimeFields, options): PlainTime {
      return createPlainTime(
        roundTime(internals, ...refineRoundOptions(options, Unit.Hour)),
      )
    },

    equals(internals: IsoTimeFields, other: PlainTimeArg): boolean {
      const otherInternals = toPlainTimeInternals(other)
      return !compareIsoTimeFields(internals, otherInternals)
    },

    toString(internals: IsoTimeFields, options) {
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
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg) {
      return compareIsoTimeFields(
        toPlainTimeInternals(arg0),
        toPlainTimeInternals(arg1),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function movePlainTime(internals: IsoTimeFields, durationInternals: DurationInternals): PlainTime {
  return createPlainTime(moveTime(internals, durationInternals)[0])
}

function diffPlainTimes(
  internals0: IsoTimeFields,
  internals1: IsoTimeFields,
  options,
  roundingModeInvert?: boolean
): Duration {
  return createDuration(
    diffTimes(
      internals0,
      internals1,
      ...refineDiffOptions(roundingModeInvert, options, hourIndex, hourIndex),
    ),
  )
}
