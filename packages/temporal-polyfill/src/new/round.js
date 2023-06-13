import {
  durationFieldDefaults,
  durationFieldsToNano,
  durationFieldsToTimeNano,
  durationTimeFieldDefaults,
  nanoToDurationFields,
  timeNanoToDurationFields,
} from './durationFields'
import { isoTimeFieldDefaults } from './isoFields'
import {
  isoTimeFieldsToNano,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { addDaysToIsoFields } from './move'
import { computeNanosecondsInDay } from './timeZoneOps'
import { nanoInUnit, nanoInUtcDay } from './units'
import { identityFunc } from './utils'

export function roundToMinute(nanoseconds) { // can be positive or negative

}

// Rounding Dates
// -------------------------------------------------------------------------------------------------

export function roundIsoDateTimeFields(
  isoDateTimeFields,
  smallestUnit, // day/time
  roundingMode,
  roundingIncrement,
  timeZoneOps = undefined,
) {
  let isoTimeFields
  let dayDelta

  if (smallestUnit === 'day') {
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
      smallestUnit,
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
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const timeNano = roundNano(
    isoTimeFieldsToNano(isoTimeFields),
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
  return nanoToIsoTimeAndDay(timeNano)
}

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const largeNano = durationFieldsToNano(durationFields)
  const r = roundLargeNano(largeNano, smallestUnit, roundingMode, roundingIncrement)
  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(r),
  }
}

export function roundRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNanoseconds,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  if (smallestUnit === 'nanoseconds' && roundingIncrement === 1) {
    return durationFields
  }

  let [roundedDurationFields, roundedEpochNanoseconds, grew] = (
    smallestUnit >= 'day'
      ? nudgeRelativeDuration
      : markerToEpochMilliseconds === identityFunc // marker is ZonedDateTime's epochNanoseconds?
        ? nudgeRelativeDurationTime
        : nudgeDurationTime
  )(
    durationFields,
    endEpochNanoseconds,
    smallestUnit,
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
      largestUnit,
      smallestUnit,
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

export function roundLargeNano(largeNano, smallestUnit, roundingMode, roundingIncrement) {
  const divisor = nanoInUnit[smallestUnit] * roundingIncrement
  const [n, remainder] = largeNano.divModTrunc(divisor)
  return n.mult(divisor).add(roundWithMode(remainder / divisor, roundingMode))
}

export function roundNano(nano, smallestUnit, roundingMode, roundingIncrement) {
  return roundWithDivisor(nano, nanoInUnit[smallestUnit] * roundingIncrement, roundingMode)
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
  unitName,
) {
  const largeNano = durationFieldsToNano(durationFields)
  const divisor = nanoInUnit[unitName]
  const [fullUnit, remainder] = largeNano.divModTrunc(divisor)
  return fullUnit.toNumber() + (remainder / divisor)
}

export function totalRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds,
  totalUnit,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  const [epochNanoseconds0, epochNanoseconds1] = clampRelativeDuration(
    clearDurationFields(durationFields, 'nanoseconds', totalUnit - 1),
    totalUnit,
    sign,
    // marker system...
    marker,
    moveMarker,
    markerToEpochMilliseconds,
  )

  const portion =
    endEpochNanoseconds.subtract(epochNanoseconds0).toNumber() /
    epochNanoseconds1.subtract(epochNanoseconds0).toNumber()

  return durationFields[totalUnit] + portion
}

// Nudge
// -------------------------------------------------------------------------------------------------

function nudgeDurationTime(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds, // NOT NEEDED, just for adding result to
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const timeNano = durationFieldsToTimeNano(durationFields)
  const roundedTimeNano = roundNano(timeNano, smallestUnit, roundingMode, roundingIncrement)
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
  smallestUnit,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields
  const timeNano = durationFieldsToTimeNano(durationFields)
  let roundedTimeNano = roundNano(timeNano, smallestUnit, roundingMode, roundingIncrement)

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
    roundedTimeNano = roundNano(beyondDay, smallestUnit, roundingMode, roundingIncrement)
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
  smallestUnit,
  roundingMode,
  roundingIncrement,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  const baseDurationFields = clearDurationFields(durationFields, 'nanoseconds', smallestUnit - 1)
  baseDurationFields[smallestUnit] = Math.trunc(durationFields[smallestUnit] / roundingIncrement)

  const [epochNanoseconds0, epochNanoseconds1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
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
    baseDurationFields[smallestUnit] += roundingIncrement * sign

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
  largestUnit,
  smallestUnit,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  for (let currentUnit = smallestUnit + 1; currentUnit < largestUnit; currentUnit++) { // TODO
    if (currentUnit === 'week') { // correct?
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, 'nanoseconds', currentUnit - 1)
    baseDurationFields[currentUnit] += sign

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

function clearDurationFields(durationFields, firstUnit, lastUnit) {
}
