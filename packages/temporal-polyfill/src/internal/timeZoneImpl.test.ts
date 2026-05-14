import { describe, expect, it } from 'vitest'
import { bigNanoInSec } from './bigNano'
import { maxMilli } from './temporalConstants'
import { queryTimeZone } from './timeZoneImpl'

describe('queryTimeZone', () => {
  it('finds close-together transitions without hiding the in-between offset', () => {
    const timeZoneImpl = queryTimeZone('Africa/Tunis')

    // Africa/Tunis changed from +02:00 to +01:00 on 1943-04-17, then back to
    // +02:00 just over eight days later. A broad endpoint-only period can see
    // +02:00 at both ends and incorrectly assume that the +01:00 interval never
    // existed. That is especially dangerous because getOffsetNanosecondsFor()
    // feeds ordinary Temporal wall-clock/DST-gap math, not only public
    // transition queries.
    expect(
      timeZoneImpl.getOffsetNanosecondsFor(BigInt(-842_916_600) * bigNanoInSec),
    ).toBe(3_600_000_000_000)

    expect(
      Number(
        timeZoneImpl.getTransition(BigInt(-842_920_200) * bigNanoInSec, 1)! /
          bigNanoInSec,
      ),
    ).toBe(-842_918_400)

    expect(
      Number(
        timeZoneImpl.getTransition(BigInt(-842_916_600) * bigNanoInSec, -1)! /
          bigNanoInSec,
      ),
    ).toBe(-842_918_400)
  })

  it('samples offsets near TimeClip boundaries without asking Intl for out-of-range dates', () => {
    const timeZoneImpl = queryTimeZone('America/Vancouver')
    const maxEpochNano = BigInt(maxMilli) * 1_000_000n

    // Offset lookup samples both ends of a search period. At the Temporal
    // instant limits, one endpoint can sit outside native Intl's Date range
    // even though the requested instant itself is valid.
    expect(() => {
      timeZoneImpl.getOffsetNanosecondsFor(-maxEpochNano)
      timeZoneImpl.getOffsetNanosecondsFor(maxEpochNano)
      timeZoneImpl.getTransition(maxEpochNano, 1)
      timeZoneImpl.getTransition(maxEpochNano, -1)
    }).not.toThrow()
  })
})
