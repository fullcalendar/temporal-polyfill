import type { Temporal } from 'temporal-spec'

export const nanoInMicro = 1000
export const nanoInMilli = 1000000
export const nanoInSec = 1000000000
export const nanoInMinute = 60000000000
export const nanoInHour = 3600000000000

type RoundingUnit = Temporal.DateUnit | Temporal.TimeUnit
type RoundingOptionBag = Temporal.RoundingOptions<RoundingUnit>

export type RoundingMathOptions = Pick<
  RoundingOptionBag,
  'roundingIncrement' | 'roundingMode'
>

export function normalizeOptions<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    return Object.create(null)
  }
  return requireObjectLike(options)
}

// Input Validation
// -----------------------------------------------------------------------------

export function toNumber(arg: number, entityName = 'number'): number {
  if (typeof arg === 'bigint') {
    throw new TypeError(`Cannot convert bigint to ${entityName}`)
  }

  arg = Number(arg)

  if (!Number.isFinite(arg)) {
    throw new RangeError(`Expected finite ${entityName}`)
  }

  return arg
}

export function toInteger(arg: number, entityName?: string): number {
  return Math.trunc(toNumber(arg, entityName)) || 0 // ensure no -0
}

export function toPositiveInteger(arg: number, entityName?: string): number {
  return requireNumberIsPositive(toInteger(arg, entityName), entityName)
}

/*
Already known to be number
*/
function requireNumberIsPositive(num: number, entityName = 'number'): number {
  if (num <= 0) {
    throw new RangeError(`Expected positive ${entityName}`)
  }
  return num
}

/*
min/max are inclusive
*/
export function clampNumber(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

/*
Already known to be number
*/
export function normalizeNumberInRange(
  num: number,
  min: number,
  max: number, // inclusive
  options?: Temporal.OverflowOptions,
): number {
  const clamped = clampNumber(num, min, max)

  if (normalizeOverflow(options) === 'reject' && num !== clamped) {
    throw new RangeError(`Number must be between ${min}-${max}`)
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
  options = normalizeOptions(options)

  const overflow = options.overflow
  if (overflow === undefined) {
    return 'constrain'
  }
  if (overflow === 'constrain' || overflow === 'reject') {
    return overflow
  }
  throw new RangeError('Invalid overflow option')
}

export function isObjectLike(arg: unknown): arg is {} {
  return arg !== null && (typeof arg === 'object' || typeof arg === 'function')
}

export function requireObjectLike<O extends {}>(arg: O): O {
  if (!isObjectLike(arg)) {
    throw new TypeError('Options must be an object')
  }
  return arg
}
