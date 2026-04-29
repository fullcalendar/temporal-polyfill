import {
  DurationDateFieldName,
  DurationDayTimeFieldName,
  DurationFieldName,
  DurationTimeFieldName,
  DurationYearMonthFieldName,
} from './durationFields'

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

// Names
// -----------------------------------------------------------------------------

// singular
export type StrictYearMonthUnitName = 'year' | 'month'
export type StrictDateUnitName = StrictYearMonthUnitName | 'week' | 'day'
export type StrictTimeUnitName =
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'
  | 'microsecond'
  | 'nanosecond'
export type StrictDayTimeUnitName = 'day' | StrictTimeUnitName
export type StrictUnitName = StrictDateUnitName | StrictTimeUnitName

// singular OR plural
export type YearMonthUnitName =
  | StrictYearMonthUnitName
  | DurationYearMonthFieldName
export type DateUnitName = StrictDateUnitName | DurationDateFieldName
export type TimeUnitName = StrictTimeUnitName | DurationTimeFieldName
export type DayTimeUnitName = StrictDayTimeUnitName | DurationDayTimeFieldName
export type UnitName = StrictUnitName | DurationFieldName

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

export const secInDay = 86400
export const milliInDay = 86400000
export const milliInSec = 1000

export const nanoInMicro = 1000 // consolidate with other 1000 units
export const nanoInMilli = 1_000_000
export const nanoInSec = 1_000_000_000
export const nanoInMinute = 60_000_000_000
export const nanoInHour = 3_600_000_000_000
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
