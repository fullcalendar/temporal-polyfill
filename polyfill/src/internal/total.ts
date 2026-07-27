import { divideBigNanoToExactNumber } from './bigNano'
import {
  DurationFieldName,
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
} from './durationFields'
import {
  computeDurationSign,
  durationDayTimeToBigNano,
  getMaxDurationUnit,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { refineTotalOptions } from './optionsRoundingRefine'
import {
  RelativeOps,
  RelativeToSlots,
  isUniformUnit,
  isZonedEpochSlots,
  moveRelativeToEpochNano,
  spanRelativeDuration,
} from './relativeMath'
import type { DurationTotalOptions } from './temporalSpecHelpers'
import { DayTimeUnit, Unit, unitNanoMap } from './units'
import {
  NumberSign,
  compareBigInts,
  fabricateNearHalfFraction,
  throwRangeError,
} from './utils'

export function totalDuration<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  slots: DurationFields & { sign: NumberSign },
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<RA>,
): number {
  const maxDurationUnit = getMaxDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxUnit = Math.max(totalUnit, maxDurationUnit)
  const isZoned = relativeToSlots && isZonedEpochSlots(relativeToSlots)

  if (!relativeToSlots && isUniformUnit(maxUnit, isZoned)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throwRangeError(errorMessages.missingRelativeTo)
  }

  // Zero durations can still need relative calendar math. In particular, a
  // zoned `day` total must compute the adjacent day-length window, and that
  // window can cross the representable Instant boundary even when the duration
  // itself is zero.
  if (!slots.sign && isUniformUnit(totalUnit, isZoned)) {
    return 0
  }

  const [balancedDuration, endEpochNano, relativeOps] = spanRelativeDuration(
    relativeToSlots,
    slots,
    totalUnit,
  )

  if (isUniformUnit(totalUnit, isZoned)) {
    return totalDayTimeDuration(balancedDuration, totalUnit as DayTimeUnit)
  }

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    totalUnit,
    relativeOps,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: bigint,
  totalUnit: Unit, // always >=Day
  relativeOps: RelativeOps,
): number {
  // The spec treats zero relative durations as positive when probing the
  // surrounding unit window. That matters at the upper Instant boundary:
  // origin + 1 day may be out of range even if the origin itself is valid.
  const sign = computeDurationSign(durationFields) || 1
  const nudgeWindow = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    relativeOps,
    endEpochNano,
  )
  const epochNano0 = nudgeWindow.epochNano0
  const epochNano1 = nudgeWindow.epochNano1
  const denom = Number(epochNano1 - epochNano0)
  const numerator = Number(endEpochNano - epochNano0)
  const integerPart =
    nudgeWindow.startDurationFields[durationFieldNamesAsc[totalUnit]]

  return integerPart + (numerator / denom) * sign
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return divideBigNanoToExactNumber(
    durationDayTimeToBigNano(durationFields),
    unitNanoMap[totalUnit],
  )
}

// Utils for points-within-intervals
// -----------------------------------------------------------------------------

export function clampRelativeDuration(
  durationFields: DurationFields,
  clampUnit: Unit, // always >=Day
  clampDistance: number,
  relativeOps: RelativeOps,
  epochNanoProgress?: bigint,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  let startDurationFields = durationFields
  let shifted = false
  let window = computeRelativeDurationWindow(
    startDurationFields,
    unitName,
    clampDistance,
    relativeOps,
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
      relativeOps,
    )
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
  relativeOps: RelativeOps,
) {
  const endDurationFields = {
    ...startDurationFields,
    [unitName]: startDurationFields[unitName] + clampDistance,
  }

  const epochNano0 = moveRelativeToEpochNano(relativeOps, startDurationFields)
  const epochNano1 = moveRelativeToEpochNano(relativeOps, endDurationFields)
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
