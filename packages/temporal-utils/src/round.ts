import type { Temporal } from 'temporal-spec'
import { startOfMonth, startOfWeek, startOfYear } from './startOf'
import { DateObj, YearMonthObj } from './utils'

export function roundToYear<T extends YearMonthObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const start = startOfYear(date)
  const duration = start.until(date, normalizeRoundingOptions('year', options))
  return start.add(duration)
}

export function roundToMonth<T extends DateObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const start = startOfMonth(date)
  const duration = start.until(date, normalizeRoundingOptions('month', options))
  return start.add(duration)
}

export function roundToWeek<T extends DateObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const start = startOfWeek(date)
  const duration = start.until(date, normalizeRoundingOptions('week', options))
  return start.add(duration)
}

// Options
// -----------------------------------------------------------------------------

// for big units only
export type RoundingOptions = {
  roundingMode?: Temporal.RoundingMode
  roundingIncrement?: 1
}

export function normalizeRoundingOptions(
  forcedUnit: Temporal.DateTimeUnit,
  options: Temporal.RoundingMode | RoundingOptions | undefined,
): {
  roundingMode: Temporal.RoundingMode
  smallestUnit: any // HACK
} {
  if (typeof options === 'string') {
    options = { roundingMode: options }
  } else {
    options = options || {}
  }
  if (options.roundingIncrement && options.roundingIncrement !== 1) {
    throw new RangeError('Non-1 roundingIncrement not allowed')
  }
  return {
    roundingMode: 'halfExpand',
    ...options,
    smallestUnit: forcedUnit,
  }
}
