import { TemporalInstance, createTemporalClass, neverValueOf } from './class'
import { mergeDurationBag, refineDurationBag } from './convert'
import {
  absDurationInternals,
  addDayTimeDurationFields,
  durationInternalGetters,
  negateDurationInternals,
  refineDurationFields,
  DurationInternals,
  DurationFields,
  durationFieldNamesAsc,
  updateDurationFieldsSign,
} from './durationFields'
import { formatDurationInternals } from './isoFormat'
import { parseDuration } from './isoParse'
import {
  RelativeToOptions,
  SubsecDigits,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
  refineDurationRoundOptions,
  refineRelativeToOptions,
  refineTimeDisplayOptions,
  refineTotalOptions,
} from './options'
import {
  MarkerSystem,
  SimpleMarkerSystem,
  roundDayTimeDuration,
  roundDurationToNano,
  roundRelativeDuration,
  totalDayTimeDuration,
  totalRelativeDuration,
} from './round'
import { NumSign, noop } from './utils'
import { DayTimeUnit, Unit, UnitName, givenFieldsToDayTimeNano } from './units'
import { MarkerToEpochNano, MoveMarker, DiffMarkers, createMarkerSystem } from './round'
import { DayTimeNano, compareDayTimeNanos } from './dayTimeNano'

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
      const durationLargestUnit = getLargestDurationUnit(internals)
      const [
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        markerInternals,
      ] = refineDurationRoundOptions(options, durationLargestUnit)

      const maxLargestUnit = Math.max(durationLargestUnit, largestUnit)

      // TODO: move to round.js?

      if (
        maxLargestUnit < Unit.Day || (
          maxLargestUnit === Unit.Day &&
          // has uniform days?
          !(markerInternals && (markerInternals as any).epochNanoseconds)
        )
      ) {
        // TODO: check internals doesn't have large fields
        return createDuration(
          updateDurationFieldsSign(
            roundDayTimeDuration(
              internals,
              largestUnit as DayTimeUnit,
              smallestUnit as DayTimeUnit,
              roundingInc,
              roundingMode
            ),
          )
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

      return createDuration(
        updateDurationFieldsSign(
          roundRelativeDuration(
            ...spanDuration(internals, undefined, largestUnit, ...markerSystem),
            largestUnit,
            smallestUnit,
            roundingInc,
            roundingMode,
            ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
          ),
        ),
      )
    },

    total(internals: DurationInternals, options: TotalUnitOptionsWithRel | UnitName): number {
      const [totalUnit, markerInternals] = refineTotalOptions(options)
      const largestUnit = Math.max(
        getLargestDurationUnit(internals),
        totalUnit,
      ) as Unit

      if (
        largestUnit < Unit.Day || (
          largestUnit === Unit.Day &&
          // has uniform days?
          !(markerInternals && (markerInternals as any).epochNanoseconds)
        )
      ) {
        return totalDayTimeDuration(internals, totalUnit as DayTimeUnit)
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

      return totalRelativeDuration(
        ...spanDuration(internals, undefined, largestUnit, ...markerSystem),
        totalUnit,
        ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
      )
    },

    toString(internals: DurationInternals, options?: TimeDisplayOptions): string {
      const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options, Unit.Second)

      return formatDurationInternals(
        updateDurationFieldsSign(
          roundDurationToNano(
            internals,
            Math.min(getLargestDurationUnit(internals), Unit.Hour),
            nanoInc,
            roundingMode,
            true, // timeOnly
          )
        ),
        subsecDigits as (SubsecDigits | undefined), // -1 won't happen (units can't be minutes)
      )
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(
      durationArg0: DurationArg,
      durationArg1: DurationArg,
      options?: RelativeToOptions,
    ): NumSign {
      const durationFields0 = toDurationInternals(durationArg0)
      const durationFields1 = toDurationInternals(durationArg1)
      const markerInternals = refineRelativeToOptions(options)
      const largestUnit = Math.max(
        getLargestDurationUnit(durationFields0),
        getLargestDurationUnit(durationFields1),
      ) as Unit

      if (
        largestUnit < Unit.Day || (
          largestUnit === Unit.Day &&
          // has uniform days?
          !(markerInternals && (markerInternals as any).epochNanoseconds)
        )
      ) {
        return compareDayTimeNanos(
          givenFieldsToDayTimeNano(durationFields0, Unit.Day, durationFieldNamesAsc),
          givenFieldsToDayTimeNano(durationFields1, Unit.Day, durationFieldNamesAsc)
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

      return compareDayTimeNanos(
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
  options: RelativeToOptions | undefined,
): Duration {
  let otherFields = toDurationInternals(otherArg)
  const markerInternals = refineRelativeToOptions(options) // optional
  const largestUnit = Math.max(
    getLargestDurationUnit(internals),
    getLargestDurationUnit(otherFields),
  ) as Unit

  if (
    largestUnit < Unit.Day || (
      largestUnit === Unit.Day &&
      // has uniform days?
      !(markerInternals && (markerInternals as any).epochNanoseconds)
    )
  ) {
    return createDuration(
      updateDurationFieldsSign(
        addDayTimeDurationFields(internals, otherFields, direction, largestUnit as DayTimeUnit)
      )
    )
  }

  if (!markerInternals) {
    throw new RangeError('relativeTo is required for years, months, or weeks arithmetic')
  }

  if (direction === -1) {
    otherFields = negateDurationInternals(otherFields)
  }

  const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>
  return createDuration(
    spanDuration(
      internals,
      otherFields,
      largestUnit,
      ...markerSystem,
    )[0]
  )
}

function spanDuration<M>(
  durationFields0: DurationFields,
  durationFields1: DurationFields | undefined,
  largestUnit: Unit, // TODO: more descrimination?
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
  diffMarkers: DiffMarkers<M>,
): [
  DurationInternals,
  DayTimeNano,
] {
  let endMarker = moveMarker(marker, durationFields0)

  if (durationFields1) {
    endMarker = moveMarker(endMarker, durationFields1)
  }

  const balancedDuration = diffMarkers(marker, endMarker, largestUnit)
  return [balancedDuration, markerToEpochNano(endMarker)]
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
