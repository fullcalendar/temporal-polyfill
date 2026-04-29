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
    const unitParts = divModTrunc(fieldVal, unitInDay)
    // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
    const unitDays = unitParts[0]
    const leftoverUnits = unitParts[1]

    timeNano += leftoverUnits * unitNano
    days += unitDays
  }

  // Absorb whole days from timeNano after all sub-day units were added.
  const timeParts = divModTrunc(timeNano, nanoInUtcDay)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const timeDays = timeParts[0]
  const leftoverNano = timeParts[1]
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
