import type { Temporal } from 'temporal-spec'
import { DateObj, DateTimeObj, YearMonthObj } from './utils'

export type DiffFunc<T extends YearMonthObj = DateTimeObj> = (
  date0: T,
  date1: T,
  options?: Temporal.RoundingMode | DiffOptions,
) => number

function createDiffFunc(
  unit: Temporal.PluralUnit<Temporal.DateTimeUnit>,
): DiffFunc {
  return (date0, date1, options) => {
    const normOptions = normalizeDiffOptions(options)

    if (normOptions.roundingMode) {
      return date0.until(date1, {
        ...normOptions,
        largestUnit: unit,
        smallestUnit: unit,
      })[unit]
    }

    return date0
      .until(date1, {
        ...normOptions,
        largestUnit: unit,
      })
      .total({
        unit,
        relativeTo: date0,
      })
  }
}

export const diffYears = createDiffFunc('years') as DiffFunc<YearMonthObj>
export const diffMonths = createDiffFunc('months') as DiffFunc<DateObj>
export const diffWeeks = createDiffFunc('weeks') as DiffFunc<DateObj>
export const diffDays = createDiffFunc('days') as DiffFunc<DateObj>
export const diffHours = createDiffFunc('hours') as DiffFunc<DateTimeObj>
export const diffMinutes = createDiffFunc('minutes') as DiffFunc<DateTimeObj>
export const diffSeconds = createDiffFunc('seconds') as DiffFunc<DateTimeObj>
export const diffMilliseconds = createDiffFunc(
  'milliseconds',
) as DiffFunc<DateTimeObj>
export const diffMicroseconds = createDiffFunc(
  'microseconds',
) as DiffFunc<DateTimeObj>
export const diffNanoseconds = createDiffFunc(
  'nanoseconds',
) as DiffFunc<DateTimeObj>

// Options
// -----------------------------------------------------------------------------

export type DiffOptions = {
  roundingMode?: Temporal.RoundingMode
  roundingIncrement?: number
}

export function normalizeDiffOptions(
  options: Temporal.RoundingMode | DiffOptions | undefined,
): DiffOptions {
  return typeof options === 'string' ? { roundingMode: options } : options || {}
}
