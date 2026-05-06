import { divideBigNanoToExactNumber } from './bigNano'
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
  MarkerMoveOps,
  RelativeToSlots,
  checkMarkerSpanInBounds,
  createMarkerSpanOps,
  isUniformUnit,
  moveMarkerToEpochNano,
} from './relativeMath'
import { DurationSlots } from './slots'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'
import { compareBigInts } from './utils'

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

  const markerSpanOps = createMarkerSpanOps(relativeToSlots)
  const endMarker = markerSpanOps.moveMarker(markerSpanOps.marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  checkMarkerSpanInBounds(markerSpanOps, endMarker)

  const balancedDuration = markerSpanOps.diffMarkers(
    markerSpanOps.marker,
    endMarker,
    totalUnit,
  )

  if (isUniformUnit(totalUnit, relativeToSlots)) {
    return totalDayTimeDuration(balancedDuration, totalUnit as DayTimeUnit)
  }

  return totalRelativeDuration(
    balancedDuration,
    markerSpanOps.markerToEpochNano(endMarker),
    totalUnit,
    markerSpanOps,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: bigint,
  totalUnit: Unit, // always >=Day
  markerMoveOps: MarkerMoveOps,
): number {
  // The spec treats zero relative durations as positive when probing the
  // surrounding unit window. That matters at the upper Instant boundary:
  // origin + 1 day may be out of range even if the origin itself is valid.
  const sign = computeDurationSign(durationFields) || 1
  const nudgeWindow = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    markerMoveOps,
    endEpochNano,
  )
  const epochNano0 = nudgeWindow.epochNano0
  const epochNano1 = nudgeWindow.epochNano1
  const denom = Number(epochNano1 - epochNano0)
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const numerator = Number(endEpochNano - epochNano0)
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
  return divideBigNanoToExactNumber(
    durationFieldsToBigNano(durationFields),
    unitNanoMap[totalUnit],
  )
}

// Utils for points-within-intervals
// -----------------------------------------------------------------------------

export function clampRelativeDuration(
  durationFields: DurationFields,
  clampUnit: Unit, // always >=Day
  clampDistance: number,
  markerMoveOps: MarkerMoveOps,
  epochNanoProgress?: bigint,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  let startDurationFields = durationFields
  let shifted = false
  let window = computeRelativeDurationWindow(
    startDurationFields,
    unitName,
    clampDistance,
    markerMoveOps,
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
      markerMoveOps,
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
  markerMoveOps: MarkerMoveOps,
) {
  const endDurationFields = {
    ...startDurationFields,
    [unitName]: startDurationFields[unitName] + clampDistance,
  }

  const epochNano0 = moveMarkerToEpochNano(markerMoveOps, startDurationFields)
  const epochNano1 = moveMarkerToEpochNano(markerMoveOps, endDurationFields)
  return { epochNano0, epochNano1, endDurationFields }
}

function epochNanoIsWithinWindow(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  sign: number,
): boolean {
  if (sign > 0) {
    return (
      compareBigInts(epochNano0, epochNanoProgress) <= 0 &&
      compareBigInts(epochNanoProgress, epochNano1) <= 0
    )
  }

  return (
    compareBigInts(epochNano1, epochNanoProgress) <= 0 &&
    compareBigInts(epochNanoProgress, epochNano0) <= 0
  )
}

export function computeEpochNanoFrac(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
): number {
  const denom = Number(epochNano1 - epochNano0)
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const number = Number(epochNanoProgress - epochNano0)
  return number / denom
}
