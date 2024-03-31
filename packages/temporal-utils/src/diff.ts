import type { Temporal } from 'temporal-spec'
import {
  DateObj,
  DateTimeObj,
  YearMonthObj,
  normalizeRoundingOptions,
} from './utils'

export type DiffOptions = {
  roundingMode?: Temporal.RoundingMode
  roundingIncrement?: number
}

export type DiffFunc<T extends YearMonthObj = DateTimeObj> = (
  date0: T,
  date1: T,
  options?: Temporal.RoundingMode | DiffOptions,
) => number

function createDiffFunc(unit: Temporal.DateTimeUnit): DiffFunc {
  return (date0, date1, options) => {
    const normOptions = normalizeRoundingOptions(options) || {}

    if (normOptions.roundingMode) {
      return date0.until(date1, {
        ...normOptions,
        largestUnit: unit,
        smallestUnit: unit,
      }).years
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

export const diffYears = createDiffFunc('year') as DiffFunc<YearMonthObj>
export const diffMonths = createDiffFunc('month') as DiffFunc<DateObj>
export const diffWeeks = createDiffFunc('week') as DiffFunc<DateObj>
export const diffDays = createDiffFunc('day') as DiffFunc<DateObj>
export const diffHours = createDiffFunc('hour') as DiffFunc<DateTimeObj>
export const diffMinutes = createDiffFunc('minute') as DiffFunc<DateTimeObj>
export const diffSeconds = createDiffFunc('second') as DiffFunc<DateTimeObj>
export const diffMilliseconds = createDiffFunc(
  'millisecond',
) as DiffFunc<DateTimeObj>
export const diffMicroseconds = createDiffFunc(
  'microsecond',
) as DiffFunc<DateTimeObj>
export const diffNanoseconds = createDiffFunc(
  'nanosecond',
) as DiffFunc<DateTimeObj>
