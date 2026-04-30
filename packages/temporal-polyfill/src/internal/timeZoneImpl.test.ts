import { describe, expect, it } from 'vitest'
import { bigNanoToNumber, numberToBigNano } from './bigNano'
import { queryTimeZone } from './timeZoneImpl'
import { nanoInSec } from './units'

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
      timeZoneImpl.getOffsetNanosecondsFor(
        numberToBigNano(-842_916_600, nanoInSec),
      ),
    ).toBe(3_600_000_000_000)

    expect(
      bigNanoToNumber(
        timeZoneImpl.getTransition(
          numberToBigNano(-842_920_200, nanoInSec),
          1,
        )!,
        nanoInSec,
      ),
    ).toBe(-842_918_400)

    expect(
      bigNanoToNumber(
        timeZoneImpl.getTransition(
          numberToBigNano(-842_916_600, nanoInSec),
          -1,
        )!,
        nanoInSec,
      ),
    ).toBe(-842_918_400)
  })
})
