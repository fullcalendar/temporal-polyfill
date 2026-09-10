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

/*
Resolves a unit's scalar value from the endpoint's position within a window of
`unitWindowInc` units. `wholeValue` is the sign-carrying count of whole units
from the exact diff.

`roundingMode` doubles as the mode switch: defined means rounding, which
returns an increment-aligned value; undefined means totaling, which uses a
one-unit window (`unitWindowInc` is 1) and returns the exact fractional value.

Also returns the window the value was resolved in. A rounded value is always
the window's startValue or endValue, so callers that need the epoch it landed
on can read it from the window instead of probing again.
*/
export function resolveRelativeUnit(
  wholeValue: number,
  sign: number,
  endEpochNano: bigint,
  moveValueToEpochNano: MoveRelativeUnitValue,
  unitWindowInc: number,
  roundingMode?: RoundingModeEnum,
): [value: number, unitWindow: RelativeUnitWindow] {
  const unitWindow = clampRelativeUnitValue(
    divTrunc(wholeValue, unitWindowInc) * unitWindowInc,
    unitWindowInc * sign,
    moveValueToEpochNano,
    endEpochNano,
  )
  const isTotal = roundingMode === undefined

  // Totals need the real fraction. Rounding only needs to know which side of a
  // half the endpoint falls on, and computeEpochNanoFrac fabricates a stand-in
  // near 0.5 to keep that comparison exact, so it would be wrong as a total.
  const fraction = isTotal
    ? Number(endEpochNano - unitWindow.epochNano0) /
      Number(unitWindow.epochNano1 - unitWindow.epochNano0)
    : computeEpochNanoFrac(
        endEpochNano,
        unitWindow.epochNano0,
        unitWindow.epochNano1,
      )
  const value =
    unitWindow.startValue +
    fraction * (unitWindow.endValue - unitWindow.startValue)

  return [
    isTotal ? value : roundNumberToInc(value, unitWindowInc, roundingMode),
    unitWindow,
  ]
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
