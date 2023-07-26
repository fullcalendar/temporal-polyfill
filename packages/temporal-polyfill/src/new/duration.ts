import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import { mergeDurationBag, refineDurationBag } from './convert'
import { diffZonedEpochNano } from './diff'
import {
  absDurationInternals,
  addDurationFields,
  durationFieldsToNano,
  durationInternalGetters,
  negateDurationInternals,
  refineDurationFields,
  DurationInternals,
  DurationFields,
  durationFieldNamesAsc,
  nanoToDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import { formatDurationInternals } from './isoFormat'
import { isoToEpochNano } from './isoMath'
import { parseDuration } from './isoParse'
import { LargeInt, compareLargeInts } from './largeInt'
import { moveZonedEpochNano } from './move'
import {
  refineDurationRoundOptions,
  refineRelativeToOptions,
  refineTimeDisplayOptions,
  refineTotalOptions,
} from './options'
import {
  roundDayTimeDuration,
  roundDurationToNano,
  roundRelativeDuration,
  totalDayTimeDuration,
  totalRelativeDuration,
} from './round'
import { NumSign, identityFunc, noop } from './utils'
import { DayTimeUnit, Unit } from './units'
import { ZonedInternals } from './zonedDateTime'
import { IsoDateFields, IsoDateInternals } from './isoFields'

export type DurationArg = Duration | DurationBag | string
export type DurationBag = Partial<DurationFields>
export type DurationMod = Partial<DurationFields>

export type Duration = TemporalInstance<DurationInternals>
export const [
  Duration,
  createDuration,
  toDurationInternals
] = createTemporalClass(
  'Duration',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    years: number = 0,
    months: number = 0,
    weeks: number = 0,
    days: number = 0,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0,
    microseconds: number = 0,
    nanoseconds: number = 0,
  ): DurationInternals => {
    return refineDurationFields({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
    })
  },

  // internalsConversionMap
  {},

  // bagToInternals
  refineDurationBag,

  // stringToInternals
  parseDuration,

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    ...durationInternalGetters,

    blank(internals: DurationInternals): boolean {
      return !internals.sign
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(internals: DurationInternals, mod: DurationMod): Duration {
      return createDuration(mergeDurationBag(internals, mod))
    },

    add: addToDuration.bind(undefined, 1),

    subtract: addToDuration.bind(undefined, -1),

    negated(internals: DurationInternals): Duration {
      return createDuration(negateDurationInternals(internals))
    },

    abs(internals: DurationInternals): Duration {
      return createDuration(absDurationInternals(internals))
    },

    round(internals: DurationInternals, options): Duration {
      const [
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        markerInternals,
      ] = refineDurationRoundOptions(options, getLargestDurationUnit(internals))

      // TODO: move to round.js?

      if (largestUnit < Unit.Day || (largestUnit === Unit.Day && !markerInternals)) {
        // TODO: check internals doesn't have large fields
        return createDuration(
          roundDayTimeDuration(internals, smallestUnit, roundingInc, roundingMode),
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals)

      return createDuration(
        roundRelativeDuration(
          ...spanDuration(internals, largestUnit, ...markerSystem),
          largestUnit,
          smallestUnit,
          roundingInc,
          roundingMode,
          ...(markerSystem as unknown as [Marker, MarkerToEpochNano, MoveMarker]),
        ),
      )
    },

    total(internals: DurationInternals, options): number {
      const [totalUnitIndex, markerInternals] = refineTotalOptions(options)
      const largestUnit = getLargestDurationUnit(internals)

      if (largestUnit < Unit.Day || (largestUnit === Unit.Day && !markerInternals)) {
        return totalDayTimeDuration(internals, totalUnitIndex)
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals)

      return totalRelativeDuration(
        ...spanDuration(internals, largestUnit, ...markerSystem),
        totalUnitIndex,
        ...(markerSystem as unknown as [Marker, MarkerToEpochNano, MoveMarker]),
      )
    },

    toString(internals: DurationInternals, options: any): string {
      const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options)

      return formatDurationInternals(
        roundDurationToNano(internals, nanoInc, roundingMode),
        subsecDigits,
      )
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(durationArg0: DurationArg, durationArg1: DurationArg, options: any): NumSign {
      const durationFields0 = toDurationInternals(durationArg0)
      const durationFields1 = toDurationInternals(durationArg1)
      const markerInternals = refineRelativeToOptions(options)
      const largestUnit = Math.max(
        getLargestDurationUnit(durationFields0),
        getLargestDurationUnit(durationFields1),
      )

      if (largestUnit < Unit.Day || (largestUnit === Unit.Day && !markerInternals)) {
        return compareLargeInts(
          durationFieldsToNano(durationFields0),
          durationFieldsToNano(durationFields1),
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(markerInternals)

      return compareLargeInts(
        markerToEpochNano(moveMarker(marker, durationFields0)),
        markerToEpochNano(moveMarker(marker, durationFields1)),
      )
    },
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

function addToDuration(
  direction: -1 | 1,
  internals: DurationInternals,
  otherArg: DurationArg,
  options: any, // !!!
): Duration {
  const otherFields = toDurationInternals(otherArg)
  const markerInternals = refineRelativeToOptions(options) // optional
  const largestUnit = Math.max(
    getLargestDurationUnit(internals),
    getLargestDurationUnit(otherFields),
  ) as Unit

  const addedDurationFields = addDurationFields(internals, otherFields, direction)

  if (largestUnit < Unit.Day || (largestUnit === Unit.Day && !markerInternals)) {
    return balanceDurationDayTime(addedDurationFields, largestUnit as DayTimeUnit)
  }

  const markerSystem = createMarkerSystem(markerInternals)
  return createDuration(spanDuration(internals, largestUnit, ...markerSystem)[0])
}

type Marker = LargeInt | IsoDateFields
type MarkerToEpochNano = (marker: Marker) => LargeInt
type MoveMarker = (marker: Marker, durationInternals: DurationInternals) => Marker
type DiffMarkers = (marker0: Marker, marker1: Marker, largeUnit: Unit) => DurationInternals
type MarkerSystem = [
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  DiffMarkers,
]

function createMarkerSystem(
  markerInternals: ZonedInternals | IsoDateInternals
): MarkerSystem {
  const { calendar, timeZone, epochNanoseconds } = markerInternals as ZonedInternals

  if (epochNanoseconds) {
    return [
      epochNanoseconds, // marker
      identityFunc, // markerToEpochNano
      moveZonedEpochNano.bind(undefined, calendar, timeZone), // moveMarker
      diffZonedEpochNano.bind(undefined, calendar, timeZone), // diffMarkers
    ]
  } else {
    return [
      markerInternals as IsoDateFields, // marker (IsoDateFields)
      isoToEpochNano as (marker: Marker) => LargeInt, // markerToEpochNano
      calendar.dateAdd.bind(calendar), // moveMarker
      calendar.dateUntil.bind(calendar), // diffMarkers
    ]
  }
}

function spanDuration(
  durationFields: DurationFields,
  largestUnit: Unit, // TODO: more descrimination?
  // marker system...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  diffMarkers: DiffMarkers,
): [
  DurationInternals,
  Marker,
] {
  const endMarker = markerToEpochNano(moveMarker(marker, durationFields))
  const balancedDuration = diffMarkers(marker, endMarker, largestUnit)
  return [balancedDuration, endMarker]
}

function balanceDurationDayTime(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit, // day/time
): Duration {
  const nano = durationFieldsToNano(durationFields)
  return createDuration(
    updateDurationFieldsSign(nanoToDurationFields(nano, largestUnit))
  )
}

function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
