import { TimeBag, timeGetters } from './calendarFields'
import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import {
  createZonedDateTimeConverter,
  mergePlainTimeBag,
  refinePlainTimeBag,
} from './convert'
import { diffPlainTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationInternals } from './duration'
import { DurationInternals, negateDurationInternals } from './durationFields'
import { IsoTimeFields, pluckIsoTimeFields, refineIsoTimeFields } from './isoFields'
import { formatPlainTimeIso } from './isoFormat'
import { toLocaleStringMethod } from './intlFormat'
import { checkIsoDateTimeInBounds, compareIsoTimeFields } from './isoMath'
import { parsePlainTime } from './isoParse'
import { moveTime } from './move'
import {
  DiffOptions,
  RoundingOptions,
  TimeDisplayOptions,
  refineOverflowOptions,
} from './options'
import { PlainDateArg, toPlainDateInternals } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { roundPlainTime } from './round'
import { zonedInternalsToIso } from './timeZoneOps'
import { UnitName } from './units'
import { NumSign } from './utils'
import { ZonedDateTime, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { TimeZoneArg } from './timeZone'

export type PlainTimeArg = PlainTime | PlainTimeBag | string
export type PlainTimeBag = TimeBag
export type PlainTimeMod = TimeBag

const zonedDateTimeConverter = createZonedDateTimeConverter((options: { plainDate: PlainDateArg }) => {
  return toPlainDateInternals(options.plainDate)
})

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
      return createDuration(diffPlainTimes(fields, toPlainTimeFields(otherArg), options))
    },

    since(fields: IsoTimeFields, otherArg: PlainTimeArg, options?: DiffOptions): Duration {
      return createDuration(diffPlainTimes(fields, toPlainTimeFields(otherArg), options, true))
    },

    round(fields: IsoTimeFields, options: RoundingOptions | UnitName): PlainTime {
      return createPlainTime(roundPlainTime(fields, options))
    },

    equals(fields: IsoTimeFields, other: PlainTimeArg): boolean {
      const otherInternals = toPlainTimeFields(other)
      return !compareIsoTimeFields(fields, otherInternals)
    },

    toString(fields: IsoTimeFields, options?: TimeDisplayOptions): string {
      return formatPlainTimeIso(fields, options)
    },

    toLocaleString: toLocaleStringMethod,

    valueOf: neverValueOf,

    toZonedDateTime(
      internals: IsoTimeFields,
      options: { timeZone: TimeZoneArg, plainDate: PlainDateArg },
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeConverter(internals, options)
      )
    },

    toPlainDateTime(fields: IsoTimeFields, plainDateArg: PlainDateArg): PlainDateTime {
      return createPlainDateTime(
        checkIsoDateTimeInBounds({
          ...fields,
          ...toPlainDateInternals(plainDateArg),
        }),
      )
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
