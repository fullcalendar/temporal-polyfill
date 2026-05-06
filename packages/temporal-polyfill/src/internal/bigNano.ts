import { nanoInMicro, nanoInMilli, nanoInSec, nanoInUtcDay } from './units'

/*
Given a raw nanoseconds value.

This used to be a `[days, timeNano]` tuple to keep large epoch values inside
Number's safe integer range. Using bigint makes the representation simpler and
keeps the exact nanosecond total available until a caller explicitly asks for a
Number conversion.
*/
export const bigNanoInUtcDay = BigInt(nanoInUtcDay)
export const bigNanoInSec = BigInt(nanoInSec)
export const bigNanoInMilli = BigInt(nanoInMilli)
export const bigNanoInMicro = BigInt(nanoInMicro)

export function divideBigNanoToExactNumber(
  bigNano: bigint,
  divisorNano: number,
): number {
  const days = Number(bigNano / bigNanoInUtcDay)
  const timeNano = Number(bigNano % bigNanoInUtcDay)
  const whole = Math.trunc(timeNano / divisorNano)
  const remainderNano = timeNano % divisorNano
  const wholeInDay = nanoInUtcDay / divisorNano

  // This is not calendar-day math. `nanoInUtcDay` is a convenient chunk size
  // because it is exactly divisible by all built-in time-unit nanosecond
  // divisors, while the within-day piece stays safely representable as Number.
  // Combining `whole + fraction` before adding the large day contribution avoids
  // prematurely rounding a huge bigint quotient and losing the fractional part's
  // ability to affect the final float64 rounding.
  return days * wholeInDay + (whole + remainderNano / divisorNano)
}
