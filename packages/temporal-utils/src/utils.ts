import type { Temporal } from 'temporal-spec'

// TODO: simplify this!
export type DateTimeObj = Temporal.PlainDateTime | Temporal.ZonedDateTime
export type TimeObj = Temporal.PlainTime | DateTimeObj
export type DateObj = Temporal.PlainDate | DateTimeObj
export type YearMonthObj = Temporal.PlainYearMonth | DateObj

type Overflow = 'constrain' | 'reject'

export interface OverflowOptions {
  overflow?: Overflow
}

// Input Validation
// -----------------------------------------------------------------------------
// TODO: make DRY with temporal-polyfill somehow!?

function toNumber(arg: number): number {
  if (typeof arg === 'bigint') {
    throw new TypeError('Cannot convert bigint to number')
  }

  arg = Number(arg)

  if (!Number.isFinite(arg)) {
    throw new RangeError('Cannot convert infinity to number')
  }

  return arg
}

export function toInteger(arg: number): number {
  return Math.trunc(toNumber(arg)) || 0 // ensure no -0
}

export function toPositiveInteger(arg: number): number {
  return requireNumberIsPositive(toInteger(arg))
}

/*
Already known to be number
*/
function requireNumberIsPositive(num: number): number {
  if (num <= 0) {
    throw new RangeError('Expected positive number')
  }
  return num
}

/*
Already known to be number
*/
export function normalizeNumberInRange(
  num: number,
  min: number,
  max: number, // inclusive
  options?: OverflowOptions,
): number {
  const clamped = Math.min(Math.max(num, min), max)

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
function normalizeOverflow(options: OverflowOptions | undefined): Overflow {
  if (options === undefined) {
    return 'constrain'
  }

  if (
    options === null ||
    (typeof options !== 'object' && typeof options !== 'function')
  ) {
    throw new TypeError('Options must be an object')
  }

  const overflow = options.overflow
  if (overflow === undefined) {
    return 'constrain'
  }
  if (overflow === 'constrain' || overflow === 'reject') {
    return overflow
  }
  throw new RangeError('Invalid overflow option')
}
