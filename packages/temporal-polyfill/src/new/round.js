import { durationFieldDefaults, durationTimeFieldDefaults } from './durationFields'
import { addDaysToIsoFields, isoTimeFieldDefaults } from './isoFields'
import { identityFunc } from './lang'
import { createLargeInt } from './largeInt'
import {
  isoTimeFieldsToNanoseconds,
  nanosecondsInIsoDay,
  nanosecondsInUnit,
  nanosecondsToIsoTimeFields,
} from './nanoseconds'
import { computeNanosecondsInDay } from './timeZoneOps'

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
      : nanosecondsInIsoDay

    dayDelta = roundNanoseconds(
      isoTimeFieldsToNanoseconds(isoDateTimeFields),
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
  smallestUnit, // time
  roundingMode,
  roundingIncrement,
) {
  const nanoseconds = roundNanoseconds(
    isoTimeFieldsToNanoseconds(isoTimeFields),
    nanosecondsInUnit[smallestUnit] * roundingIncrement,
    roundingMode,
  )
  return nanosecondsToIsoTimeFields(nanoseconds)
}

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const largeNanoseconds = durationDayTimeToNanoseconds(durationFields)
  const r = roundLargeNanoseconds(largeNanoseconds, smallestUnit, roundingMode, roundingIncrement)
  return nanosecondsToDurationDayTime(r)
}

export function roundRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
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

export function roundLargeNanoseconds(
  largeNanoseconds,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  let [timeNanoseconds, days] = splitDayTimeNanoseconds(largeNanoseconds)

  timeNanoseconds = roundNanoseconds(
    timeNanoseconds,
    nanosecondsInUnit[smallestUnit] * roundingIncrement,
    roundingMode,
  )

  const dayDelta = Math.trunc(timeNanoseconds / nanosecondsInIsoDay)
  timeNanoseconds %= nanosecondsInIsoDay

  return createLargeInt(nanosecondsInIsoDay).mult(days + dayDelta).add(timeNanoseconds)
}

function splitDayTimeNanoseconds(largeNanoseconds) {
  const days = largeNanoseconds.div(nanosecondsInIsoDay)
  const dayNanoseconds = createLargeInt(nanosecondsInIsoDay).mult(days)
  const timeNanoseconds = largeNanoseconds.sub(dayNanoseconds)
  return [timeNanoseconds, days]
}

function roundNanoseconds(num, nanoIncrement, roundingMode) {
  return roundWithMode(num / nanoIncrement, roundingMode) * nanoIncrement
}

function roundWithMode(num, roundingMode) {
}

// Total Duration
// -------------------------------------------------------------------------------------------------

export function totalDayTimeDuration( // assumes iso-length days
  durationFields,
  unit,
) {
  const largeNanoseconds = durationDayTimeToNanoseconds(durationFields)
  return largeNanoseconds.divide(nanosecondsInUnit[unit]).toNumber()
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
  const nano = durationTimeToNanoseconds(durationFields)
  const roundedNano = roundNanoseconds(
    nano,
    nanosecondsInUnit[smallestUnit] * roundingIncrement,
    roundingMode,
  )

  const [durationTimeFields, dayDelta] = nanosecondsToDurationTime(roundedNano)
  const nudgedDurationFields = {
    ...durationFields,
    days: durationFields.days + dayDelta,
    ...durationTimeFields,
  }

  return [
    nudgedDurationFields,
    endEpochNanoseconds.add(roundedNano - nano),
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
  const divisor = nanosecondsInUnit[smallestUnit] * roundingIncrement
  const nano = durationTimeToNanoseconds(durationFields)
  let roundedNano = roundNanoseconds(nano, divisor, roundingMode)

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
  const beyondDay = roundedNano - daySpanEpochNanoseconds
  let dayDelta = 0

  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta++
    roundedNano = roundNanoseconds(beyondDay, divisor, roundingMode)
    endEpochNanoseconds = dayEpochNanoseconds1.add(roundedNano)
  } else {
    endEpochNanoseconds = dayEpochNanoseconds0.add(roundedNano)
  }

  const [durationTimeFields] = nanosecondsToDurationTime(roundedNano)
  const nudgedDurationFields = {
    ...durationFields,
    days: durationFields.days + dayDelta,
    ...durationTimeFields,
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

// Duration Time
// -------------

function durationTimeToNanoseconds(
  durationTimeFields, // time-fields must be cumulatively less than a day
) {
  // returns Number
}

function nanosecondsToDurationTime(
  nanoseconds, // can be signed
) {
  // returns [durationTimeFields, dayDelta]
}

// Duration Day-Time
// -----------------

function durationDayTimeToNanoseconds(
  durationFields, // NOT BALANCED
) {
  // returns LargeInt
}

function nanosecondsToDurationDayTime(largeNano) {
  // returns DurationFields (even tho year/week/month will be 0)
}
