import { divModTrunc, divTrunc, modTrunc } from './utils'

/*
TODO: use short names?
*/
export const enum Unit {
  Nanosecond,
  Microsecond,
  Millisecond,
  Second,
  Minute,
  Hour,
  Day,
  Week,
  Month,
  Year,
}

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

export type UnitName = keyof typeof unitNameMap
// TODO: more convenient type for OR-ing with DurationFields (for plural?)

export type TimeUnit =
  Unit.Nanosecond |
  Unit.Microsecond |
  Unit.Millisecond |
  Unit.Second |
  Unit.Minute |
  Unit.Hour

export type DayTimeUnit = Unit.Day | TimeUnit

export const unitNamesAsc = Object.keys(unitNameMap) as (keyof typeof unitNameMap)[]

// Nanoseconds
// -------------------------------------------------------------------------------------------------

export const secInDay = 86400
export const milliInDay = 86400000 // TODO: not DRY
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

// Utils
// -------------------------------------------------------------------------------------------------

export function givenFieldsToTimeNano<K extends string>(
  fields: Record<K, number>,
  largestUnit: DayTimeUnit,
  fieldNames: K[],
): [
  timeNano: number,
  dayCnt: number,
] {
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
  return [leftoverNano, days + timeDays]
}

export function nanoToGivenFields<F>(
  nano: number,
  largeUnit: DayTimeUnit, // stops populating at this unit
  fieldNames: (keyof F)[],
): { [Key in keyof F]?: number } {
  const fields = {} as { [Key in keyof F]: number }

  for (let unit = largeUnit; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]

    fields[fieldNames[unit]] = divTrunc(nano, divisor)
    nano = modTrunc(nano, divisor)
  }

  return fields
}
