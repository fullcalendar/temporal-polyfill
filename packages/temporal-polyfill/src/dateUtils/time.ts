import { parseDiffOptions } from '../argParse/diffOptions'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { Duration } from '../public/duration'
import { PlainTime } from '../public/plainTime'
import {
  CompareResult,
  DateTimeISOFields,
  TimeArg,
  TimeDiffOptions,
  TimeLike,
  TimeRoundingOptions,
  TimeUnit,
} from '../public/types'
import { compareValues, numSignBI } from '../utils/math'
import { ensureObj } from './abstract'
import { DayTimeFields, nanoToDayTimeFields, splitEpochNano } from './dayTime'
import { durationToTimeFields, nanoToDuration } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { computeRoundingNanoIncrement, roundNano, roundTime } from './rounding'
import {
  HOUR,
  NANOSECOND,
  TimeUnitInt,
  nanoInDayBI,
  nanoInHourBI,
  nanoInMicroBI,
  nanoInMilliBI,
  nanoInMinuteBI,
  nanoInSecondBI,
} from './units'

export interface TimeISOMilli {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}

export interface TimeISOEssentials extends TimeISOMilli {
  isoMicrosecond: number
  isoNanosecond: number
}

export interface TimeFields {
  hour: number
  minute: number
  second: number
  millisecond: number
  microsecond: number
  nanosecond: number
}

export function createTime(isoFields: TimeISOEssentials): PlainTime {
  return new PlainTime(
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
  )
}

export function constrainTimeISO( // also converts to number
  {
    isoHour, isoMinute, isoSecond,
    isoMillisecond, isoMicrosecond, isoNanosecond,
  }: TimeISOEssentials,
  overflow: OverflowHandlingInt,
): TimeISOEssentials {
  isoHour = constrainInt(isoHour, 0, 23, overflow)
  isoMinute = constrainInt(isoMinute, 0, 59, overflow)
  isoSecond = constrainInt(isoSecond, 0, 59, overflow)
  isoMillisecond = constrainInt(isoMillisecond, 0, 999, overflow)
  isoMicrosecond = constrainInt(isoMicrosecond, 0, 999, overflow)
  isoNanosecond = constrainInt(isoNanosecond, 0, 999, overflow)
  return { isoHour, isoMinute, isoSecond, isoMillisecond, isoMicrosecond, isoNanosecond }
}

export function addToPlainTime(time: PlainTime, dur: Duration): PlainTime {
  const dayTimeFields = translateTimeOfDay(time, durationToTimeFields(dur))
  return createTime(timeLikeToISO(dayTimeFields))
}

export function diffPlainTimes(
  t0: PlainTime,
  t1: PlainTime,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<TimeUnit, TimeUnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )
  return nanoToDuration(
    roundNano(timeFieldsToNano(t1) - timeFieldsToNano(t0), diffConfig),
    diffConfig.largestUnit,
  )
}

export function roundPlainTime(plainTime: PlainTime, options: TimeRoundingOptions): PlainTime {
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

export function timeFieldsToConstrainedISO(
  fields: TimeLike,
  overflowHandling: OverflowHandlingInt,
): TimeISOEssentials {
  return constrainTimeISO(
    timeLikeToISO(fields),
    overflowHandling,
  )
}

// Normally ensureObj and ::from would fail when undefined is specified
// Fallback to 00:00 time
export function ensureLooseTime(arg: TimeArg | undefined): PlainTime {
  return ensureObj(PlainTime, arg ?? { hour: 0 })
}

// Nanosecond Math

export function translateTimeOfDay(timeOfDay: TimeFields, delta: TimeFields): DayTimeFields {
  return wrapTimeOfDayNano(timeFieldsToNano(timeOfDay) + timeFieldsToNano(delta))
}

/*
Operates on the time-of-day of *datetimes*
The returned TimeFields guaranteed to be same sign as from isoFields0->isoFields1
The returned `day` property should be added to isoFields1 before doing Calendar::dateUntil
*/
export function diffTimeOfDays(
  isoFields0: DateTimeISOFields,
  isoFields1: DateTimeISOFields,
): DayTimeFields {
  const generalSign = numSignBI(isoFieldsToEpochNano(isoFields1) - isoFieldsToEpochNano(isoFields0))
  let timeDiff = timeISOToNano(isoFields1) - timeISOToNano(isoFields0)
  const timeDiffSign = numSignBI(timeDiff)
  let day = 0

  if (generalSign && timeDiffSign && timeDiffSign !== generalSign) {
    day -= generalSign
    timeDiff += nanoInDayBI * BigInt(generalSign)
  }

  return {
    ...(nanoToDayTimeFields(timeDiff, HOUR) as TimeFields),
    day,
  }
}

export function compareTimes(t0: PlainTime, t1: PlainTime): CompareResult {
  return compareValues(timeFieldsToNano(t0), timeFieldsToNano(t1))
}

// Object -> Nanoseconds
// TODO: do ordere-arg-based methods?

export function timeFieldsToNano(timeFields: TimeFields): bigint {
  return BigInt(timeFields.hour) * nanoInHourBI +
    BigInt(timeFields.minute) * nanoInMinuteBI +
    BigInt(timeFields.second) * nanoInSecondBI +
    BigInt(timeFields.millisecond) * nanoInMilliBI +
    BigInt(timeFields.microsecond) * nanoInMicroBI +
    BigInt(timeFields.nanosecond)
}

export function timeISOToNano(timeISO: TimeISOEssentials): bigint {
  return BigInt(timeISO.isoHour) * nanoInHourBI +
    BigInt(timeISO.isoMinute) * nanoInMinuteBI +
    BigInt(timeISO.isoSecond) * nanoInSecondBI +
    BigInt(timeISO.isoMillisecond) * nanoInMilliBI +
    BigInt(timeISO.isoMicrosecond) * nanoInMicroBI +
    BigInt(timeISO.isoNanosecond)
}

// Nanoseconds -> Object

// TODO: move to dayTime.ts?
// if nano is positive, will wrap once reaching 24h, giving a positive day value
// if nano is negative, will go into previous days, giving a negative day value
export function wrapTimeOfDayNano(nano: bigint): DayTimeFields {
  const [dayNano, timeNano] = splitEpochNano(nano)
  return {
    ...(nanoToDayTimeFields(timeNano, HOUR) as TimeFields),
    day: Number(dayNano / nanoInDayBI), // always an int: dayNano is evenly divisible by nanoInDayBI
  }
}

// Object -> Object

export function timeLikeToISO(fields: TimeLike): TimeISOEssentials {
  return {
    isoNanosecond: fields.nanosecond ?? 0,
    isoMicrosecond: fields.microsecond ?? 0,
    isoMillisecond: fields.millisecond ?? 0,
    isoSecond: fields.second ?? 0,
    isoMinute: fields.minute ?? 0,
    isoHour: fields.hour ?? 0,
  }
}
