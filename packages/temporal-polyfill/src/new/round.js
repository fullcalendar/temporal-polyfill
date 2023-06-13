import {
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationFieldsToNano,
  durationFieldsToTimeNano,
  durationTimeFieldDefaults,
  nanoToDurationFields,
  timeNanoToDurationFields,
} from './durationFields'
import { isoTimeFieldDefaults } from './isoFields'
import { isoTimeFieldsToNano, nanoToIsoTimeAndDay } from './isoMath'
import { addDaysToIsoFields } from './move'
import { computeNanosecondsInDay } from './timeZoneOps'
import { dayIndex, nanoInUtcDay, nanoIndex, unitIndexToNano, weekIndex } from './units'
import { identityFunc } from './utils'

export function roundToMinute(nanoseconds) { // can be positive or negative

}

// Rounding Dates
// -------------------------------------------------------------------------------------------------

export function roundIsoDateTimeFields(
  isoDateTimeFields,
  smallestUnitIndex, // day/time
  roundingMode,
  roundingIncrement,
  timeZoneOps = undefined,
) {
  let isoTimeFields
  let dayDelta

  if (smallestUnitIndex === dayIndex) {
    const nanosecondsInDay = timeZoneOps
      ? computeNanosecondsInDay(timeZoneOps, isoDateTimeFields)
      : nanoInUtcDay

    dayDelta = roundWithDivisor(
      isoTimeFieldsToNano(isoDateTimeFields),
      nanosecondsInDay,
      roundingMode,
    )

    isoTimeFields = isoTimeFieldDefaults
  } else {
    ([isoTimeFields, dayDelta] = roundIsoTimeFields(
      isoDateTimeFields,
      smallestUnitIndex,
      roundingMode,
      roundingIncrement,
    ))
  }

  return {
    ...addDaysToIsoFields(isoDateTimeFields, dayDelta),
    ...isoTimeFields,
  }
}

export function roundIsoTimeFields(
  isoTimeFields,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  const timeNano = roundNano(
    isoTimeFieldsToNano(isoTimeFields),
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
  )
  return nanoToIsoTimeAndDay(timeNano)
}

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  const largeNano = durationFieldsToNano(durationFields)
  const r = roundLargeNano(largeNano, smallestUnitIndex, roundingMode, roundingIncrement)
  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(r),
  }
}

export function roundRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNanoseconds,
  largestUnitIndex,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  if (smallestUnitIndex === nanoIndex && roundingIncrement === 1) {
    return durationFields
  }

  let [roundedDurationFields, roundedEpochNanoseconds, grew] = (
    smallestUnitIndex >= dayIndex
      ? nudgeRelativeDuration
      : markerToEpochMilliseconds === identityFunc // marker is ZonedDateTime's epochNanoseconds?
        ? nudgeRelativeDurationTime
        : nudgeDurationTime
  )(
    durationFields,
    endEpochNanoseconds,
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
    // marker system only needed for nudgeRelativeDuration...
    marker,
    moveMarker,
    markerToEpochMilliseconds,
  )

  // grew a day/week/month/year?
  if (grew) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNanoseconds,
      largestUnitIndex,
      smallestUnitIndex,
      // marker system...
      marker,
      moveMarker,
      markerToEpochMilliseconds,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -------------------------------------------------------------------------------------------------

export function roundLargeNano(largeNano, smallestUnitIndex, roundingMode, roundingIncrement) {
  const divisor = unitIndexToNano[smallestUnitIndex] * roundingIncrement
  const [n, remainder] = largeNano.divModTrunc(divisor)
  return n.mult(divisor).add(roundWithMode(remainder / divisor, roundingMode))
}

export function roundNano(nano, smallestUnitIndex, roundingMode, roundingIncrement) {
  return roundWithDivisor(
    nano,
    unitIndexToNano[smallestUnitIndex] * roundingIncrement,
    roundingMode,
  )
}

function roundWithDivisor(num, divisor, roundingMode) {
  return roundWithMode(num / divisor, roundingMode) * divisor
}

function roundWithMode(num, roundingMode) {
}

// Total Duration
// -------------------------------------------------------------------------------------------------

export function totalDayTimeDuration( // assumes iso-length days
  durationFields,
  totalUnitIndex,
) {
  const largeNano = durationFieldsToNano(durationFields)
  const divisor = unitIndexToNano[totalUnitIndex]
  const [fullUnit, remainder] = largeNano.divModTrunc(divisor)
  return fullUnit.toNumber() + (remainder / divisor)
}

export function totalRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds,
  totalUnitIndex,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  const [epochNanoseconds0, epochNanoseconds1] = clampRelativeDuration(
    clearDurationFields(durationFields, nanoIndex, totalUnitIndex - 1),
    totalUnitIndex,
    sign,
    // marker system...
    marker,
    moveMarker,
    markerToEpochMilliseconds,
  )

  const portion =
    endEpochNanoseconds.subtract(epochNanoseconds0).toNumber() /
    epochNanoseconds1.subtract(epochNanoseconds0).toNumber()

  return durationFields[durationFieldNamesAsc[totalUnitIndex]] + portion
}

// Nudge
// -------------------------------------------------------------------------------------------------

function nudgeDurationTime(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds, // NOT NEEDED, just for adding result to
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  const timeNano = durationFieldsToTimeNano(durationFields)
  const roundedTimeNano = roundNano(timeNano, smallestUnitIndex, roundingMode, roundingIncrement)
  const roundedFields = nanoToDurationFields(roundedTimeNano)
  const dayDelta = roundedFields.days
  const nudgedDurationFields = { // TODO: what about sign?
    ...durationFields,
    ...roundedFields,
    days: durationFields.days + dayDelta,
  }

  return [
    nudgedDurationFields,
    endEpochNanoseconds.add(roundedTimeNano - timeNano),
    dayDelta,
  ]
}

function nudgeRelativeDurationTime(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds, // NOT NEEDED, just for conformance
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields
  const timeNano = durationFieldsToTimeNano(durationFields)
  let roundedTimeNano = roundNano(timeNano, smallestUnitIndex, roundingMode, roundingIncrement)

  const [dayEpochNanoseconds0, dayEpochNanoseconds1] = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    'days',
    sign,
    // marker system...
    marker,
    markerToEpochMilliseconds,
    moveMarker,
  )

  const daySpanEpochNanoseconds = dayEpochNanoseconds1.subtract(dayEpochNanoseconds0).toNumber()
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds
  let dayDelta = 0

  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta++
    roundedTimeNano = roundNano(beyondDay, smallestUnitIndex, roundingMode, roundingIncrement)
    endEpochNanoseconds = dayEpochNanoseconds1.add(roundedTimeNano)
  } else {
    endEpochNanoseconds = dayEpochNanoseconds0.add(roundedTimeNano)
  }

  const durationTimeFields = timeNanoToDurationFields(roundedTimeNano)
  const nudgedDurationFields = {
    ...durationFields,
    ...durationTimeFields,
    days: durationFields.days + dayDelta,
  }

  return [nudgedDurationFields, endEpochNanoseconds, dayDelta]
}

function nudgeRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  const baseDurationFields = clearDurationFields(
    durationFields,
    nanoIndex,
    smallestUnitIndex - 1,
  )

  baseDurationFields[smallestUnitIndex] = Math.trunc(
    durationFields[smallestUnitIndex] / roundingIncrement,
  )

  const [epochNanoseconds0, epochNanoseconds1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnitIndex,
    roundingIncrement * sign,
    // marker system...
    marker,
    markerToEpochMilliseconds,
    moveMarker,
  )

  const portion =
    endEpochNanoseconds.subtract(epochNanoseconds0).toNumber() /
    epochNanoseconds1.subtract(epochNanoseconds0).toNumber()

  const roundedPortion = roundWithMode(portion * sign, roundingMode) // -1/0/1

  if (roundedPortion) { // enlarged?
    baseDurationFields[smallestUnitIndex] += roundingIncrement * sign

    return [baseDurationFields, epochNanoseconds1, roundedPortion]
  } else {
    return [baseDurationFields, epochNanoseconds0, roundedPortion]
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function bubbleRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds,
  largestUnitIndex,
  smallestUnitIndex,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  for (
    let currentUnitIndex = smallestUnitIndex + 1;
    currentUnitIndex < largestUnitIndex;
    currentUnitIndex++
  ) {
    if (currentUnitIndex === weekIndex) { // correct?
      continue
    }

    const baseDurationFields = clearDurationFields(
      durationFields,
      nanoIndex,
      currentUnitIndex - 1,
    )
    baseDurationFields[durationFieldNamesAsc[currentUnitIndex]] += sign

    const thresholdEpochNanoseconds = markerToEpochMilliseconds(
      moveMarker(marker, baseDurationFields),
    )

    const beyondThreshold = endEpochNanoseconds.subtract(thresholdEpochNanoseconds).toNumber()
    if (!beyondThreshold || Math.sign(beyondThreshold) === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}

function clampRelativeDuration(
  durationFields,
  clampUnit,
  clampDistance,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const clampDurationFields = { ...durationFieldDefaults, [clampUnit]: clampDistance }
  const marker0 = moveMarker(marker, durationFields)
  const marker1 = moveMarker(marker0, clampDurationFields)
  const epochNanoseconds0 = markerToEpochMilliseconds(marker0)
  const epochNanoseconds1 = markerToEpochMilliseconds(marker1)
  return [epochNanoseconds0, epochNanoseconds1]
}

function clearDurationFields(durationFields, firstUnitIndex, lastUnitIndex) {
  // TODO: always assume `nanoIndex` as firstUnitIndex
}
