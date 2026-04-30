import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from './bigNano'
import {
  DurationFieldName,
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
} from './durationFields'
import {
  computeDurationSign,
  durationFieldsToBigNano,
  getMaxDurationUnit,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { CalendarDateTimeFields } from './fieldTypes'
import { DurationTotalOptions } from './optionsModel'
import { refineTotalOptions } from './optionsRoundingRefine'
import {
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  RelativeToSlots,
  createDiffMarkers,
  createMarkerToEpochNano,
  createMoveMarker,
  createRelativeOrigin,
  isUniformUnit,
  isZonedEpochSlots,
} from './relativeMath'
import { DurationSlots } from './slots'
import { checkIsoDateTimeInBounds } from './timeMath'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'

export function totalDuration<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  slots: DurationSlots,
  options: UnitName | DurationTotalOptions<RA>,
): number {
  const maxDurationUnit = getMaxDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxUnit = Math.max(totalUnit, maxDurationUnit)

  // NEW: short-circuit
  if (!relativeToSlots && isUniformUnit(maxUnit, relativeToSlots)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  // Zero durations can still need relative calendar math. In particular, a
  // zoned `day` total must compute the adjacent day-length window, and that
  // window can cross the representable Instant boundary even when the duration
  // itself is zero.
  if (!slots.sign && isUniformUnit(totalUnit, relativeToSlots)) {
    return 0
  }

  const [marker, timeZoneImpl] = createRelativeOrigin(relativeToSlots)
  const markerToEpochNano = createMarkerToEpochNano(timeZoneImpl)
  const moveMarker = createMoveMarker(timeZoneImpl, relativeToSlots.calendar)
  const diffMarkers = createDiffMarkers(timeZoneImpl, relativeToSlots.calendar)

  const endMarker = moveMarker(marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  if (!isZonedEpochSlots(relativeToSlots)) {
    checkIsoDateTimeInBounds(marker as CalendarDateTimeFields)
    checkIsoDateTimeInBounds(endMarker as CalendarDateTimeFields)
  }

  const balancedDuration = diffMarkers(marker, endMarker, totalUnit)

  if (isUniformUnit(totalUnit, relativeToSlots)) {
    return totalDayTimeDuration(balancedDuration, totalUnit as DayTimeUnit)
  }

  return totalRelativeDuration(
    balancedDuration,
    markerToEpochNano(endMarker),
    totalUnit,
    marker,
    markerToEpochNano,
    moveMarker,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit, // always >=Day
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): number {
  // The spec treats zero relative durations as positive when probing the
  // surrounding unit window. That matters at the upper Instant boundary:
  // origin + 1 day may be out of range even if the origin itself is valid.
  const sign = computeDurationSign(durationFields) || 1
  const nudgeWindow = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    marker,
    markerToEpochNano,
    moveMarker,
    endEpochNano,
  )
  const epochNano0 = nudgeWindow.epochNano0
  const epochNano1 = nudgeWindow.epochNano1
  const denom = bigNanoToNumber(diffBigNanos(epochNano0, epochNano1))
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const numerator = bigNanoToNumber(diffBigNanos(epochNano0, endEpochNano))
  const integerPart =
    nudgeWindow.startDurationFields[durationFieldNamesAsc[totalUnit]]

  // Keep the whole-unit and fractional-window math grouped into a single
  // division. See DURATION-TOTAL-PRECISION-MEMORY.md for the one-ulp tradeoff
  // this currently makes between two Duration.total() test262 cases.
  return (integerPart * denom + numerator * sign) / denom
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return bigNanoToNumber(
    durationFieldsToBigNano(durationFields),
    unitNanoMap[totalUnit],
    true, // exact
  )
}

// Utils for points-within-intervals
// -----------------------------------------------------------------------------

export function clampRelativeDuration(
  durationFields: DurationFields,
  clampUnit: Unit, // always >=Day
  clampDistance: number,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  epochNanoProgress?: BigNano,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  let startDurationFields = durationFields
  let shifted = false
  let window = computeRelativeDurationWindow(
    startDurationFields,
    unitName,
    clampDistance,
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // Calendar-unit rounding uses a finite epoch-nanosecond window. Around dates
  // that constrain, like Jan 31 -> Feb 29, the balanced duration can describe a
  // point just beyond the first truncated window. The spec retries one window
  // later in that case; Duration.total() uses the same operation with trunc.
  if (
    epochNanoProgress &&
    !epochNanoIsWithinWindow(
      epochNanoProgress,
      window.epochNano0,
      window.epochNano1,
      Math.sign(clampDistance),
    )
  ) {
    startDurationFields = {
      ...durationFields,
      [unitName]: durationFields[unitName] + clampDistance,
    }
    shifted = true
    window = computeRelativeDurationWindow(
      startDurationFields,
      unitName,
      clampDistance,
      marker,
      markerToEpochNano,
      moveMarker,
    )

    if (
      !epochNanoIsWithinWindow(
        epochNanoProgress,
        window.epochNano0,
        window.epochNano1,
        Math.sign(clampDistance),
      )
    ) {
      throw new RangeError(errorMessages.invalidProtocolResults)
    }
  }

  return {
    ...window,
    startDurationFields,
    shifted,
  }
}

function computeRelativeDurationWindow(
  startDurationFields: DurationFields,
  unitName: DurationFieldName,
  clampDistance: number,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
) {
  const endDurationFields = {
    ...startDurationFields,
    [unitName]: startDurationFields[unitName] + clampDistance,
  }

  const marker0 = moveMarker(marker, startDurationFields)
  const marker1 = moveMarker(marker, endDurationFields)
  const epochNano0 = markerToEpochNano(marker0)
  const epochNano1 = markerToEpochNano(marker1)
  return { epochNano0, epochNano1, endDurationFields }
}

function epochNanoIsWithinWindow(
  epochNanoProgress: BigNano,
  epochNano0: BigNano,
  epochNano1: BigNano,
  sign: number,
): boolean {
  if (sign > 0) {
    return (
      compareBigNanos(epochNano0, epochNanoProgress) <= 0 &&
      compareBigNanos(epochNanoProgress, epochNano1) <= 0
    )
  }

  return (
    compareBigNanos(epochNano1, epochNanoProgress) <= 0 &&
    compareBigNanos(epochNanoProgress, epochNano0) <= 0
  )
}

export function computeEpochNanoFrac(
  epochNanoProgress: BigNano,
  epochNano0: BigNano,
  epochNano1: BigNano,
): number {
  const denom = bigNanoToNumber(diffBigNanos(epochNano0, epochNano1))
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const number = bigNanoToNumber(diffBigNanos(epochNano0, epochNanoProgress))
  return number / denom
}
