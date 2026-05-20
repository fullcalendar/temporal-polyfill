import { toBigInt, toInteger, toStrictInteger } from './cast'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import {
  EpochNanoFields,
  createDurationSlots,
  createEpochNanoSlots,
  createTimeSlots,
} from './slots'
import { checkEpochNanoInBounds } from './temporalLimits'
import { checkTimeFields } from './timeFieldMath'
import { NumberSign, mapProps, zipPropsDesc } from './utils'

export function constructEpochNanoSlots(epochNano: bigint): EpochNanoFields {
  return createEpochNanoSlots(checkEpochNanoInBounds(toBigInt(epochNano)))
}

export function constructTimeSlots(
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
): TimeFields {
  const timeFields = zipPropsDesc(timeFieldNamesAsc, [
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  ])
  return createTimeSlots(checkTimeFields(mapProps(toInteger, timeFields)))
}

export function constructDurationSlots(
  years = 0,
  months = 0,
  weeks = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
  microseconds = 0,
  nanoseconds = 0,
): DurationFields & { sign: NumberSign } {
  const durationFields = zipPropsDesc(durationFieldNamesAsc, [
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  ])
  return createDurationSlots(
    checkDurationUnits(mapProps(toStrictInteger, durationFields)),
  )
}
