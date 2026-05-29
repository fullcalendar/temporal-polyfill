import type { Temporal } from 'temporal-spec'
import { startOfMonth, startOfWeek, startOfYear } from './startOf.js'
import { RoundingMathOptions, normalizeOptions } from './utils.js'

export function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions): T {
  const start = startOfYear(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('year', options),
  )
  return start.add(duration) as T
}

export function roundToMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions): T {
  const start = startOfMonth(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('month', options),
  )
  return start.add(duration) as T
}

export function roundToWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions): T {
  const start = startOfWeek(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('week', options),
  )
  return start.add(duration) as T
}

export function normalizeRoundingOptions(
  forcedUnit: 'week' | 'month' | 'year',
  options: RoundingMathOptions | undefined,
): {
  roundingMode: RoundingMathOptions['roundingMode']
  smallestUnit: any // HACK
} {
  const normOptions = normalizeOptions(options)

  // This is just for units >day
  if (normOptions.roundingIncrement && normOptions.roundingIncrement !== 1) {
    throw new RangeError('Non-1 roundingIncrement not allowed')
  }

  return {
    roundingMode: 'halfExpand',
    ...normOptions,
    smallestUnit: forcedUnit,
  }
}
