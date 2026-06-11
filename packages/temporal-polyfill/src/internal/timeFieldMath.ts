import {
  bigNanoInHour,
  bigNanoInMicro,
  bigNanoInMilli,
  bigNanoInMinute,
  bigNanoInSec,
} from './bigNano'
import { DurationFields } from './durationFields'
import { timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { Overflow } from './optionsModel'
import {
  milliInHour,
  milliInMinute,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInUtcDay,
  secInHour,
  secInMinute,
} from './units'
import { clampProp, divModFloor, zipPropsDesc } from './utils'

// Time Field Validation
// -----------------------------------------------------------------------------

export function checkTimeFields<P extends TimeFields>(timeFields: P): P {
  constrainTimeFields(timeFields, Overflow.Reject)
  return timeFields
}

export function constrainTimeFields(
  timeFields: TimeFields,
  overflow?: Overflow,
): TimeFields {
  return zipPropsDesc(timeFieldNamesAsc, [
    clampProp(timeFields, 'hour', 0, 23, overflow),
    clampProp(timeFields, 'minute', 0, 59, overflow),
    clampProp(timeFields, 'second', 0, 59, overflow),
    clampProp(timeFields, 'millisecond', 0, 999, overflow),
    clampProp(timeFields, 'microsecond', 0, 999, overflow),
    clampProp(timeFields, 'nanosecond', 0, 999, overflow),
  ])
}

// Fields -> Unit-Number
// -----------------------------------------------------------------------------

// Convenience
export function timeFieldsToNano(timeFields: TimeFields): number {
  return (
    timeFieldsToSec(timeFields) * nanoInSec + timeFieldsToSubsecNano(timeFields)
  )
}

export function timeFieldsToMilli(timeFields: TimeFields): number {
  return timeFieldsToSec(timeFields) * milliInSec + timeFields.millisecond
}

export function timeFieldsToSec(timeFields: TimeFields): number {
  return (
    timeFields.hour * secInHour +
    timeFields.minute * secInMinute +
    timeFields.second
  )
}

export function timeFieldsToSubsecNano(timeFields: TimeFields): number {
  return (
    timeFields.millisecond * nanoInMilli +
    timeFields.microsecond * nanoInMicro +
    timeFields.nanosecond
  )
}

// Time Fields -> Unit-Number (bigint)
// -----------------------------------------------------------------------------

export function timeFieldsToBigNano(fields: DurationFields): bigint {
  return (
    BigInt(fields.hours) * bigNanoInHour +
    BigInt(fields.minutes) * bigNanoInMinute +
    subminuteFieldsToBigNano(fields)
  )
}

export function subminuteFieldsToBigNano(fields: DurationFields): bigint {
  return (
    BigInt(fields.seconds) * bigNanoInSec +
    BigInt(fields.milliseconds) * bigNanoInMilli +
    BigInt(fields.microseconds) * bigNanoInMicro +
    BigInt(fields.nanoseconds)
  )
}

// Unit-Number -> Fields
// -----------------------------------------------------------------------------

export function nanoToTimeAndDay(nano: number): [TimeFields, number] {
  const [dayDelta, timeNano] = divModFloor(nano, nanoInUtcDay)
  return [nanoToTimeFields(timeNano), dayDelta]
}

export function nanoToTimeFields(timeNano: number): TimeFields {
  const [timeMilli, nanoAfterMilli] = divModFloor(timeNano, nanoInMilli)
  const [microsecond, nanosecond] = divModFloor(nanoAfterMilli, nanoInMicro)
  return milliToTimeFields(timeMilli, microsecond, nanosecond)
}

export function milliToTimeFields(
  timeMilli: number,
  microsecond = 0,
  nanosecond = 0,
): TimeFields {
  const [hour, milliAfterHour] = divModFloor(timeMilli, milliInHour)
  const [minute, milliAfterMinute] = divModFloor(milliAfterHour, milliInMinute)
  const [second, millisecond] = divModFloor(milliAfterMinute, milliInSec)
  return {
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  }
}
