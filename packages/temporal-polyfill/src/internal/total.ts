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
import { DurationTotalOptions } from './optionsModel'
import { refineTotalOptions } from './optionsRoundingRefine'
import {
  MarkerMath,
  RelativeToSlots,
  checkRelativeMarkersInBounds,
  createRelativeMath,
  isUniformUnit,
  moveMarkerToEpochNano,
} from './relativeMath'
import { DurationSlots } from './slots'
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

  const relativeMath = createRelativeMath(relativeToSlots)
  const endMarker = relativeMath.moveMarker(relativeMath.marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  checkRelativeMarkersInBounds(relativeMath, endMarker)

  const balancedDuration = relativeMath.diffMarkers(
    relativeMath.marker,
    endMarker,
    totalUnit,
  )

  if (isUniformUnit(totalUnit, relativeToSlots)) {
    return totalDayTimeDuration(balancedDuration, totalUnit as DayTimeUnit)
  }

  return totalRelativeDuration(
    balancedDuration,
    relativeMath.markerToEpochNano(endMarker),
    totalUnit,
    relativeMath,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit, // always >=Day
  markerMath: MarkerMath,
): number {
  // The spec treats zero relative durations as positive when probing the
  // surrounding unit window. That matters at the upper Instant boundary:
  // origin + 1 day may be out of range even if the origin itself is valid.
  const sign = computeDurationSign(durationFields) || 1
  const nudgeWindow = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    markerMath,
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
  markerMath: MarkerMath,
  epochNanoProgress?: BigNano,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  let startDurationFields = durationFields
  let shifted = false
  let window = computeRelativeDurationWindow(
    startDurationFields,
    unitName,
    clampDistance,
    markerMath,
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
      markerMath,
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
  markerMath: MarkerMath,
) {
  const endDurationFields = {
    ...startDurationFields,
    [unitName]: startDurationFields[unitName] + clampDistance,
  }

  const epochNano0 = moveMarkerToEpochNano(markerMath, startDurationFields)
  const epochNano1 = moveMarkerToEpochNano(markerMath, endDurationFields)
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
