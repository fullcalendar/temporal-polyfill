import { durationUnitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { DateTimeArg, DurationLike } from '../public/types'
import { DateLikeInstance } from './calendar'
import { dayTimeFieldsToNano } from './dayTime'
import {
  balanceComplexDuration,
  durationToDayTimeFields,
  extractRelativeTo,
} from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { UnitInt, YEAR, isDayTimeUnit, nanoIn } from './units'

export function computeTotalUnits(
  duration: Duration,
  unit: UnitInt,
  relativeToArg: DateTimeArg | undefined,
): number {
  const fields = durationToDayTimeFields(duration)
  if (fields && isDayTimeUnit(unit) && relativeToArg === undefined) {
    return Number(dayTimeFieldsToNano(fields) / BigInt(nanoIn[unit]))
  }
  const relativeTo = extractRelativeTo(relativeToArg) // throws an exception if undefined
  const [balancedDuration, translatedDate] = balanceComplexDuration(
    duration,
    unit,
    relativeTo,
  )
  const durationLike = computeExactDuration(
    balancedDuration,
    unit,
    relativeTo,
    translatedDate,
  )
  return durationLike[durationUnitNames[unit]]! // computeExactDuration guarantees this
}

// TODO: rename to computeFracDuration
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
  const unitFrac = Number(middleNano - startNano) / Number(endNano - startNano) * sign

  dur[smallestUnitName]! += unitFrac // above loop populated this
  return dur
}
