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

/*
Round n/d to the nearest Number. A unit length or span between Temporal epochs
has |d| < 2^74, so a nonzero ratio has magnitude above 2^-74. At that scale
binary64 midpoints are multiples of 2^-127. A non-tie misses a midpoint by
at least 2^-127 / |d| > 2^-201. Keeping 256 fractional bits preserves exact
ties and the side each non-tie falls on. Number rounds to nearest-even and rescaling is exact.
*/
export function divideNanoToNumber(
  numerator: bigint,
  denominator: bigint,
): number {
  return Number((numerator << 256n) / denominator) / 2 ** 256
}
