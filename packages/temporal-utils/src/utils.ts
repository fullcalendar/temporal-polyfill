import type { Temporal } from 'temporal-spec'
import * as errorMessages from './errorMessages.js'

export const nanosecondsInMicrosecond = 1000
export const nanosecondsInMillisecond = 1000000
export const nanosecondsInSecond = 1000000000
export const nanosecondsInMinute = 60000000000
export const nanosecondsInHour = 3600000000000

// just used to scrape types from temporal-spec
type RoundingUnit = Temporal.DateUnit | Temporal.TimeUnit
type RoundingOptionBag = Temporal.RoundingOptions<RoundingUnit>

export type RoundingMode = RoundingOptionBag['roundingMode']
export type RoundingMathOptions = Pick<
  RoundingOptionBag,
  'roundingIncrement' | 'roundingMode'
>

export function getOptionsObject<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    return Object.create(null)
  }
  return requireObjectLike(options)
}

export function toFiniteNumber(arg: number, entityName = 'number'): number {
  if (typeof arg === 'bigint') {
    throw new TypeError(errorMessages.forbiddenBigIntToNumber(entityName))
  }

  arg = Number(arg)

  if (!Number.isFinite(arg)) {
    throw new RangeError(errorMessages.expectedFinite(entityName, arg))
  }

  return arg
}

export function toIntegerWithTruncation(
  arg: number,
  entityName?: string,
): number {
  return Math.trunc(toFiniteNumber(arg, entityName)) || 0 // ensure no -0
}

export function toPositiveIntegerWithTruncation(
  arg: number,
  entityName?: string,
): number {
  return requireNumberIsPositive(
    toIntegerWithTruncation(arg, entityName),
    entityName,
  )
}

/*
Already known to be number.
*/
export function requireNumberIsPositive(
  num: number,
  entityName = 'number',
): number {
  if (num <= 0) {
    throw new RangeError(errorMessages.expectedPositive(entityName, num))
  }
  return num
}

/*
min/max are inclusive
*/
export function constrainToRange(
  num: number,
  min: number,
  max: number,
): number {
  return Math.min(Math.max(num, min), max)
}

export function isObjectLike(arg: unknown): arg is {} {
  return arg !== null && (typeof arg === 'object' || typeof arg === 'function')
}

export function requireObjectLike<O extends {}>(arg: O): O {
  if (!isObjectLike(arg)) {
    throw new TypeError(errorMessages.invalidObject)
  }
  return arg
}

// Options-bag-parsing-adjacent
// ----------------------------

/*
Already known to be number
*/
export function normalizeNumberInRange(
  num: number,
  min: number,
  max: number, // inclusive
  options?: Temporal.OverflowOptions,
): number {
  const clamped = constrainToRange(num, min, max)

  if (normalizeOverflow(options) === 'reject' && num !== clamped) {
    throw new RangeError(
      errorMessages.numberOutOfRange('number', num, min, max),
    )
  }

  return clamped
}

/*
Match Temporal's field overflow shape without depending on the polyfill's
internal option readers. Undefined defaults to constrain; explicit reject asks
for exact in-range input.
*/
function normalizeOverflow(
  options: Temporal.OverflowOptions | undefined,
): NonNullable<Temporal.OverflowOptions['overflow']> {
  options = getOptionsObject(options)

  const overflow = options.overflow
  if (overflow === undefined) {
    return 'constrain'
  }
  if (overflow === 'constrain' || overflow === 'reject') {
    return overflow
  }
  throw new RangeError(errorMessages.invalidOverflowOption)
}
