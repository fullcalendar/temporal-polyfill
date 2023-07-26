import { Temporal } from 'temporal-spec'
import { nanoInMinute } from '../dateUtils/units'
import { LargeInt } from './largeInt'

export type RoundingFunc = (n: number) => number

export function compareValues(a: number, b: number): Temporal.ComparisonResult {
  if (a < b) {
    return -1
  } else if (a > b) {
    return 1
  }
  return 0
}

export function numSign(num: number): Temporal.ComparisonResult {
  return compareValues(num, 0)
}

export function roundToIncrement(
  num: number,
  inc: number,
  roundingFunc: RoundingFunc,
): number {
  return roundingFunc(num / inc) * inc
}

export function roundToMinute(nano: number): number {
  return roundToIncrement(nano, nanoInMinute, halfExpand)
}

// like round, but does rounds negatives "down" (closer to -0.9)
// use elsewhere?
function halfExpand(n: number) {
  return Math.round(Math.abs(n)) * numSign(n)
}

export function roundToIncrementBI(
  num: LargeInt,
  inc: number,
  roundingFunc: RoundingFunc,
): LargeInt {
  const wholeUnits = num.div(inc)
  const wholeNum = wholeUnits.mult(inc)
  const leftover = num.sub(wholeNum).toNumber()
  return wholeNum.add(roundingFunc(leftover / inc) * inc)
}

// wraps `n` to 0...max (not including max)
export function positiveModulo(n: number, max: number): number {
  return (n % max + max) % max
}
