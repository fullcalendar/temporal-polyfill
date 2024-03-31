import type { Temporal } from 'temporal-spec'
import { startOfMonth, startOfWeek, startOfYear } from './startOf'
import {
  DateObj,
  RoundingOptions,
  YearMonthObj,
  normalizeRoundingOptions,
} from './utils'

export function roundToYear<T extends YearMonthObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const duration = startOfYear(date).until(
    date,
    normalizeRoundingOptions(options),
  )
  return date.add(duration)
}

export function roundToMonth<T extends DateObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const duration = startOfMonth(date).until(
    date,
    normalizeRoundingOptions(options),
  )
  return date.add(duration)
}

export function roundToWeek<T extends DateObj>(
  date: T,
  options?: Temporal.RoundingMode | RoundingOptions,
) {
  const duration = startOfWeek(date).until(
    date,
    normalizeRoundingOptions(options),
  )
  return date.add(duration)
}
