import { compareBigInts, fabricateNearHalfFraction } from './utils'

export type MoveRelativeUnitValue = (value: number) => bigint

export interface RelativeUnitWindow {
  startValue: number
  endValue: number
  epochNano0: bigint
  epochNano1: bigint
  shifted: boolean
}

/*
Finds the adjacent relative-unit boundaries containing an endpoint. Callers
supply the type-specific movement operation, while this leaf owns the scalar
window and its one-step constraint correction.
*/
export function clampRelativeUnitValue(
  startValue: number,
  valueDelta: number,
  moveValueToEpochNano: MoveRelativeUnitValue,
  epochNanoProgress?: bigint,
): RelativeUnitWindow {
  let shifted = false
  let window = computeRelativeUnitWindow(
    startValue,
    valueDelta,
    moveValueToEpochNano,
  )

  if (
    epochNanoProgress &&
    !epochNanoIsWithinWindow(
      epochNanoProgress,
      window.epochNano0,
      window.epochNano1,
      Math.sign(valueDelta),
    )
  ) {
    startValue += valueDelta
    shifted = true
    window = computeRelativeUnitWindow(
      startValue,
      valueDelta,
      moveValueToEpochNano,
    )
  }

  return { ...window, shifted }
}

function computeRelativeUnitWindow(
  startValue: number,
  valueDelta: number,
  moveValueToEpochNano: MoveRelativeUnitValue,
): Omit<RelativeUnitWindow, 'shifted'> {
  const endValue = startValue + valueDelta
  return {
    startValue,
    endValue,
    epochNano0: moveValueToEpochNano(startValue),
    epochNano1: moveValueToEpochNano(endValue),
  }
}

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

/*
Interpolates the scalar value represented by a relative window. Totals need
the actual fraction, while rounding only needs a half-safe representative.
*/
export function interpolateRelativeUnitValue(
  startValue: number,
  endValue: number,
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  exactFraction: boolean,
): number {
  const fraction = exactFraction
    ? Number(epochNanoProgress - epochNano0) / Number(epochNano1 - epochNano0)
    : computeEpochNanoFrac(epochNanoProgress, epochNano0, epochNano1)

  return startValue + fraction * (endValue - startValue)
}
