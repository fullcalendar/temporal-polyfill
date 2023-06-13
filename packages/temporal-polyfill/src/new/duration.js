import { createTemporalClass, neverValueOf } from './class'
import { mergeDurationBag, refineDurationBag } from './convert'
import { diffZonedEpochNano } from './diff'
import {
  absolutizeDurationFields,
  addDurationFields,
  durationFieldsToNano,
  durationGetters,
  negateDurationFields,
  refineDurationInternals,
} from './durationFields'
import { formatDurationInternals } from './isoFormat'
import { isoToEpochNano } from './isoMath'
import { parseDuration } from './isoParse'
import { compareLargeInts } from './largeInt'
import { moveZonedEpochNano } from './move'
import {
  optionsToLargestUnit,
  optionsToRelativeTo,
  optionsToRoundingIncrement,
  optionsToRoundingMode,
  optionsToSmallestUnit,
  optionsToTotalUnit,
} from './options'
import {
  roundDayTimeDuration,
  roundRelativeDuration,
  totalDayTimeDuration,
  totalRelativeDuration,
} from './round'
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
    return refineDurationInternals({
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
      return createDuration(negateDurationFields(internals))
    },

    abs(internals) {
      return createDuration(absolutizeDurationFields(internals))
    },

    round(internals, options) {
      const largestUnit = optionsToLargestUnit(options) // accepts auto?
      const smallestUnit = optionsToSmallestUnit(options)
      const roundingIncrement = optionsToRoundingIncrement(options)
      const roundingMode = optionsToRoundingMode(options)
      const markerInternals = optionsToRelativeTo(options) // optional

      // TODO: move to round.js?

      if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) { // TODO units
        // TODO: check internals doesn't have large fields
        return roundDayTimeDuration(internals, smallestUnit, roundingMode, roundingIncrement)
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals, internals, largestUnit)

      return roundRelativeDuration(
        ...spanDuration(internals, largestUnit, ...markerSystem),
        largestUnit,
        smallestUnit,
        roundingMode,
        roundingIncrement,
        ...markerSystem,
      )
    },

    total(internals, options) {
      const totalUnit = optionsToTotalUnit(options)
      const markerInternals = optionsToRelativeTo(options) // optional
      const largestUnit = getLargestDurationUnit(internals)

      if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) {
        return totalDayTimeDuration(internals, totalUnit)
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const markerSystem = createMarkerSystem(markerInternals, internals, largestUnit)

      return totalRelativeDuration(
        ...spanDuration(internals, largestUnit, ...markerSystem),
        totalUnit,
        ...markerSystem,
      )
    },

    toString: formatDurationInternals,

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(durationArg0, durationArg1, options) {
      const durationFields0 = toDurationInternals(durationArg0)
      const durationFields1 = toDurationInternals(durationArg1)
      const markerInternals = optionsToRelativeTo(options) // optional
      const largestUnit = Math.max(
        getLargestDurationUnit(durationFields0),
        getLargestDurationUnit(durationFields1),
      )

      if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) { // TODO: units
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
  const markerInternals = optionsToRelativeTo(options) // optional
  const largestUnit = Math.max(
    getLargestDurationUnit(internals),
    getLargestDurationUnit(otherFields),
  )

  const addedDurationFields = addDurationFields(internals, otherFields, direction)

  if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) {
    return balanceDurationDayTime(addedDurationFields)
  }

  const markerSystem = createMarkerSystem(markerInternals, internals, largestUnit)
  return spanDuration(internals, largestUnit, ...markerSystem)[0]
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
  largestUnit,
  // marker system...
  marker,
  markerToEpochNano,
  moveMarker,
  diffMarkers,
) {
  const endMarker = markerToEpochNano(moveMarker(marker, durationFields))
  const balancedDuration = diffMarkers(marker, endMarker, largestUnit)
  return [balancedDuration, endMarker]
}

function balanceDurationDayTime(
  durationFields,
  largestUnit, // day/time
) {
}

function getLargestDurationUnit(durationFields) {
}
