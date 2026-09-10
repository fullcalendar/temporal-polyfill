import { refineTotalOptions } from '../options/roundingRefine'
import { divideBigNanoToExactNumber } from './bigNano'
import {
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
import {
  RelativeOps,
  RelativeToSlots,
  isUniformUnit,
  isZonedEpochSlots,
  moveRelativeMarkerToEpochNano,
  spanRelativeDuration,
} from './relativeMath'
import { resolveRelativeUnit } from './relativeUnit'
import type { DurationTotalOptions } from './temporalSpecHelpers'
import { DayTimeUnit, Unit, unitNanoMap } from './units'
import { NumberSign, throwRangeError } from './utils'

// Option-refining total entry point
// -----------------------------------------------------------------------------
// Duration.total itself: reads and validates options, then dispatches to a
// pre-refined composition below.

export function totalDuration<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  slots: DurationFields & { sign: NumberSign },
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationTotalOptions<RA>,
): number {
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxDurationUnit = getMaxDurationUnit(slots)
  const maxUnit = Math.max(totalUnit, maxDurationUnit)
  const isZoned = relativeToSlots && isZonedEpochSlots(relativeToSlots)

  if (!relativeToSlots && isUniformUnit(maxUnit, isZoned)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throwRangeError(errorMessages.missingRelativeTo)
  }

  // Plain zero durations return after validating that relativeTo is present
  // when required. Zoned calendar/day totals still probe their relative window,
  // which can cross the representable Instant boundary even at zero.
  if (!slots.sign && (!isZoned || totalUnit < Unit.Day)) {
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

// Totaling cores
// -----------------------------------------------------------------------------
// Compute the fractional total: relative units via a clamped window and epoch
// fraction, uniform day/time units via nanosecond division.

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: bigint,
  totalUnit: Unit, // always >=Day
  relativeOps: RelativeOps,
): number {
  // The spec treats zero relative durations as positive when probing the
  // surrounding unit window. That matters at the upper Instant boundary:
  // origin + 1 day may be out of range even if the origin itself is valid.
  const fieldName = durationFieldNamesAsc[totalUnit]
  const baseDurationFields = clearDurationFields(totalUnit, durationFields)

  return resolveRelativeUnit(
    durationFields[fieldName],
    computeDurationSign(durationFields) || 1,
    endEpochNano,
    (value) => {
      // baseDurationFields is scratch; only the resolved number is returned
      baseDurationFields[fieldName] = value
      return moveRelativeMarkerToEpochNano(relativeOps, baseDurationFields)
    },
    1,
  )[0]
}

export function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return divideBigNanoToExactNumber(
    durationDayTimeToBigNano(durationFields),
    unitNanoMap[totalUnit],
  )
}
