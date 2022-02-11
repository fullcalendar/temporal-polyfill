import { durationUnitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { ZonedDateTime } from '../public/zonedDateTime'
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
  const balancedDuration = balanceComplexDuration(
    duration,
    unit,
    relativeTo,
    true, // dissolveWeeks
  )
  const durationLike = computeExactDuration(
    balancedDuration,
    unit,
    relativeTo,
    relativeTo.add(balancedDuration),
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

  const startNano = realisticEpochNano(startDateTime)
  const endNano = realisticEpochNano(endDateTime)
  const middleNano = realisticEpochNano(d1)
  const unitFrac = Number(middleNano - startNano) / Number(endNano - startNano) * sign

  dur[smallestUnitName]! += unitFrac // above loop populated this
  return dur
}

// ugh
function realisticEpochNano(dt: ZonedDateTime | PlainDateTime | PlainDate): bigint {
  const { epochNanoseconds } = dt as ZonedDateTime
  return epochNanoseconds !== undefined
    ? epochNanoseconds
    : isoFieldsToEpochNano(dt.getISOFields())
}
