import { LargeInt, numberToLargeInt } from './largeInt'

/*
TODO: use short names?
*/
export enum Unit {
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

export function givenFieldsToLargeNano<K extends string>(
  fields: Record<K, number>,
  unit: DayTimeUnit,
  fieldNames: K[],
): LargeInt {
  let largeNano = new LargeInt(0, 0)

  for (; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]
    const fieldVal = fields[fieldNames[unit]]

    if (fieldVal) {
      largeNano = largeNano.addLargeInt(numberToLargeInt(fieldVal).mult(divisor))
    }
  }

  return largeNano
}

export function givenFieldsToNano<K extends string>(
  fields: Record<K, number>,
  unit: DayTimeUnit,
  fieldNames: K[],
): number {
  let nano = 0

  for (; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]
    const fieldVal = fields[fieldNames[unit]]

    nano += fieldVal * divisor
  }

  return nano
}

export function nanoToGivenFields<F>(
  nano: number,
  unit: DayTimeUnit, // largestUnit
  fieldNames: (keyof F)[],
): { [Key in keyof F]?: number } {
  const fields = {} as { [Key in keyof F]: number }

  for (; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]

    fields[fieldNames[unit]] = Math.trunc(nano / divisor)
    nano %= divisor
  }

  return fields
}
