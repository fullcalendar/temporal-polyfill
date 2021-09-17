import { RoundConfig } from '../argParse/roundOptions'
import { Duration } from '../public/duration'
import { RoundingFunc, roundToIncrement } from '../utils/math'
import { DateLikeInstance } from './calendar'
import { DayTimeFields, dayTimeFieldsToNano, nanoToDayTimeFields } from './dayTime'
import { createDuration, durationUnitNames } from './duration'
import { TimeFields, nanoToTimeFields, timeFieldsToNano } from './time'
import { computeExactDuration } from './totalUnits'
import { DayTimeUnitInt, nanoIn } from './units'

// PRECONDITION: dates are balanced i.e. have point-to-point
// PRECONDITION: dates have same calendar
export function roundBalancedDuration(
  balancedDuration: Duration,
  { smallestUnit, roundingIncrement, roundingMode }: RoundConfig,
  d0: DateLikeInstance,
  d1: DateLikeInstance,
): Duration {
  const durationLike = computeExactDuration(balancedDuration, smallestUnit, d0, d1)
  const unitName = durationUnitNames[smallestUnit]
  durationLike[unitName] = roundToIncrement(
    durationLike[unitName]!, // computeExactDuration guarantees value
    roundingIncrement,
    roundingMode,
  )
  return createDuration(durationLike)
}

export function roundTimeOfDay(
  timeFields: TimeFields,
  roundConfig: RoundConfig<DayTimeUnitInt>,
): [TimeFields, number] {
  const nano = roundNano(timeFieldsToNano(timeFields), roundConfig)
  return nanoToTimeFields(nano, 1) // forward=1
}

export function roundDayTimeFields(
  fields: DayTimeFields,
  roundConfig: RoundConfig<DayTimeUnitInt>,
  largestUnit: DayTimeUnitInt,
): TimeFields {
  const nano = roundNano(dayTimeFieldsToNano(fields), roundConfig)
  return nanoToDayTimeFields(nano, largestUnit)
}

interface RoundNanoConfig {
  smallestUnit: DayTimeUnitInt
  roundingIncrement?: number
  roundingMode: RoundingFunc
}

export function roundNano(
  nano: number,
  { smallestUnit, roundingIncrement, roundingMode }: RoundNanoConfig,
): number {
  return roundToIncrement(
    nano,
    nanoIn[smallestUnit] * (roundingIncrement || 1),
    roundingMode,
  )
}
