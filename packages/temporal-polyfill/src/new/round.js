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
import { moveDateByDays } from './move'
import { halfEvenI, roundingModeFuncs } from './options'
import { computeNanosecondsInDay } from './timeZoneOps'
import {
  dayIndex,
  nanoInMinute,
  nanoInUtcDay,
  nanoIndex,
  unitIndexToNano,
  unitNamesAsc,
  weekIndex,
} from './units'
import { identityFunc } from './utils'

export function roundToMinute(offsetNano) {
  return roundByInc(offsetNano, nanoInMinute, halfEvenI)
}

// Rounding Dates
// -------------------------------------------------------------------------------------------------

export function roundDateTime(
  isoFields,
  smallestUnitI, // day/time
  roundingInc,
  roundingMode,
  timeZoneOps = undefined,
) {
  if (smallestUnitI === dayIndex) {
    return roundDateTimeToDay(isoFields, timeZoneOps, roundingMode)
  }

  return roundDateTimeToNano(
    isoFields,
    computeNanoInc(smallestUnitI, roundingInc),
    roundingMode,
  )
}

export function roundTime(
  isoFields,
  smallestUnitI,
  roundingInc,
  roundingMode,
) {
  return roundTimeToNano(
    isoFields,
    computeNanoInc(smallestUnitI, roundingInc),
    roundingMode,
  )
}

function roundDateTimeToDay(isoFields, timeZoneOps, roundingMode) {
  const nanoInDay = timeZoneOps
    ? computeNanosecondsInDay(timeZoneOps, isoFields)
    : nanoInUtcDay

  const dayDelta = roundByInc(
    isoTimeFieldsToNano(isoFields),
    nanoInDay,
    roundingMode,
  )

  return {
    ...moveDateByDays(isoFields, dayDelta),
    ...isoTimeFieldDefaults,
  }
}

export function roundDateTimeToNano(isoFields, nanoInc, roundingMode) {
  const [roundedIsoFields, dayDelta] = roundTimeToNano(isoFields, nanoInc, roundingMode)
  return {
    ...moveDateByDays(roundedIsoFields, dayDelta),
    ...roundedIsoFields,
  }
}

export function roundTimeToNano(isoFields, nanoInc, roundingMode) {
  return nanoToIsoTimeAndDay(
    roundByInc(isoTimeFieldsToNano(isoFields), nanoInc, roundingMode),
  )
}

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields,
  smallestUnitI,
  roundingInc,
  roundingMode,
) {
  return roundDurationToNano(
    durationFields,
    computeNanoInc(smallestUnitI, roundingInc),
    roundingMode,
  )
}

export function roundDurationToNano(durationFields, nanoInc, roundingMode) {
  const largeNano = durationFieldsToNano(durationFields)
  const roundedLargeNano = roundByIncLarge(largeNano, nanoInc, roundingMode)

  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(roundedLargeNano),
  }
}

export function roundRelativeDuration(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNanoseconds,
  largestUnitIndex,
  smallestUnitI,
  roundingInc,
  roundingMode,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  if (smallestUnitI === nanoIndex && roundingInc === 1) {
    return durationFields
  }

  let [roundedDurationFields, roundedEpochNanoseconds, grew] = (
    smallestUnitI >= dayIndex
      ? nudgeRelativeDuration
      : markerToEpochMilliseconds === identityFunc // marker is ZonedDateTime's epochNanoseconds?
        ? nudgeRelativeDurationTime
        : nudgeDurationTime
  )(
    durationFields,
    endEpochNanoseconds,
    smallestUnitI,
    roundingInc,
    roundingMode,
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
      smallestUnitI,
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

export function computeNanoInc(smallestUnitI, roundingInc) {
  return unitIndexToNano[smallestUnitI] * roundingInc
}

export function roundByInc(num, inc, roundingMode) {
  return roundWithMode(num / inc, roundingMode) * inc
}

export function roundByIncLarge(largeInt, inc, roundingMode) {
  const [whole, remainder] = largeInt.divTruncMod(inc)
  const mod2 = whole.mod2() // workaround for halfEven

  return whole.mult(inc).addNumber(
    roundWithMode((remainder / inc) + mod2, roundingMode) - mod2,
  )
}

function roundWithMode(num, roundingMode) {
  return roundingModeFuncs[roundingMode](num)
}

// Total Duration
// -------------------------------------------------------------------------------------------------

export function totalDayTimeDuration( // assumes iso-length days
  durationFields,
  totalUnitIndex,
) {
  const largeNano = durationFieldsToNano(durationFields)
  const divisor = unitIndexToNano[totalUnitIndex]
  const [fullUnits, remainder] = largeNano.divTruncMod(divisor)
  return fullUnits.toNumber() + (remainder / divisor)
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
    clearDurationFields(durationFields, totalUnitIndex - 1),
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
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

function nudgeDurationTime(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds, // NOT NEEDED, just for adding result to
  smallestUnitI,
  roundingInc,
  roundingMode,
) {
  const timeNano = durationFieldsToTimeNano(durationFields)
  const nanoInc = computeNanoInc(smallestUnitI, roundingInc)
  const roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)
  const roundedFields = nanoToDurationFields(roundedTimeNano)
  const dayDelta = roundedFields.days
  const nudgedDurationFields = { // TODO: what about sign?
    ...durationFields,
    ...roundedFields,
    days: durationFields.days + dayDelta,
  }

  return [
    nudgedDurationFields,
    endEpochNanoseconds.addNumber(roundedTimeNano - timeNano),
    dayDelta,
  ]
}

function nudgeRelativeDurationTime(
  durationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNanoseconds, // NOT NEEDED, just for conformance
  smallestUnitI,
  roundingInc,
  roundingMode,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields
  const timeNano = durationFieldsToTimeNano(durationFields)
  const nanoInc = computeNanoInc(smallestUnitI, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

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
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
    endEpochNanoseconds = dayEpochNanoseconds1.addNumber(roundedTimeNano)
  } else {
    endEpochNanoseconds = dayEpochNanoseconds0.addNumber(roundedTimeNano)
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
  smallestUnitI,
  roundingInc,
  roundingMode,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  const baseDurationFields = clearDurationFields(durationFields, smallestUnitI - 1)
  baseDurationFields[smallestUnitI] = Math.trunc(
    durationFields[smallestUnitI] / roundingInc,
  )

  const [epochNanoseconds0, epochNanoseconds1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnitI,
    roundingInc * sign,
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
    baseDurationFields[smallestUnitI] += roundingInc * sign

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
  smallestUnitI,
  // marker system...
  marker,
  markerToEpochMilliseconds,
  moveMarker,
) {
  const { sign } = durationFields

  for (
    let currentUnitIndex = smallestUnitI + 1;
    currentUnitIndex < largestUnitIndex;
    currentUnitIndex++
  ) {
    if (currentUnitIndex === weekIndex) { // correct?
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, currentUnitIndex - 1)
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
  clampUnit, // baaa
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

function clearDurationFields(durationFields, lastUnitIndex) {
  const copy = { ...durationFields }

  for (let unitIndex = nanoIndex; unitIndex <= lastUnitIndex; unitIndex++) {
    copy[unitNamesAsc[unitIndex]] = 0
  }

  return copy
}
