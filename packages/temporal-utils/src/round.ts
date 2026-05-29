import type { Temporal } from 'temporal-spec'
import { startOfMonth, startOfWeek, startOfYear } from './startOf.js'
import { DateObj, YearMonthObj } from './utils.js'

export function roundToYear<T extends YearMonthObj>(
  date: T,
  options?: RoundingMode | RoundingOptions,
): T {
  const start = startOfYear(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('year', options),
  )
  return start.add(duration) as T
}

export function roundToMonth<T extends DateObj>(
  date: T,
  options?: RoundingMode | RoundingOptions,
): T {
  const start = startOfMonth(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('month', options),
  )
  return start.add(duration) as T
}

export function roundToWeek<T extends DateObj>(
  date: T,
  options?: RoundingMode | RoundingOptions,
): T {
  const start = startOfWeek(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('week', options),
  )
  return start.add(duration) as T
}

// Options
// -----------------------------------------------------------------------------

type RoundingMode = Temporal.RoundingOptions<
  Temporal.DateUnit | Temporal.TimeUnit
>['roundingMode']

// for big units only
export type RoundingOptions = {
  roundingMode?: RoundingMode
  roundingIncrement?: 1
}

export function normalizeRoundingOptions(
  forcedUnit: 'week' | 'month' | 'year',
  options: RoundingMode | RoundingOptions | undefined,
): {
  roundingMode: RoundingMode
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
