import { DurationLike } from '../args'
import { Duration } from '../duration'
import { DateLikeInstance } from './calendar'
import { dayTimeFieldsToNano } from './dayTime'
import { balanceComplexDuration, durationToDayTimeFields, durationUnitNames } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { UnitInt, YEAR, isDayTimeUnit, nanoIn } from './units'

export function computeTotalUnits(
  duration: Duration,
  unit: UnitInt,
  relativeTo: DateLikeInstance | undefined,
): number {
  const fields = durationToDayTimeFields(duration)
  if (fields && isDayTimeUnit(unit) && !relativeTo) {
    return dayTimeFieldsToNano(fields) / nanoIn[unit]
  }
  const [balancedDuration, translatedDate] = balanceComplexDuration(
    duration,
    unit,
    relativeTo, // error will be thrown if null
  )
  const durationLike = computeExactDuration(
    balancedDuration,
    unit,
    relativeTo!, // guaranteed non-null (or else error would have been thrown above)
    translatedDate,
  )
  return durationLike[durationUnitNames[unit]]! // computeExactDuration guarantees this
}

// PRECONDITION: dates have same calendar
// RETURNS: raw duration fields that might have floating-point values
// Those floating-point values will need to rounded before creating a proper Duration
export function computeExactDuration(
  balancedDuration: Duration,
  smallestUnit: UnitInt,
  d0: DateLikeInstance,
  d1: DateLikeInstance,
): DurationLike {
  const smallestUnitName = durationUnitNames[smallestUnit]
  const { sign } = balancedDuration

  // make a new duration object that excludes units smaller than smallestUnit
  const dur: DurationLike = {}
  for (let unit = YEAR; unit >= smallestUnit; unit--) {
    const durationUnit = durationUnitNames[unit]
    dur[durationUnit] = balancedDuration[durationUnit]
  }

  // a single additional unit of `unit`
  const incDur: DurationLike = { [smallestUnitName]: sign }
  const startDateTime = d0.add(dur)
  const endDateTime = startDateTime.add(incDur)

  const startNano = isoFieldsToEpochNano(startDateTime.getISOFields())
  const endNano = isoFieldsToEpochNano(endDateTime.getISOFields())
  const middleNano = isoFieldsToEpochNano(d1.getISOFields())
  const unitFrac = sign * Number((middleNano - startNano) / (endNano - startNano))

  dur[smallestUnitName]! += unitFrac // above loop populated this
  return dur
}
