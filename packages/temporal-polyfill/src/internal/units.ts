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

export const secInMinute = 60
export const secInHour = 60 * secInMinute
export const secInUtcDay = 86_400

export const milliInSec = 1_000
export const milliInMinute = milliInSec * secInMinute
export const milliInHour = milliInSec * secInHour
export const milliInUtcDay = milliInSec * secInUtcDay

export const nanoInMicro = TemporalUtils.nanoInMicro
export const nanoInMilli = TemporalUtils.nanoInMilli
export const nanoInSec = TemporalUtils.nanoInSec
export const nanoInMinute = TemporalUtils.nanoInMinute
export const nanoInHour = TemporalUtils.nanoInHour
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
