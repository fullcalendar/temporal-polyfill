import { nanoInUtcDay } from './units'
import { NumberSign, compareNumbers, divModFloor, divModTrunc } from './utils'

export type DayTimeNano = [days: number, timeNano: number]

/*
does balancing
*/
export function createDayTimeNano(days: number, timeNano: number): DayTimeNano {
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

export function addDayTimeNanoAndNumber(
  a: DayTimeNano,
  b: number,
): DayTimeNano {
  return createDayTimeNano(a[0], a[1] + b)
}

// TODO: converge with diffDayTimeNanos
export function addDayTimeNanos(
  a: DayTimeNano,
  b: DayTimeNano,
  sign: NumberSign = 1,
): DayTimeNano {
  return createDayTimeNano(a[0] + b[0] * sign, a[1] + b[1] * sign)
}

export function diffDayTimeNanos(a: DayTimeNano, b: DayTimeNano): DayTimeNano {
  return createDayTimeNano(b[0] - a[0], b[1] - a[1])
}

// Compare
// -----------------------------------------------------------------------------

export function compareDayTimeNanos(
  a: DayTimeNano,
  b: DayTimeNano,
): NumberSign {
  return compareNumbers(a[0], b[0]) || compareNumbers(a[1], b[1])
}

// Conversion
// -----------------------------------------------------------------------------

// other -> DayTimeNano
// (DayTimeNano needs trunc)

export function bigIntToDayTimeNano(
  num: bigint,
  multiplierNano = 1,
): DayTimeNano {
  const wholeInDay = BigInt(nanoInUtcDay / multiplierNano)
  const days = Number(num / wholeInDay) // does trunc
  const remainder = Number(num % wholeInDay) // does trunc

  return [days, remainder * multiplierNano] // scaled. doesn't need balancing
}

export function numberToDayTimeNano(
  num: number,
  multiplierNano = 1,
): DayTimeNano {
  const wholeInDay = nanoInUtcDay / multiplierNano
  const [days, remainder] = divModTrunc(num, wholeInDay)

  return [days, remainder * multiplierNano] // scaled. doesn't need balancing
}

// DayTimeNano -> other
// (other units need floor)
// (divisorNano always a denominator of day-nanoseconds, always positive)

export function dayTimeNanoToBigInt(
  dayTimeNano: DayTimeNano,
  divisorNano = 1,
): bigint {
  const [days, timeNano] = dayTimeNano
  const timeUnits = Math.floor(timeNano / divisorNano)
  const timeUnitsInDay = nanoInUtcDay / divisorNano

  return BigInt(days) * BigInt(timeUnitsInDay) + BigInt(timeUnits)
}

export function dayTimeNanoToNumber(
  dayTimeNano: DayTimeNano,
  divisorNano = 1,
  exact?: boolean,
): number {
  const [whole, remainder] = dayTimeNanoToNumberRemainder(
    dayTimeNano,
    divisorNano,
  )

  return whole + (exact ? remainder / divisorNano : 0)
}

export function dayTimeNanoToNumberRemainder(
  dayTimeNano: DayTimeNano,
  divisorNano: number,
): [whole: number, remainder: number] {
  const [days, timeNano] = dayTimeNano
  const [whole, remainderNano] = divModFloor(timeNano, divisorNano)
  const wholeInDay = nanoInUtcDay / divisorNano

  return [days * wholeInDay + whole, remainderNano]
}
