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
import { PlainDateArg, toPlainDateInternals } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { roundTime, roundTimeToNano } from './round'
import { zonedInternalsToIso } from './timeZoneOps'
import { Unit } from './units'
import { NumSign } from './utils'

export type PlainTimeArg = PlainTime | PlainTimeBag | string
export type PlainTimeBag = Partial<TimeFields>
export type PlainTimeMod = Partial<TimeFields>

export type PlainTime = TemporalInstance<IsoTimeFields>
export const [
  PlainTime,
  createPlainTime,
  toPlainTimeFields
] = createTemporalClass(
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
    with(fields: IsoTimeFields, mod: PlainTimeMod, options): PlainTime {
      return createPlainTime(mergePlainTimeBag(this, mod, options))
    },

    add(fields: IsoTimeFields, durationArg: DurationArg): PlainTime {
      return movePlainTime(fields, toDurationInternals(durationArg))
    },

    subtract(fields: IsoTimeFields, durationArg: DurationArg): PlainTime {
      return movePlainTime(fields, negateDurationInternals(toDurationInternals(durationArg)))
    },

    until(fields: IsoTimeFields, otherArg: PlainTimeArg, options): Duration {
      return diffPlainTimes(fields, toPlainTimeFields(otherArg), options)
    },

    since(fields: IsoTimeFields, otherArg: PlainTimeArg, options): Duration {
      return diffPlainTimes(toPlainTimeFields(otherArg), fields, options, true)
    },

    round(fields: IsoTimeFields, options): PlainTime {
      return createPlainTime(
        roundTime(fields, ...refineRoundOptions(options, Unit.Hour)),
      )
    },

    equals(fields: IsoTimeFields, other: PlainTimeArg): boolean {
      const otherInternals = toPlainTimeFields(other)
      return !compareIsoTimeFields(fields, otherInternals)
    },

    toString(fields: IsoTimeFields, options: any): string {
      const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options)

      return formatIsoTimeFields(
        roundTimeToNano(fields, nanoInc, roundingMode),
        subsecDigits,
      )
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options) => {
      return toPlainDateInternals(options.plainDate)
    }),

    toPlainDateTime(fields: IsoTimeFields, plainDateArg: PlainDateArg): PlainDateTime {
      return createPlainDateTime({
        ...fields,
        ...toPlainDateInternals(plainDateArg),
      })
    },

    getISOFields: pluckIsoTimeFields,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumSign {
      return compareIsoTimeFields(
        toPlainTimeFields(arg0),
        toPlainTimeFields(arg1),
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
  options: any,
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
