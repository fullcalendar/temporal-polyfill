import { BigNano } from './bigNano'
import { DayTimeUnit, Unit, nanoInUtcDay, unitNanoMap } from './units'
import { divModTrunc, divTrunc, modTrunc } from './utils'

/*
When largestUnit=hour, returned `Day` value is "days worth of hours".
This lives outside units.ts so that file can stay focused on unit names and
constants, while the conversion helpers depend on the BigNano representation.
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

    // Absorb whole days from the current unit to prevent overflow before
    // folding the remainder into the time-within-day nanosecond bucket.
    const unitInDay = nanoInUtcDay / unitNano
    const [unitDays, leftoverUnits] = divModTrunc(fieldVal, unitInDay)

    timeNano += leftoverUnits * unitNano
    days += unitDays
  }

  // Absorb whole days from timeNano after all sub-day units were added.
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
