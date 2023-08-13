import { LargeInt, numberToLargeInt } from './largeInt'
import { NumSign, compareNumbers, divModTrunc, divTrunc, modTrunc } from './utils'

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

export function balanceUpTimeFields<F>(
  fields: F,
  largestUnit: DayTimeUnit,
  fieldNamesAsc: (keyof F)[]
): F {
  const balancedFields: any = {}
  let fieldName: keyof F
  let leftoverWhole = 0

  for (let unit = Unit.Nanosecond; fieldName = fieldNamesAsc[unit], unit < largestUnit; unit++) {
    [leftoverWhole, balancedFields[fieldName]] = divModTrunc(
      leftoverWhole + (fields[fieldName] as number),
      unitNanoMap[unit + 1],
    )
  }

  return {
    ...fields,
    [fieldName]: leftoverWhole + (fields[fieldName] as number),
    ...balancedFields
  }
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

/*
Whatever unit you want, it might not populate all fields
*/
export function nanoToGivenFields<F>(
  nano: number,
  unit: DayTimeUnit, // largestUnit
  fieldNames: (keyof F)[],
): { [Key in keyof F]?: number } {
  const fields = {} as { [Key in keyof F]: number }

  for (; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]

    fields[fieldNames[unit]] = divTrunc(nano, divisor)
    nano = modTrunc(nano, divisor)
  }

  return fields
}

export function compareGivenFields<F>(
  fields0: F,
  fields1: F,
  fieldNames: (keyof F)[], // ASC
): NumSign {
  for (let i = fieldNames.length - 1; i >= 0; i--) {
    const res = compareNumbers(
      fields0[fieldNames[i]] as number,
      fields1[fieldNames[i]] as number,
    )

    if (res) {
      return res
    }
  }

  return 0
}
