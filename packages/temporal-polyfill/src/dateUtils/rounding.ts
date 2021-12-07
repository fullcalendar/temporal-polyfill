import { RoundingConfig } from '../argParse/roundingOptions'
import { durationUnitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { roundToIncrement, roundToIncrementBI } from '../utils/math'
import { DateLikeInstance } from './calendar'
import { createDuration, negateFields } from './duration'
import { TimeFields, nanoToWrappedTimeFields, timeFieldsToNano } from './time'
import { computeExactDuration } from './totalUnits'
import { DayTimeUnitInt, nanoIn } from './units'

// PRECONDITION: dates are balanced i.e. have point-to-point
// PRECONDITION: dates have same calendar
export function roundBalancedDuration(
  balancedDuration: Duration,
  { smallestUnit, roundingIncrement, roundingMode }: RoundingConfig,
  d0: DateLikeInstance,
  d1: DateLikeInstance,
  flip?: boolean,
): Duration {
  let durationLike = computeExactDuration(balancedDuration, smallestUnit, d0, d1)
  const unitName = durationUnitNames[smallestUnit]

  function doRound() {
    const orig = durationLike[unitName]! // computeExactDuration guarantees value
    durationLike[unitName] = roundToIncrement(
      orig,
      roundingIncrement,
      roundingMode,
    )
  }

  if (roundingMode === Math.round) {
    // 'halfExpand' cares about point-to-point translation
    doRound()
  }
  if (flip) {
    durationLike = negateFields(durationLike)
  }
  if (roundingMode !== Math.round) {
    // other rounding techniques operate on final number
    doRound()
  }

  return createDuration(durationLike)
}

export function roundTimeOfDay(
  timeFields: TimeFields,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): [TimeFields, number] {
  const nano = roundNano(timeFieldsToNano(timeFields), roundingConfig)
  return nanoToWrappedTimeFields(nano) // nano is always time-of-day
}

export function roundNano(
  nano: bigint,
  { smallestUnit, roundingIncrement, roundingMode }: RoundingConfig,
): bigint {
  return roundToIncrementBI(
    nano,
    nanoIn[smallestUnit] * roundingIncrement,
    roundingMode,
  )
}
