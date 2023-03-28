import { strArrayToHash } from '../utils/obj'
import { durationUnitNames } from './unitStr'

const eraFieldMap = {
  era: String,
  eraYear: toIntNoInfinity,
}

export const yearMonthFieldMap = {
  year: toIntNoInfinity,
  month: toPositiveInt,
  monthCode: toString,
}

export const allYearMonthFieldMap = {
  ...eraFieldMap,
  ...yearMonthFieldMap,
}

export const monthDayFieldMap = { // YUCK, a lot of redefining
  year: toIntNoInfinity,
  month: toPositiveInt,
  monthCode: toString,
  day: toPositiveInt,
}

export const allMonthDayFieldMap = {
  ...eraFieldMap,
  ...monthDayFieldMap,
}

export const dateFieldMap = {
  ...yearMonthFieldMap,
  day: toPositiveInt,
}

export const allDateFieldMap = {
  ...eraFieldMap,
  ...dateFieldMap,
}

export const timeFieldMap = {
  hour: toIntNoFrac,
  minute: toIntNoFrac,
  second: toIntNoFrac,
  millisecond: toIntNoFrac,
  microsecond: toIntNoFrac,
  nanosecond: toIntNoFrac,
}

export const dateTimeFieldMap = {
  ...dateFieldMap,
  ...timeFieldMap,
}

// TODO: more DRY with constrainInt
// ...

function toPositiveInt(valueParam: unknown, property?: string): number {
  const value = toInt(valueParam)
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (value < 1) {
    if (property !== undefined) {
      throw new RangeError(`property '${property}' cannot be a a number less than one`)
    }
    throw new RangeError('Cannot convert a number less than one to a positive integer')
  }
  return value
}

/*
throws on infinity
throws on fractional values
*/
function toIntNoFrac(valueParam: unknown): number {
  const value = toNumber(valueParam)
  if (isNaN(value)) return 0
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`unsupported fractional value ${value}`)
  }
  return toInt(value)
}

/*
throws on infinity
truncates on fractional values
*/
export function toIntNoInfinity(value: unknown, throwOnNaN?: boolean): number {
  const integer = toInt(value, throwOnNaN)
  if (!Number.isFinite(integer)) {
    throw new RangeError('infinity is out of range')
  }
  return integer
}

/*
allows infinity
truncates on fractional values
*/
export function toInt(value: unknown, throwOnNaN?: boolean): number {
  const num = toNumber(value)
  if (isNaN(num)) {
    if (throwOnNaN) {
      throw new RangeError('Invalid number')
    }
    return 0
  }
  const integer = Math.trunc(num)
  if (num === 0) return 0 // prevents -0. TODO: remove other places that do this
  return integer
}

function toNumber(value: unknown): number {
  if (typeof value === 'bigint') throw new TypeError('Cannot convert BigInt to number')
  return Number(value)
}

export function toString(value: unknown): string {
  if (typeof value === 'symbol') {
    throw new TypeError('Cannot convert a Symbol value to a String')
  }
  return String(value)
}

export const durationFieldMap = strArrayToHash(durationUnitNames, () => Number)
