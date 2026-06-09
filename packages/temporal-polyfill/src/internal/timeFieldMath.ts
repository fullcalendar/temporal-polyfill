import { timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { Overflow } from './optionsModel'
import { givenFieldsToBigNano, nanoToGivenFields } from './unitMath'
import { Unit, nanoInMilli, nanoInUtcDay } from './units'
import { clampProp, divModFloor, zipPropsDesc } from './utils'

// Time Field Validation
// -----------------------------------------------------------------------------

export function checkTimeFields<P extends TimeFields>(timeFields: P): P {
  constrainTimeFields(timeFields, Overflow.Reject)
  return timeFields
}

// this is a test

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

// yo

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function timeFieldsToNano(timeFields: TimeFields): number {
  return Number(givenFieldsToBigNano(timeFields, Unit.Hour, timeFieldNamesAsc))
}

// For Intl formatting: PlainTime has no UTC anchor, so we treat the time fields
// as an offset from the Unix epoch (midnight, 1970-01-01 UTC).
export function timeFieldsToMilli(timeFields: TimeFields): number {
  return timeFieldsToNano(timeFields) / nanoInMilli
}

export function nanoToTimeAndDay(nano: number): [TimeFields, number] {
  const [dayDelta, timeNano] = divModFloor(nano, nanoInUtcDay)
  const timeFields = nanoToGivenFields(
    timeNano,
    Unit.Hour,
    timeFieldNamesAsc,
  ) as TimeFields

  return [timeFields, dayDelta]
}
