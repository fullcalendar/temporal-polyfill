import { nanoInUtcDay } from './units'
import { NumberSign, compareNumbers, divModFloor, divModTrunc } from './utils'

/*
Given a raw nanoseconds value,
`days` is truncated (towards 0)
`timeNano` is the remainder (sign agrees with days)
*/
export type BigNano = [days: number, timeNano: number]

/*
does balancing
*/
export function createBigNano(days: number, timeNano: number): BigNano {
  let [extraDays, newTimeNano] = divModTrunc(timeNano, nanoInUtcDay)
  let newDays = days + extraDays
  const newDaysSign = Math.sign(newDays)

  // ensure nonconflicting signs
  if (newDaysSign && newDaysSign === -Math.sign(newTimeNano)) {
    newDays -= newDaysSign
    newTimeNano += newDaysSign * nanoInUtcDay
  }

  return [newDays, newTimeNano]
}

// Math
// -----------------------------------------------------------------------------

export function addBigNanos(
  a: BigNano,
  b: BigNano,
  sign: NumberSign = 1,
): BigNano {
  return createBigNano(a[0] + b[0] * sign, a[1] + b[1] * sign)
}

export function moveBigNano(a: BigNano, b: number): BigNano {
  return createBigNano(a[0], a[1] + b)
}

export function diffBigNanos(a: BigNano, b: BigNano): BigNano {
  return addBigNanos(b, a, -1)
}

// Compare
// -----------------------------------------------------------------------------

export function compareBigNanos(a: BigNano, b: BigNano): NumberSign {
  return compareNumbers(a[0], b[0]) || compareNumbers(a[1], b[1])
}

export function bigNanoOutside(
  subject: BigNano,
  rangeStart: BigNano,
  rangeEndExcl: BigNano,
): boolean {
  return (
    compareBigNanos(subject, rangeStart) === -1 ||
    compareBigNanos(subject, rangeEndExcl) === 1
  )
}

// Conversion
// -----------------------------------------------------------------------------

// other -> BigNano
// (BigNano needs trunc)

export function bigIntToBigNano(num: bigint, multiplierNano = 1): BigNano {
  const wholeInDay = BigInt(nanoInUtcDay / multiplierNano)
  const days = Number(num / wholeInDay) // does trunc
  const remainder = Number(num % wholeInDay) // does trunc
  return [days, remainder * multiplierNano] // scaled. doesn't need balancing
}

export function numberToBigNano(num: number, multiplierNano = 1): BigNano {
  const wholeInDay = nanoInUtcDay / multiplierNano
  const [days, remainder] = divModTrunc(num, wholeInDay)
  return [days, remainder * multiplierNano] // scaled. doesn't need balancing
}

// BigNano -> other
// (other units need floor)
// (divisorNano always a denominator of day-nanoseconds, always positive)

export function bigNanoToBigInt(bigNano: BigNano, divisorNano = 1): bigint {
  const [days, timeNano] = bigNano
  const whole = Math.floor(timeNano / divisorNano)
  const wholeInDay = nanoInUtcDay / divisorNano
  return BigInt(days) * BigInt(wholeInDay) + BigInt(whole)
}

export function bigNanoToNumber(
  bigNano: BigNano,
  divisorNano = 1,
  exact?: boolean,
): number {
  const [days, timeNano] = bigNano
  const [whole, remainderNano] = divModTrunc(timeNano, divisorNano)
  const wholeInDay = nanoInUtcDay / divisorNano
  // adding fraction to whole first results in better precision
  return days * wholeInDay + (whole + (exact ? remainderNano / divisorNano : 0))
}

export function bigNanoToExactDays(bigNano: BigNano): number {
  return bigNano[0] + bigNano[1] / nanoInUtcDay
}

export function divModBigNano(
  bigNano: BigNano,
  divisorNano: number,
  divModFunc = divModFloor,
): [whole: number, remainderNano: number] {
  const [days, timeNano] = bigNano
  const [whole, remainderNano] = divModFunc(timeNano, divisorNano)
  const wholeInDay = nanoInUtcDay / divisorNano
  return [days * wholeInDay + whole, remainderNano]
}
