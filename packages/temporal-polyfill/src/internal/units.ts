import { BigNano } from './bigNano'
import {
  DurationDateFieldName,
  DurationDayTimeFieldName,
  DurationFieldName,
  DurationTimeFieldName,
  DurationYearMonthFieldName,
} from './durationFields'
import { divModTrunc, divTrunc, modTrunc } from './utils'

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
export const nanoInUtcWeek = nanoInUtcDay * 7

export const unitNanoMap = [
  1, // nano-in-nano
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInMinute,
  nanoInHour,
  nanoInUtcDay,
]

// Utils
// -----------------------------------------------------------------------------

/*
When largestUnit=hour, returned `Day` value is "days worth of hours"
*/
export function givenFieldsToBigNano<K extends string>(
  fields: Record<K, number>,
  largestUnit: DayTimeUnit,
  fieldNames: K[],
): BigNano {
  let timeNano = 0
  let days = 0

  for (let unit = Unit.Nanosecond; unit <= largestUnit; unit++) {
    const fieldVal = fields[fieldNames[unit]]
    const unitNano = unitNanoMap[unit]

    // absorb whole-days from current unit, to prevent overflow
    const unitInDay = nanoInUtcDay / unitNano
    const [unitDays, leftoverUnits] = divModTrunc(fieldVal, unitInDay)

    timeNano += leftoverUnits * unitNano
    days += unitDays
  }

  // absorb whole-days from timeNano
  const [timeDays, leftoverNano] = divModTrunc(timeNano, nanoInUtcDay)
  return [days + timeDays, leftoverNano]
}

export function nanoToGivenFields<F>(
  nano: number,
  largestUnit: DayTimeUnit, // stops populating at this unit
  fieldNames: (keyof F)[],
): { [Key in keyof F]?: number } {
  const fields = {} as { [Key in keyof F]: number }

  for (let unit = largestUnit; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]

    fields[fieldNames[unit]] = divTrunc(nano, divisor)
    nano = modTrunc(nano, divisor)
  }

  return fields
}
