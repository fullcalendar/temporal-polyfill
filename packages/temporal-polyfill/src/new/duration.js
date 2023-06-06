import { refineDurationBag, mergeDurationBag } from './bag'
import { createTemporalClass, neverValueOf } from './class'
import { diffZonedEpochNanoseconds } from './diff'
import {
  absolutizeDurationFields,
  addDurationFields,
  durationGetters,
  negateDurationFields,
  refineDurationInternals,
} from './durationFields'
import { isoToEpochNano } from './isoMath'
import { stringToDurationInternals } from './isoParse'
import { compareLargeInts } from './largeInt'
import { moveZonedEpochNanoseconds } from './move'
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
import { identityFunc, noop } from './util'

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
  stringToDurationInternals,

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

      if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) {
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

      if (largestUnit < 'day' || (largestUnit === 'day' && !markerInternals)) {
        return compareLargeInts(
          durationDayTimeToNanoseconds(durationFields0),
          durationDayTimeToNanoseconds(durationFields1),
        )
      }

      if (!markerInternals) {
        throw new RangeError('need relativeTo')
      }

      const [marker, markerToEpochNanoseconds, moveMarker] = createMarkerSystem(markerInternals)

      return compareLargeInts(
        markerToEpochNanoseconds(moveMarker(marker, durationFields0)),
        markerToEpochNanoseconds(moveMarker(marker, durationFields1)),
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
      identityFunc, // markerToEpochNanoseconds
      moveZonedEpochNanoseconds.bind(undefined, calendar, timeZone), // moveMarker
      diffZonedEpochNanoseconds.bind(undefined, calendar, timeZone), // diffMarkers
    ]
  } else {
    return [
      markerInternals, // marker (IsoDateFields)
      isoToEpochNano, // markerToEpochNanoseconds
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
  markerToEpochNanoseconds,
  moveMarker,
  diffMarkers,
) {
  const endMarker = markerToEpochNanoseconds(moveMarker(marker, durationFields))
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

function durationDayTimeToNanoseconds(
  durationFields, // NOT BALANCED
) {
}
