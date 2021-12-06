import { parseDiffOptions } from '../argParse/diffOptions'
import { timeFieldMap } from '../argParse/fieldStr'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { Duration } from '../public/duration'
import { PlainTime } from '../public/plainTime'
import {
  CompareResult,
  TimeArg,
  TimeDiffOptions,
  TimeLike,
  TimeRoundingOptions,
  TimeUnit,
} from '../public/types'
import { compareValues } from '../utils/math'
import { mapHash } from '../utils/obj'
import { ensureObj } from './abstract'
import { nanoToDayTimeFields } from './dayTime'
import { durationToTimeFields, nanoToDuration } from './duration'
import { roundNano, roundTimeOfDay } from './rounding'
import {
  DAY,
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

export function overrideTimeFields(overrides: Partial<TimeFields>, base: TimeFields): TimeFields {
  return mapHash(timeFieldMap, (_refineFunc, fieldName) => (
    overrides[fieldName as keyof TimeFields] ?? base[fieldName as keyof TimeFields]
  ))
}

export function addToPlainTime(time: PlainTime, dur: Duration): PlainTime {
  const [fields] = addTimeFields(time, durationToTimeFields(dur))
  return createTime(timeLikeToISO(fields))
}

export function diffPlainTimes(
  t0: PlainTime,
  t1: PlainTime,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<TimeUnit, TimeUnitInt>(
    options,
    NANOSECOND, // largestUnitDefault
    HOUR, // smallestUnitDefault
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
  const [fields] = roundTimeOfDay(plainTime, roundingConfig)
  return createTime(timeLikeToISO(fields))
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

export function addTimeFields(t0: TimeFields, t1: TimeFields): [TimeFields, number] {
  return nanoToWrappedTimeFields(timeFieldsToNano(t0) + timeFieldsToNano(t1))
}

export function diffTimeFields(t0: TimeFields, t1: TimeFields): [TimeFields, number] {
  return nanoToWrappedTimeFields(timeFieldsToNano(t1) - timeFieldsToNano(t0))
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

export function nanoToWrappedTimeFields(nano: bigint): [TimeFields, number] {
  const dayDelta = nano / nanoInDayBI
  nano -= dayDelta * nanoInDayBI

  const fields = nanoToDayTimeFields(nano, DAY)

  // repurpose DayTimeFiels as TimeFields
  delete fields.day
  return [fields as TimeFields, Number(dayDelta)]
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
