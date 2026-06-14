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
import { clampEntity, divModFloor, mapProps } from './utils'

// Time Field Validation
// -----------------------------------------------------------------------------

export function checkTimeFields<P extends TimeFields>(timeFields: P): P {
  constrainTimeFields(timeFields, Overflow.Reject)
  return timeFields
}

const maxValues: Partial<TimeFields> = {
  hour: 23,
  minute: 59,
  second: 59,
  // or else 999
}

export function constrainTimeFields(
  timeFields: TimeFields,
  overflow?: Overflow,
): TimeFields {
  return mapProps(
    (val, name) => clampEntity(name, val, 0, maxValues[name] || 999, overflow),
    timeFields,
  )
}

// Fields -> Unit-Number
// -----------------------------------------------------------------------------

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
