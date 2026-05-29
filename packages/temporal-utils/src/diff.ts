import type { Temporal } from 'temporal-spec'
import { DateObj, TimeObj, YearMonthObj } from './utils.js'

type DiffObj = Temporal.Instant | TimeObj | YearMonthObj

export type DiffFunc<T extends DiffObj = DiffObj> = (
  date0: T,
  date1: T,
  options?: RoundingMode | DiffOptions,
) => number

function createDiffFunc(unit: PluralOnlyUnit): DiffFunc {
  return (date0: any, date1: any, options) => {
    const normOptions = normalizeDiffOptions(options)

    // TODO: throw error if unit impossible for input-types?
    // like diffing years for PlainTime?

    if (normOptions.roundingMode) {
      return date0.until(date1, {
        ...normOptions,
        largestUnit: unit,
        smallestUnit: unit,
      })[unit]
    }

    const duration = date0.until(date1, {
      ...normOptions,
      largestUnit: unit,
    })

    // Time-unit helpers produce pure elapsed-time totals. This keeps Instant
    // and PlainTime valid because neither can be used as a `relativeTo` value.
    if (isTimeUnit(unit)) {
      return duration.total(unit)
    }

    // Date-bearing objects need `relativeTo` so totals account for calendar
    // units and, for ZonedDateTime, time-zone transitions. PlainYearMonth has
    // month precision, so day 1 gives Duration.total a concrete date anchor.
    const relativeTo = (
      !('day' in date0) && 'toPlainDate' in date0
        ? date0.toPlainDate({ day: 1 })
        : date0
    ) as DateObj
    return duration.total({ unit, relativeTo })
  }
}

// TODO: more DRY with elsewhere?
function isTimeUnit(unit: PluralOnlyUnit): unit is TimeUnit {
  return (
    unit === 'hours' ||
    unit === 'minutes' ||
    unit === 'seconds' ||
    unit === 'milliseconds' ||
    unit === 'microseconds' ||
    unit === 'nanoseconds'
  )
}

export const diffYears = createDiffFunc('years') as DiffFunc<YearMonthObj>
export const diffMonths = createDiffFunc('months') as DiffFunc<YearMonthObj>
export const diffWeeks = createDiffFunc('weeks') as DiffFunc<DateObj>
export const diffDays = createDiffFunc('days') as DiffFunc<DateObj>
export const diffHours = createDiffFunc('hours') as DiffFunc<
  Temporal.Instant | TimeObj
>
export const diffMinutes = createDiffFunc('minutes') as DiffFunc<
  Temporal.Instant | TimeObj
>
export const diffSeconds = createDiffFunc('seconds') as DiffFunc<
  Temporal.Instant | TimeObj
>
export const diffMilliseconds = createDiffFunc('milliseconds') as DiffFunc<
  Temporal.Instant | TimeObj
>
export const diffMicroseconds = createDiffFunc('microseconds') as DiffFunc<
  Temporal.Instant | TimeObj
>
export const diffNanoseconds = createDiffFunc('nanoseconds') as DiffFunc<
  Temporal.Instant | TimeObj
>

// Options
// -----------------------------------------------------------------------------

type RoundingMode = Temporal.RoundingOptions<
  Temporal.DateUnit | Temporal.TimeUnit
>['roundingMode']
type PluralOnlyUnit = 'years' | 'months' | 'weeks' | 'days' | TimeUnit

type TimeUnit =
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
