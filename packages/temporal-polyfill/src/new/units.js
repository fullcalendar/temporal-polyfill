import { LargeInt, numberToLargeInt } from './largeInt'
import { mapArrayToProps } from './utils'

export const nanoIndex = 0
export const microIndex = 1
export const milliIndex = 2
export const secondsIndex = 3 // secondIndex
export const minuteIndex = 4
export const hourIndex = 5
export const dayIndex = 6
export const weekIndex = 7
export const monthIndex = 8
export const yearIndex = 9

export const unitNamesAsc = [
  'nanosecond',
  'microsecond',
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year',
]

export const unitIndexes = mapArrayToProps(unitNamesAsc)

// Nanoseconds
// -------------------------------------------------------------------------------------------------

export const secInDay = 86400
export const milliInDay = 86400000 // TODO: not DRY
export const milliInSec = 1000

export const nanoInMicro = 1000 // consolidate with other 1000 units
export const nanoInMilli = 1_000_000
export const nanoInSec = 1_000_000_000
export const nanoInMinute = 60_000_000_000
export const nanoInHour = 3_600_000_000_000
export const nanoInUtcDay = 86_400_000_000_000

export const unitIndexToNano = [
  1, // nano-in-nano
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInMinute,
  nanoInHour,
  nanoInUtcDay,
]

// Utils
// -------------------------------------------------------------------------------------------------

export function givenFieldsToLargeNano(fields, unitIndex, fieldNames) {
  let largeNano = new LargeInt(0, 0)

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = unitIndexToNano[unitIndex]
    const fieldValue = fields[fieldNames[unitIndex]]

    if (fieldValue) {
      largeNano = largeNano.addLargeInt(numberToLargeInt(fieldValue).mult(divisor))
    }
  }

  return largeNano
}

export function givenFieldsToNano(fields, unitIndex, fieldNames) {
  let nano = 0

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = unitIndexToNano[unitIndex]
    const fieldValue = fields[fieldNames[unitIndex]]

    nano += fieldValue * divisor
  }

  return nano
}

export function nanoToGivenFields(nano, unitIndex, fieldNames) {
  const fields = {}

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = unitIndexToNano[unitIndex]

    fields[fieldNames[unitIndex]] = Math.trunc(nano / divisor)
    nano %= divisor
  }

  return fields
}
