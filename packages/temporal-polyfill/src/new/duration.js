import { createTemporalClass, neverValueOf } from './class'
import { mergeDurationBag, refineDurationBag } from './convert'
import { diffZonedEpochNano } from './diff'
import {
  absDurationInternals,
  addDurationFields,
  durationFieldsToNano,
  durationGetters,
  negateDurationInternals,
  refineDurationFields,
} from './durationFields'
import { formatDurationInternals } from './isoFormat'
import { isoToEpochNano } from './isoMath'
import { parseDuration } from './isoParse'
import { compareLargeInts } from './largeInt'
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
import { dayIndex } from './units'
import { identityFunc, noop } from './utils'

export const [
  Duration,
  createDuration,
  toDurationInternals,
] = createTemporalClass(
  'Duration',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
    microseconds = 0,
    nanoseconds = 0,
  ) => {
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
    ...durationGetters,

    blank(internals) {
      return !internals.sign
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with: mergeDurationBag,

    add: addToDuration.bind(undefined, 1),

    subtract: addToDuration.bind(undefined, -1),

    negated(internals) {
      return createDuration(negateDurationInternals(internals))
    },

    abs(internals) {
      return createDuration(absDurationInternals(internals))
    },

    round(internals, options) {
      const [
        largestUnitIndex,
        smallestUnitIndex,
        roundingIncrement,
        roundingMode,
        markerInternals,
      ] = refineDurationRoundOptions(options, getLargestDurationUnit(internals))

      // TODO: move to round.js?

      if (largestUnitIndex < dayIndex || (largestUnitIndex === dayIndex && !markerInternals)) {
        // TODO: check internals doesn't have large fields
        return createDuration(
          roundDayTimeDuration(internals, smallestUnitIndex, roundingIncrement, roundingMode),
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals, internals, largestUnitIndex)

      return createDuration(
        roundRelativeDuration(
          ...spanDuration(internals, largestUnitIndex, ...markerSystem),
          largestUnitIndex,
          smallestUnitIndex,
          roundingIncrement,
          roundingMode,
          ...markerSystem,
        ),
      )
    },

    total(internals, options) {
      const [totalUnitIndex, markerInternals] = refineTotalOptions(options)
      const largestUnitIndex = getLargestDurationUnit(internals)

      if (largestUnitIndex < dayIndex || (largestUnitIndex === dayIndex && !markerInternals)) {
        return totalDayTimeDuration(internals, totalUnitIndex)
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals, internals, largestUnitIndex)

      return totalRelativeDuration(
        ...spanDuration(internals, largestUnitIndex, ...markerSystem),
        totalUnitIndex,
        ...markerSystem,
      )
    },

    toString(internals, options) {
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
    compare(durationArg0, durationArg1, options) {
      const durationFields0 = toDurationInternals(durationArg0)
      const durationFields1 = toDurationInternals(durationArg1)
      const markerInternals = refineRelativeToOptions(options)
      const largestUnitIndex = Math.max(
        getLargestDurationUnit(durationFields0),
        getLargestDurationUnit(durationFields1),
      )

      if (largestUnitIndex < dayIndex || (largestUnitIndex === dayIndex && !markerInternals)) {
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

function addToDuration(direction, internals, otherArg, options) {
  const otherFields = toDurationInternals(otherArg)
  const markerInternals = refineRelativeToOptions(options) // optional
  const largestUnitIndex = Math.max(
    getLargestDurationUnit(internals),
    getLargestDurationUnit(otherFields),
  )

  const addedDurationFields = addDurationFields(internals, otherFields, direction)

  if (largestUnitIndex < dayIndex || (largestUnitIndex === dayIndex && !markerInternals)) {
    return balanceDurationDayTime(addedDurationFields)
  }

  const markerSystem = createMarkerSystem(markerInternals, internals, largestUnitIndex)
  return spanDuration(internals, largestUnitIndex, ...markerSystem)[0]
}

function createMarkerSystem(markerInternals) {
  const { calendar, timeZone, epochNanoseconds } = markerInternals

  if (epochNanoseconds) {
    return [
      epochNanoseconds, // marker
      identityFunc, // markerToEpochNano
      moveZonedEpochNano.bind(undefined, calendar, timeZone), // moveMarker
      diffZonedEpochNano.bind(undefined, calendar, timeZone), // diffMarkers
    ]
  } else {
    return [
      markerInternals, // marker (IsoDateFields)
      isoToEpochNano, // markerToEpochNano
      calendar.dateAdd.bind(calendar), // moveMarker
      calendar.dateUntil.bind(calendar), // diffMarkers
    ]
  }
}

function spanDuration(
  durationFields,
  largestUnitIndex,
  // marker system...
  marker,
  markerToEpochNano,
  moveMarker,
  diffMarkers,
) {
  const endMarker = markerToEpochNano(moveMarker(marker, durationFields))
  const balancedDuration = diffMarkers(marker, endMarker, largestUnitIndex)
  return [balancedDuration, endMarker]
}

function balanceDurationDayTime(
  durationFields,
  largestUnitIndex, // day/time
) {
}

function getLargestDurationUnit(durationFields) {
  // TODO: rename to getLargestDurationUnitIndex
  // TODO: move to DurationFields math
}
