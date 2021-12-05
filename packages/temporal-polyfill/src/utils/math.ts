import { CompareResult } from '../public/types'

export type RoundingFunc = (n: number) => number

export function compareValues<T extends (number | bigint | string)>(a: T, b: T): CompareResult {
  if (a < b) {
    return -1
  } else if (a > b) {
    return 1
  }
  return 0
}

export function numSign(num: number): CompareResult {
  return compareValues(num, 0)
}

export function roundToIncrement(
  num: number,
  inc: number,
  roundingFunc: RoundingFunc,
): number {
  return roundingFunc(num / inc) * inc
}

// wraps `n` to 0...max (not including max)
export function positiveModulo(n: number, max: number): number {
  return (n % max + max) % max
}
