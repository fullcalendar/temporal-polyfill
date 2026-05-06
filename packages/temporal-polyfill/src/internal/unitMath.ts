import { DayTimeUnit, Unit, unitNanoMap } from './units'
import { divTrunc, modTrunc } from './utils'

/*
When largestUnit=hour, returned `Day` value is "days worth of hours".
This lives outside units.ts so that file can stay focused on unit names and
constants, while the conversion helpers depend on the bigint representation.
*/
export function givenFieldsToBigNano<K extends string>(
  fields: Record<K, number>,
  largestUnit: DayTimeUnit,
  fieldNames: K[],
): bigint {
  let bigNano = BigInt(0)

  for (let unit = Unit.Nanosecond; unit <= largestUnit; unit++) {
    const fieldVal = fields[fieldNames[unit]]
    const unitNano = unitNanoMap[unit]

    // Keep the nanosecond total exact until callers intentionally project it
    // back into Number fields.
    bigNano += BigInt(fieldVal) * BigInt(unitNano)
  }

  return bigNano
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
