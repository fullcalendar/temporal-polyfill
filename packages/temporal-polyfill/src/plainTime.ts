import { TimeBag, timeGetters } from './calendarFields'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import {
  createZonedDateTimeConverter,
  mergePlainTimeBag,
  refinePlainTimeBag,
} from './convert'
import { diffTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals, updateDurationFieldsSign } from './durationFields'
import { IsoTimeFields, pluckIsoTimeFields, refineIsoTimeFields } from './isoFields'
import { formatIsoTimeFields } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { compareIsoTimeFields } from './isoMath'
import { parsePlainTime } from './isoParse'
import { moveTime } from './move'
import {
  DiffOptions,
  RoundingMode,
  RoundingOptions,
  TimeDisplayOptions,
  refineDiffOptions,
  refineOverflowOptions,
  refineRoundOptions,
  refineTimeDisplayOptions,
} from './options'
import { PlainDateArg, toPlainDateInternals } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { roundTime, roundTimeToNano } from './round'
import { zonedInternalsToIso } from './timeZoneOps'
import { TimeUnit, Unit, UnitName } from './units'
import { NumSign } from './utils'
import { ZonedInternals } from './zonedDateTime'

export type PlainTimeArg = PlainTime | PlainTimeBag | string
export type PlainTimeBag = TimeBag
export type PlainTimeMod = TimeBag

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
    return refineIsoTimeFields({
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
    ZonedDateTime(argInternals: ZonedInternals) {
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

    until(fields: IsoTimeFields, otherArg: PlainTimeArg, options?: DiffOptions): Duration {
      return diffPlainTimes(fields, toPlainTimeFields(otherArg), options)
    },

    since(fields: IsoTimeFields, otherArg: PlainTimeArg, options?: DiffOptions): Duration {
      return diffPlainTimes(toPlainTimeFields(otherArg), fields, options, true)
    },

    round(fields: IsoTimeFields, options: RoundingOptions | UnitName): PlainTime {
      return createPlainTime(
        roundTime(
          fields,
          ...(refineRoundOptions(options, Unit.Hour) as [TimeUnit, number, RoundingMode])
        ),
      )
    },

    equals(fields: IsoTimeFields, other: PlainTimeArg): boolean {
      const otherInternals = toPlainTimeFields(other)
      return !compareIsoTimeFields(fields, otherInternals)
    },

    toString(fields: IsoTimeFields, options?: TimeDisplayOptions): string {
      const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options)

      return formatIsoTimeFields(
        roundTimeToNano(fields, nanoInc, roundingMode)[0],
        subsecDigits,
      )
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime: createZonedDateTimeConverter((options: { plainDate: PlainDateArg }) => {
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
  return createPlainTime(moveTime(internals, durationInternals, true)[0])
}

function diffPlainTimes(
  internals0: IsoTimeFields,
  internals1: IsoTimeFields,
  options: DiffOptions | undefined,
  roundingModeInvert?: boolean
): Duration {
  return createDuration(
    updateDurationFieldsSign(
      diffTimes(
        internals0,
        internals1,
        ...(refineDiffOptions(roundingModeInvert, options, Unit.Hour, Unit.Hour) as [TimeUnit, TimeUnit, number, RoundingMode]),
      ),
    )
  )
}
