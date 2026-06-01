import type { Temporal } from 'temporal-spec'
import * as errorMessages from './errorMessages.js'
import { startOfMonth, startOfWeek, startOfYear } from './startOf.js'
import { RoundingMathOptions, RoundingMode, getOptionsObject } from './utils.js'

export function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T
export function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, roundingMode: RoundingMode): T
export function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options: RoundingMathOptions): T
export function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions | RoundingMode): T {
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
>(date: T): T
export function roundToMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, roundingMode: RoundingMode): T
export function roundToMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options: RoundingMathOptions): T
export function roundToMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions | RoundingMode): T {
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
>(date: T): T
export function roundToWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, roundingMode: RoundingMode): T
export function roundToWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options: RoundingMathOptions): T
export function roundToWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMathOptions | RoundingMode): T {
  const start = startOfWeek(date)
  const duration = start.until(
    date as any,
    normalizeRoundingOptions('week', options),
  )
  return start.add(duration) as T
}

export function normalizeRoundingOptions(
  forcedUnit: 'week' | 'month' | 'year',
  options: RoundingMathOptions | RoundingMode | undefined,
): {
  roundingMode: RoundingMathOptions['roundingMode']
  smallestUnit: any // HACK
} {
  // Accept a bare roundingMode string as shorthand for { roundingMode }.
  const normOptions: RoundingMathOptions =
    typeof options === 'string'
      ? { roundingMode: options }
      : getOptionsObject(options)

  // This is just for units >day
  if (normOptions.roundingIncrement && normOptions.roundingIncrement !== 1) {
    throw new RangeError(errorMessages.nonOneRoundingIncrement)
  }

  return {
    roundingMode: 'halfExpand',
    ...normOptions,
    smallestUnit: forcedUnit,
  }
}
