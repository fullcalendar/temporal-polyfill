import {
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  nanoInUtcDay,
} from './units'

/*
Given a raw nanoseconds value.

This used to be a `[days, timeNano]` tuple to keep large epoch values inside
Number's safe integer range. Using bigint makes the representation simpler and
keeps the exact nanosecond total available until a caller explicitly asks for a
Number conversion.
*/
export const bigNanoInMicro = BigInt(nanoInMicro)
export const bigNanoInMilli = BigInt(nanoInMilli)
export const bigNanoInSec = BigInt(nanoInSec)
export const bigNanoInMinute = BigInt(nanoInMinute)
export const bigNanoInHour = BigInt(nanoInHour)
export const bigNanoInUtcDay = BigInt(nanoInUtcDay)

export function divideBigNanoToExactNumber(
  bigNano: bigint,
  divisorNano: number,
): number {
  return divideBigIntsToNumber(bigNano, BigInt(divisorNano))
}

/*
Divides exactly and rounds once, to the nearest Number, like the spec's
𝔽(numerator / denominator). Splitting the quotient into a whole part plus a
fraction rounds twice, which can land one ULP off (2522ns is 2.522µs, but
2 + 0.522 is 2.5220000000000002).

The numerator is scaled up by 2^128 so the integer quotient has more bits than
a Number keeps. When the division leaves a remainder, an extra low 1 bit marks
the quotient as slightly too small, so Number() still rounds it the right way.
Then dividing by a power of two is exact.
*/
export function divideBigIntsToNumber(
  numerator: bigint,
  denominator: bigint,
): number {
  const isNegative = numerator < 0n !== denominator < 0n
  const scaledNumerator = bigIntAbs(numerator) << 128n
  const absDenominator = bigIntAbs(denominator)
  const quotient = scaledNumerator / absDenominator
  const stickyBit = scaledNumerator % absDenominator ? 1n : 0n
  const value = Number((quotient << 1n) | stickyBit) / 2 ** 129

  // Avoid -0 when the numerator is zero
  return isNegative && value ? -value : value
}

function bigIntAbs(n: bigint): bigint {
  return n < 0n ? -n : n
}
