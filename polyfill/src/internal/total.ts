import { divideBigNanoToExactNumber } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
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
import { CalendarDateFields } from './fieldTypes'
import { moveToStartOfMonth } from './move'
import { refineTotalOptions } from './optionsRoundingRefine'
import {
  RelativeOps,
  RelativeToSlots,
  ZonedEpochMarker,
  clampRelativeDuration,
  isUniformUnit,
  isZonedEpochSlots,
  spanPlainIsoRelativeDuration,
  spanPlainRelativeDuration,
  spanRelativeDuration,
  spanZonedIsoRelativeDuration,
  spanZonedRelativeDuration,
} from './relativeMath'
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

// YearMonth reference normalization
// -----------------------------------------------------------------------------
// PlainYearMonth arithmetic uses the first day as its reference date even when
// the stored ISO reference day differs. Wraps the plain calendar composition.

export function totalPlainYearMonthDuration(
  durationFields: DurationFields,
  relativeToSlots: CalendarDateFields & { calendar: CalendarImpl },
  totalUnit: Unit.Year | Unit.Month,
): number {
  const { calendar } = relativeToSlots
  return totalPlainCalendarDuration(
    durationFields,
    { ...moveToStartOfMonth(calendar, relativeToSlots), calendar },
    totalUnit,
  )
}

// Pre-refined relative total compositions
// -----------------------------------------------------------------------------
// One composition per relativeTo flavor and unit kind. Each spans the duration
// against its origin and hands the endpoints to a totaling core.

export function totalZonedCalendarDuration(
  durationFields: DurationFields,
  relativeToSlots: ZonedEpochMarker,
  totalUnit: Unit,
): number {
  const [balancedDuration, endEpochNano, relativeOps] =
    spanZonedRelativeDuration(relativeToSlots, durationFields, totalUnit)

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    totalUnit,
    relativeOps,
  )
}

export function totalPlainCalendarDuration(
  durationFields: DurationFields,
  relativeToSlots: CalendarDateFields & { calendar: CalendarImpl },
  totalUnit: Unit,
): number {
  const [balancedDuration, endEpochNano, relativeOps] =
    spanPlainRelativeDuration(relativeToSlots, durationFields, totalUnit)

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    totalUnit,
    relativeOps,
  )
}

export function totalZonedIsoDuration(
  durationFields: DurationFields,
  relativeToSlots: ZonedEpochMarker,
  totalUnit: Unit.Day | Unit.Week,
): number {
  const [balancedDuration, endEpochNano, relativeOps] =
    spanZonedIsoRelativeDuration(relativeToSlots, durationFields, totalUnit)

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    totalUnit,
    relativeOps,
  )
}

export function totalPlainIsoDuration(
  durationFields: DurationFields,
  relativeToFields: CalendarDateFields,
  totalUnit: Unit.Day | Unit.Week,
): number {
  const [balancedDuration, endEpochNano, relativeOps] =
    spanPlainIsoRelativeDuration(relativeToFields, durationFields, totalUnit)

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

export function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return divideBigNanoToExactNumber(
    durationDayTimeToBigNano(durationFields),
    unitNanoMap[totalUnit],
  )
}
