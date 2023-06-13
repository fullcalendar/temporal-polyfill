import { LargeInt, numberToLargeInt } from './largeInt'
import { mapArrayToProps } from './utils'

export const secInDay = 86400 // TODO: rename 'sec' -> 'seconds'
export const milliInDay = 86400000 // TODO: not DRY
export const milliInSec = 1000

export const nanoInMicro = 1000 // consolidate with other 1000 units
export const nanoInMilli = 1000000
export const nanoInSec = 1000000000
export const nanoInHour = 3600000000000
export const nanoInUtcDay = 86400000000000

// Ordered by ascending size
export const nanoInUnit = {
  nanosecond: 1,
  microsecond: nanoInMicro,
  millisecond: nanoInMilli,
  second: nanoInSec,
  hour: nanoInHour,
  day: nanoInUtcDay,
  week: 0,
  month: 0,
  year: 0,
}

export const unitNamesAsc = Object.keys(nanoInUnit)
export const unitIndexes = mapArrayToProps(unitNamesAsc)

// Matches indexes in nanoInUnit
// (most are not used)
export const nanoIndex = 0
export const microIndex = 1
export const milliIndex = 2
export const secondsIndex = 3
export const minuteIndex = 4
export const hourIndex = 5
export const dayIndex = 6
export const weekIndex = 7
export const monthIndex = 8
export const yearIndex = 9

// Utils
// -------------------------------------------------------------------------------------------------

export function givenFieldsToLargeNano(fields, unitIndex, fieldNames) {
  let largeNano = new LargeInt(0, 0)

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    largeNano = largeNano.addLargeInt(
      numberToLargeInt(fields[fieldNames[unitIndex]]).mult(divisor),
    )
  }

  return largeNano
}

export function givenFieldsToNano(fields, unitIndex, fieldNames) {
  let nano = 0

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    nano += fields[fieldNames[unitIndex]] * divisor
  }

  return nano
}

export function nanoToGivenFields(nano, unitIndex, fieldNames) {
  const fields = {}

  for (; unitIndex >= nanoIndex; unitIndex--) {
    const divisor = nanoInUnit[unitNamesAsc[unitIndex]]
    fields[fieldNames[unitIndex]] = Math.trunc(nano / divisor)
    nano %= divisor
  }

  return fields
}
