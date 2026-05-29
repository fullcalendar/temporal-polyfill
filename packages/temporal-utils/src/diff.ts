import type { Temporal } from 'temporal-spec'
import { DateObj, DateTimeObj, YearMonthObj } from './utils.js'

export type DiffFunc<T extends YearMonthObj = DateTimeObj> = (
  date0: T,
  date1: T,
  options?: RoundingMode | DiffOptions,
) => number

function createDiffFunc(unit: PluralOnlyUnit): DiffFunc {
  return (date0, date1, options) => {
    const normOptions = normalizeDiffOptions(options)

    if (normOptions.roundingMode) {
      return date0.until(date1 as any, {
        ...normOptions,
        largestUnit: unit,
        smallestUnit: unit,
      })[unit]
    }

    return date0
      .until(date1 as any, {
        ...normOptions,
        largestUnit: unit,
      })
      .total({
        unit,
        relativeTo: getTotalRelativeTo(date0),
      })
  }
}

function getTotalRelativeTo(date: YearMonthObj): DateObj {
  return 'toPlainDate' in date && !('day' in date)
    ? date.toPlainDate({ day: 1 })
    : date
}

export const diffYears = createDiffFunc('years') as DiffFunc<YearMonthObj>
export const diffMonths = createDiffFunc('months') as DiffFunc<YearMonthObj>
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

type RoundingMode = Temporal.RoundingOptions<
  Temporal.DateUnit | Temporal.TimeUnit
>['roundingMode']
type PluralOnlyUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'
  | 'microseconds'
  | 'nanoseconds'

export type DiffOptions = {
  roundingMode?: RoundingMode
  roundingIncrement?: number
}

export function normalizeDiffOptions(
  options: RoundingMode | DiffOptions | undefined,
): DiffOptions {
  return typeof options === 'string' ? { roundingMode: options } : options || {}
}
