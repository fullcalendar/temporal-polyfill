import { describe, expect, it } from 'vitest'
import * as InstantFns from '../../funcApi/instant'
import { Temporal } from './implementation'

/*
Instant#round, Instant#toString and ZonedDateTime#toString round epoch
nanoseconds "as if positive": the spec's RoundNumberToIncrementAsIfPositive
floors, so trunc moves toward the past even before 1970, and ceil moves toward
the future.

The regression (#110, #117) only appeared when the floored quotient was ODD,
because the parity handed to the rounding mode kept the sign of the negative
quotient. test262's negative-instant tests all happen to use even quotients, so
each case below deliberately covers both parities.
*/

const roundingModes = [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
] as const

type RoundingMode = (typeof roundingModes)[number]

// An independent BigInt model of RoundNumberToIncrementAsIfPositive. It does not
// share code with the implementation, which is what makes the sweep meaningful.
function roundAsIfPositive(
  epochNano: bigint,
  inc: bigint,
  mode: RoundingMode,
): bigint {
  const remainder = ((epochNano % inc) + inc) % inc
  const floored = epochNano - remainder

  if (!remainder) {
    return floored
  }

  const halfCompare = remainder * 2n - inc
  let roundUp: boolean

  switch (mode) {
    case 'ceil':
    case 'expand':
      roundUp = true
      break
    case 'floor':
    case 'trunc':
      roundUp = false
      break
    case 'halfCeil':
    case 'halfExpand':
      roundUp = halfCompare >= 0n
      break
    case 'halfFloor':
    case 'halfTrunc':
      roundUp = halfCompare > 0n
      break
    case 'halfEven':
      // On a tie, go to whichever neighbor is an even multiple of the increment
      roundUp =
        halfCompare > 0n || (!halfCompare && (floored / inc) % 2n !== 0n)
      break
  }

  return roundUp ? floored + inc : floored
}

// Epoch values just above an increment multiple, at each interesting distance:
// barely above, just below the midpoint, on it, just above it, and barely below
// the next multiple. Multiples are consecutive, covering odd and even quotients.
function sampleEpochNanos(inc: bigint): bigint[] {
  const samples: bigint[] = []

  for (const base of [-4n, -3n, -2n, -1n, 0n, 1n, 2n]) {
    for (const offset of [
      1n,
      inc / 2n - 1n,
      inc / 2n,
      inc / 2n + 1n,
      inc - 1n,
    ]) {
      samples.push(base * inc + offset)
    }
  }

  return samples
}

const nanoInUnit = {
  microsecond: 1_000n,
  millisecond: 1_000_000n,
  second: 1_000_000_000n,
  minute: 60_000_000_000n,
  hour: 3_600_000_000_000n,
} as const

describe('rounding before the epoch', () => {
  describe('reported cases', () => {
    it('Instant#round', () => {
      expect(
        Temporal.Instant.from('1969-12-31T23:30Z').round('hour').toString(),
      ).toBe('1970-01-01T00:00:00Z')
      expect(
        Temporal.Instant.fromEpochMilliseconds(-1)
          .round({ smallestUnit: 'second', roundingMode: 'trunc' })
          .toString(),
      ).toBe('1969-12-31T23:59:59Z')
    })

    it('Instant#toString', () => {
      const instant = Temporal.Instant.fromEpochMilliseconds(-1)
      expect(instant.toString({ smallestUnit: 'second' })).toBe(
        '1969-12-31T23:59:59Z',
      )
      expect(instant.toString({ fractionalSecondDigits: 1 })).toBe(
        '1969-12-31T23:59:59.9Z',
      )
      expect(
        Temporal.Instant.fromEpochNanoseconds(-1n).toString({
          smallestUnit: 'second',
        }),
      ).toBe('1969-12-31T23:59:59Z')
    })

    it('ZonedDateTime#toString', () => {
      expect(
        Temporal.Instant.fromEpochMilliseconds(-1)
          .toZonedDateTimeISO('UTC')
          .toString({ smallestUnit: 'second' }),
      ).toBe('1969-12-31T23:59:59+00:00[UTC]')
    })

    it('function API', () => {
      expect(
        InstantFns.roundToHour(InstantFns.fromString('1969-12-31T23:30Z'))
          .epochNanoseconds,
      ).toBe(0n)
    })
  })

  // Parity is what triggered the bug, so pin the neighbors on either side.
  // -1001ms floors to -2s (even) and -2001ms floors to -3s (odd).
  it('truncates toward the past for even and odd quotients', () => {
    const toSecond = (epochMilli: number) =>
      Temporal.Instant.fromEpochMilliseconds(epochMilli).toString({
        smallestUnit: 'second',
      })

    expect(toSecond(-1)).toBe('1969-12-31T23:59:59Z')
    expect(toSecond(-1001)).toBe('1969-12-31T23:59:58Z')
    expect(toSecond(-2001)).toBe('1969-12-31T23:59:57Z')
  })

  // halfEven needs the real parity, not only a non-negative one
  it('resolves halfEven ties to the even multiple', () => {
    const round = (epochMilli: number) =>
      Temporal.Instant.fromEpochMilliseconds(epochMilli).round({
        smallestUnit: 'second',
        roundingMode: 'halfEven',
      }).epochMilliseconds

    expect(round(-500)).toBe(0)
    expect(round(-1500)).toBe(-2000)
    expect(round(-2500)).toBe(-2000)
    expect(round(-3500)).toBe(-4000)
  })

  describe('agrees with the as-if-positive model', () => {
    for (const roundingMode of roundingModes) {
      it(`roundingMode ${roundingMode}`, () => {
        for (const [unit, unitNano] of Object.entries(nanoInUnit)) {
          const smallestUnit = unit as keyof typeof nanoInUnit

          for (const roundingIncrement of [1, 3]) {
            const inc = unitNano * BigInt(roundingIncrement)

            for (const epochNano of sampleEpochNanos(inc)) {
              const expected = roundAsIfPositive(epochNano, inc, roundingMode)
              const instant = new Temporal.Instant(epochNano)
              const label = `${epochNano} to ${roundingIncrement} ${unit}`

              expect(
                instant.round({ smallestUnit, roundingIncrement, roundingMode })
                  .epochNanoseconds,
                label,
              ).toBe(expected)
            }
          }

          // toString has no roundingIncrement, and only takes sub-hour units
          if (smallestUnit !== 'hour') {
            for (const epochNano of sampleEpochNanos(unitNano)) {
              const expected = roundAsIfPositive(
                epochNano,
                unitNano,
                roundingMode,
              )
              const label = `${epochNano} to ${unit}`
              const options = { smallestUnit, roundingMode }

              expect(
                Temporal.Instant.from(
                  new Temporal.Instant(epochNano).toString(options),
                ).epochNanoseconds,
                label,
              ).toBe(expected)
              expect(
                Temporal.Instant.from(
                  new Temporal.ZonedDateTime(epochNano, 'UTC').toString(
                    options,
                  ),
                ).epochNanoseconds,
                label,
              ).toBe(expected)
            }
          }
        }
      })
    }
  })
})
