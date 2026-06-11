import * as TemporalUtils from 'temporal-utils/protected'

export const enum Unit {
  Nanosecond = 0,
  Microsecond = 1,
  Millisecond = 2,
  Second = 3,
  Minute = 4,
  Hour = 5,
  Day = 6,
  Week = 7,
  Month = 8,
  Year = 9,
}

export type TimeUnit =
  | Unit.Nanosecond
  | Unit.Microsecond
  | Unit.Millisecond
  | Unit.Second
  | Unit.Minute
  | Unit.Hour

export type DayTimeUnit = Unit.Day | TimeUnit

export const unitNameMap = {
  nanosecond: Unit.Nanosecond,
  microsecond: Unit.Microsecond,
  millisecond: Unit.Millisecond,
  second: Unit.Second,
  minute: Unit.Minute,
  hour: Unit.Hour,
  day: Unit.Day,
  week: Unit.Week,
  month: Unit.Month,
  year: Unit.Year,
}

export const unitNamesAsc = Object.keys(
  unitNameMap,
) as (keyof typeof unitNameMap)[]

// Nanoseconds
// -----------------------------------------------------------------------------

export const secInUtcDay = 86400
export const secInMinute = 60
export const secInHour = 60 * secInMinute
export const milliInSec = 1000
export const milliInMinute = milliInSec * secInMinute
export const milliInHour = milliInSec * secInHour
export const milliInUtcDay = 86400000

export const nanoInMicro = TemporalUtils.nanosecondsInMicrosecond
export const nanoInMilli = TemporalUtils.nanosecondsInMillisecond
export const nanoInSec = TemporalUtils.nanosecondsInSecond
export const nanoInMinute = TemporalUtils.nanosecondsInMinute
export const nanoInHour = TemporalUtils.nanosecondsInHour
export const nanoInUtcDay = 86_400_000_000_000

export const unitNanoMap = [
  1, // nano-in-nano
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInMinute,
  nanoInHour,
  nanoInUtcDay,
]
