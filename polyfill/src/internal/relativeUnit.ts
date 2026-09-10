import { RoundingModeEnum } from '../options/model'
import { roundNumberToInc } from './roundNumber'
import { compareBigInts, divTrunc, fabricateNearHalfFraction } from './utils'

// Scalar relative-unit math
// -----------------------------------------------------------------------------
// Both APIs bottom out here. The func API already works with one unit's scalar
// value; the class API adapts DurationFields into that same scalar plus a
// callback that moves the origin by it. This module owns the window and its
// fraction math without retaining either API's orchestration records.

export type MoveRelativeUnitValue = (value: number) => bigint

export interface RelativeUnitWindow {
  startValue: number
  endValue: number
  epochNano0: bigint
  epochNano1: bigint
}

/*
Totals a unit from the endpoint's exact position within its surrounding
one-unit window. `wholeValue` is the sign-carrying count of whole units from
the exact diff.
*/
export function totalRelativeUnit(
  wholeValue: number,
  sign: number,
  endEpochNano: bigint,
  moveValueToEpochNano: MoveRelativeUnitValue,
): number {
  const unitWindow = clampRelativeUnitValue(
    wholeValue,
    sign,
    moveValueToEpochNano,
    endEpochNano,
  )
  const fraction =
    Number(endEpochNano - unitWindow.epochNano0) /
    Number(unitWindow.epochNano1 - unitWindow.epochNano0)

  return interpolateRelativeUnitWindow(unitWindow, fraction)
}

/*
Rounds a unit from the endpoint's position within an increment-sized window.
Returns only the scalar. Callers needing the selected epoch build their own
window and pass it to roundRelativeUnitWindow, without a result tuple.
*/
export function roundRelativeUnit(
  wholeValue: number,
  sign: number,
  endEpochNano: bigint,
  moveValueToEpochNano: MoveRelativeUnitValue,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): number {
  const unitWindow = clampRelativeUnitValue(
    divTrunc(wholeValue, roundingInc) * roundingInc,
    roundingInc * sign,
    moveValueToEpochNano,
    endEpochNano,
  )

  return roundRelativeUnitWindow(
    unitWindow,
    endEpochNano,
    roundingInc,
    roundingMode,
  )
}

// Round an existing window so Duration rounding can also reuse its two epochs.
export function roundRelativeUnitWindow(
  unitWindow: RelativeUnitWindow,
  endEpochNano: bigint,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): number {
  // Unlike totalRelativeUnit, which needs the real fraction, rounding only
  // needs to know which side of a half the endpoint falls on. computeEpochNanoFrac
  // fabricates a stand-in near 0.5 to keep that comparison exact, so it would
  // be wrong as a total.
  const fraction = computeEpochNanoFrac(
    endEpochNano,
    unitWindow.epochNano0,
    unitWindow.epochNano1,
  )
  const value = interpolateRelativeUnitWindow(unitWindow, fraction)

  return roundNumberToInc(value, roundingInc, roundingMode)
}

/*
Finds the adjacent unit boundaries containing the endpoint.

Calendar-unit windows are finite epoch-nanosecond intervals. Around dates that
constrain, like Jan 31 -> Feb 29, the balanced duration can describe a point
just beyond the first window, so the spec retries one window later.
*/
export function clampRelativeUnitValue(
  startValue: number,
  valueDelta: number,
  moveValueToEpochNano: MoveRelativeUnitValue,
  epochNanoProgress: bigint,
): RelativeUnitWindow {
  let unitWindow = computeRelativeUnitWindow(
    startValue,
    valueDelta,
    moveValueToEpochNano,
  )

  if (
    !epochNanoIsWithinWindow(
      epochNanoProgress,
      unitWindow.epochNano0,
      unitWindow.epochNano1,
      Math.sign(valueDelta),
    )
  ) {
    unitWindow = computeRelativeUnitWindow(
      startValue + valueDelta,
      valueDelta,
      moveValueToEpochNano,
    )
  }

  return unitWindow
}

function computeRelativeUnitWindow(
  startValue: number,
  valueDelta: number,
  moveValueToEpochNano: MoveRelativeUnitValue,
): RelativeUnitWindow {
  const endValue = startValue + valueDelta
  return {
    startValue,
    endValue,
    epochNano0: moveValueToEpochNano(startValue),
    epochNano1: moveValueToEpochNano(endValue),
  }
}

function interpolateRelativeUnitWindow(
  unitWindow: RelativeUnitWindow,
  fraction: number,
): number {
  return (
    unitWindow.startValue +
    fraction * (unitWindow.endValue - unitWindow.startValue)
  )
}

// Epoch interval arithmetic
// -----------------------------------------------------------------------------
// Pure bigint math on a [epochNano0, epochNano1] window: membership tests and
// the fractional progress used by rounding modes. Shared with the class API's
// DurationFields-based rounding.

export function epochNanoIsWithinWindow(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  sign: number,
): boolean {
  return sign > 0
    ? epochNano0 <= epochNanoProgress && epochNanoProgress <= epochNano1
    : epochNano1 <= epochNanoProgress && epochNanoProgress <= epochNano0
}

/*
Builds a Number fraction that preserves exact half comparisons for rounding.
Values outside the window retain their real magnitude for corrective probes.
*/
export function computeEpochNanoFrac(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
): number {
  const denomBig = epochNano1 - epochNano0
  const numeratorBig = epochNanoProgress - epochNano0
  if (!numeratorBig) {
    return 0
  }

  const absNumerator = numeratorBig < 0n ? -numeratorBig : numeratorBig
  const absDenom = denomBig < 0n ? -denomBig : denomBig
  const fracSign =
    compareBigInts(numeratorBig, 0n) === compareBigInts(denomBig, 0n) ? 1 : -1

  if (compareBigInts(absNumerator, absDenom) <= 0) {
    if (absNumerator === absDenom) {
      return fracSign
    }

    return fabricateNearHalfFraction(
      compareBigInts(absNumerator * 2n, absDenom),
      fracSign,
    )
  }

  return Number(numeratorBig) / Number(denomBig)
}
