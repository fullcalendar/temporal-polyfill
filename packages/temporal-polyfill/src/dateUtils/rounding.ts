import { DiffConfig } from '../argParse/diffOptions'
import { OFFSET_PREFER } from '../argParse/offsetHandling'
import { RoundingConfig, parseRoundingOptions } from '../argParse/roundingOptions'
import { durationUnitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { PlainDateTime, createDateTime } from '../public/plainDateTime'
import { PlainTime, createTime } from '../public/plainTime'
import {
  DateISOFields, DateTimeISOFields, DateTimeRoundingOptions,
  DayTimeUnit,
  TimeRoundingOptions,
  TimeUnit,
} from '../public/types'
import { ZonedDateTime, createZonedDateTime } from '../public/zonedDateTime'
import { RoundingFunc, roundToIncrement, roundToIncrementBI } from '../utils/math'
import { addWholeDays } from './add'
import { DateLikeInstance } from './calendar'
import { DayTimeFields, splitEpochNano } from './dayTime'
import { balanceDuration, createDuration, nanoToDuration, negateFields } from './duration'
import { timeFieldsToNano, timeLikeToISO, toNano, wrapTimeOfDayNano } from './isoMath'
import { computeNanoInDay } from './offset'
import { computeExactDuration } from './totalUnits'
import { TimeFields } from './types-private'
import { DAY, DayTimeUnitInt, HOUR, NANOSECOND, TimeUnitInt, isDateUnit, nanoIn } from './units'

export function roundInstant(instant: Instant, options: TimeRoundingOptions): Instant {
  const roundingConfig = parseRoundingOptions(options, undefined, NANOSECOND, HOUR, false, true)
  const [dayNano, timeNano] = splitEpochNano(instant.epochNanoseconds)

  return new Instant(dayNano + roundNano(timeNano, roundingConfig))
}

export function roundPlainTime(
  plainTime: PlainTime,
  options: TimeRoundingOptions | TimeUnit,
): PlainTime {
  const roundingConfig = parseRoundingOptions<TimeUnit, TimeUnitInt>(
    options,
    undefined, // no default. required
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )
  const dayTimeFields = roundTime(
    plainTime,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
  return createTime(timeLikeToISO(dayTimeFields))
}

export function roundDateTimeWithOptions(
  dateTime: PlainDateTime,
  options: DateTimeRoundingOptions | DayTimeUnit,
): PlainDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. required
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  return roundDateTime(
    dateTime,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

export function roundDateTime(
  dateTime: PlainDateTime,
  nanoIncrement: number,
  roundingFunc: RoundingFunc,
): PlainDateTime {
  const dayTimeFields = roundTime(dateTime, nanoIncrement, roundingFunc)
  return createDateTime(
    combineISOWithDayTimeFields(dateTime.getISOFields(), dayTimeFields),
  )
}

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
  // TODO: instead of this mess, have a halfExpandDirection arg

  let resDuration = createDuration(durationLike)

  // rebalance
  if (smallestUnit > NANOSECOND) {
    if (flip) {
      // yuck
      resDuration = balanceDuration(resDuration.negated(), largestUnit, d0).negated()
    } else {
      resDuration = balanceDuration(resDuration, largestUnit, d0)
    }
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

export function roundZonedDateTimeWithOptions(
  zonedDateTime: ZonedDateTime,
  options: DateTimeRoundingOptions | DayTimeUnit | undefined,
): ZonedDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. will error-out if unset
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  if (roundingConfig.smallestUnit === DAY) {
    const dayTimeFields = roundTimeToSpecialDay(
      zonedDateTime,
      computeNanoInDay(zonedDateTime),
      roundingConfig.roundingMode,
    )
    // TODO: more DRY
    return createDateTime(
      combineISOWithDayTimeFields(zonedDateTime.getISOFields(), dayTimeFields),
    ).toZonedDateTime(zonedDateTime.timeZone)
  }
  return roundZonedDateTime(
    zonedDateTime,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

export function roundZonedDateTime(
  zonedDateTime: ZonedDateTime,
  nanoIncrement: number,
  roundingFunc: RoundingFunc,
): ZonedDateTime {
  const dateTime = roundDateTime(
    zonedDateTime.toPlainDateTime(), // TODO: way around this conversion?
    nanoIncrement,
    roundingFunc,
  )
  return createZonedDateTime(
    {
      ...dateTime.getISOFields(),
      timeZone: zonedDateTime.timeZone,
      offset: zonedDateTime.offsetNanoseconds, // try to keep same offset with OFFSET_PREFER
    },
    undefined, // options
    OFFSET_PREFER,
  )
}
