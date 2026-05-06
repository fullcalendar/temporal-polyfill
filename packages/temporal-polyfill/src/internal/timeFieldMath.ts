import { timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { Overflow } from './optionsModel'
import { givenFieldsToBigNano, nanoToGivenFields } from './unitMath'
import { Unit, nanoInUtcDay } from './units'
import { clampProp, divModFloor, zipProps } from './utils'

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
  return zipProps(timeFieldNamesAsc, [
    clampProp(timeFields, 'hour', 0, 23, overflow),
    clampProp(timeFields, 'minute', 0, 59, overflow),
    clampProp(timeFields, 'second', 0, 59, overflow),
    clampProp(timeFields, 'millisecond', 0, 999, overflow),
    clampProp(timeFields, 'microsecond', 0, 999, overflow),
    clampProp(timeFields, 'nanosecond', 0, 999, overflow),
  ])
}

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function timeFieldsToNano(timeFields: TimeFields): number {
  return Number(givenFieldsToBigNano(timeFields, Unit.Hour, timeFieldNamesAsc))
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
