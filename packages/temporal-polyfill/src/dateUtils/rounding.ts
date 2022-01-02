import { DiffConfig } from '../argParse/diffOptions'
import { RoundingConfig } from '../argParse/roundingOptions'
import { durationUnitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { PlainDateTime } from '../public/plainDateTime'
import { DateISOFields, DateTimeISOFields } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { RoundingFunc, roundToIncrement, roundToIncrementBI } from '../utils/math'
import { addWholeDays } from './add'
import { DateLikeInstance } from './calendar'
import { DayTimeFields } from './dayTime'
import { balanceDuration, createDuration, nanoToDuration, negateFields } from './duration'
import { TimeFields, timeFieldsToNano, timeLikeToISO, wrapTimeOfDayNano } from './time'
import { computeExactDuration } from './totalUnits'
import { DayTimeUnitInt, NANOSECOND, isDateUnit, nanoIn } from './units'
import { toNano } from './zonedDateTime'

export function roundBalancedDuration(
  balancedDuration: Duration,
  diffConfig: DiffConfig,
  d0: DateLikeInstance,
  d1: DateLikeInstance,
  flip?: boolean,
): Duration {
  const { largestUnit, smallestUnit, roundingIncrement, roundingMode } = diffConfig

  // optimize for time units
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration( // TODO: make util like diffTimeScale
      roundNano(
        (
          toNano(d1 as (ZonedDateTime | PlainDateTime)) -
          toNano(d0 as (ZonedDateTime | PlainDateTime))
        ) * (flip ? -1n : 1n),
        diffConfig as RoundingConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

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

  let resDuration = createDuration(durationLike)

  // rebalance
  if (smallestUnit > NANOSECOND) {
    resDuration = balanceDuration(resDuration, largestUnit, d0)
  }

  return resDuration
}

export function roundTimeToSpecialDay(
  timeFields: TimeFields,
  ourNanoInDay: number,
  roundingFunc: RoundingFunc,
): DayTimeFields {
  const nano = timeFieldsToNano(timeFields)
  return {
    day: roundingFunc(Number(nano) / ourNanoInDay),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }
}

export function roundTime(
  timeFields: TimeFields,
  nanoIncrement: number,
  roundingFunc: RoundingFunc,
): DayTimeFields {
  return wrapTimeOfDayNano(
    roundToIncrementBI(
      timeFieldsToNano(timeFields),
      nanoIncrement,
      roundingFunc,
    ),
  )
}

// convenience func
export function roundNano(
  nano: bigint,
  roundingConfig: RoundingConfig,
): bigint {
  return roundToIncrementBI(
    nano,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

// util
export function computeRoundingNanoIncrement(roundingConfig: RoundingConfig): number {
  return nanoIn[roundingConfig.smallestUnit] * roundingConfig.roundingIncrement
}

// util
export function combineISOWithDayTimeFields(
  isoFields: DateISOFields,
  dayTimeFields: DayTimeFields,
): DateTimeISOFields {
  const dateISOFields = addWholeDays(isoFields, dayTimeFields.day) // preserves `calendar`
  return {
    ...dateISOFields,
    ...timeLikeToISO(dayTimeFields),
  }
}
