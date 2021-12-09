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

// HACK
export function numSignBI(num: bigint): CompareResult {
  return !num ? 0 : num < 0n ? -1 : 1
}

export function roundToIncrement(
  num: number,
  inc: number,
  roundingFunc: RoundingFunc,
): number {
  return roundingFunc(num / inc) * inc
}

export function roundToIncrementBI(
  num: bigint,
  inc: number,
  roundingFunc: RoundingFunc,
): bigint {
  const incBI = BigInt(inc)
  const wholeUnits = num / incBI
  const wholeNum = wholeUnits * incBI
  const leftover = Number(num - wholeNum)
  return wholeNum + BigInt(roundingFunc(leftover / inc)) * incBI
}

// wraps `n` to 0...max (not including max)
export function positiveModulo(n: number, max: number): number {
  return (n % max + max) % max
}
