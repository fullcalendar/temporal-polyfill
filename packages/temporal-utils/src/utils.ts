import type { Temporal } from 'temporal-spec'

export type DateTimeObj = Temporal.PlainDateTime | Temporal.ZonedDateTime
export type DateObj = Temporal.PlainDate | DateTimeObj
export type YearMonthObj = Temporal.PlainYearMonth | DateObj

// Options
// -----------------------------------------------------------------------------

export type RoundingOptions = {
  roundingMode?: Temporal.RoundingMode
}

export function normalizeRoundingOptions<T extends RoundingOptions>(
  options: Temporal.RoundingMode | T | undefined,
): T | undefined {
  return typeof options === 'string'
    ? ({ roundingMode: options } as T)
    : options
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
export function requireNumberInRange(
  num: number,
  min: number,
  max: number, // inclusive
): number {
  if (num < min || num > max) {
    throw new RangeError(`Number must be between ${min}-${max}`)
  }
  return num
}
