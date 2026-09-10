import { compareBigInts, fabricateNearHalfFraction } from './utils'

// Scalar relative-unit math
// -----------------------------------------------------------------------------
// The class API rounds and totals whole DurationFields. The func API only needs
// ONE unit's value, so this leaf works on a scalar: a candidate unit value plus
// a callback that moves the origin by it. Callers supply the type-specific
// movement; this module owns the window and its fraction math.

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
