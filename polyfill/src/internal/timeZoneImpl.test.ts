import { describe, expect, it } from 'vitest'
import { bigNanoInSec } from './bigNano'
import { maxMilli } from './temporalConstants'
import { queryTimeZone } from './timeZone'
import { getTimeZonePeriodDays } from './timeZoneConfig'
import { secInUtcDay } from './units'

const NativeTemporal = (globalThis as any).Temporal

describe('queryTimeZone', () => {
  it('finds close-together transitions without hiding the in-between offset', () => {
    const timeZone = queryTimeZone('Africa/Tunis')

    // Africa/Tunis changed from +02:00 to +01:00 on 1943-04-17, then back to
    // +02:00 just over eight days later. A broad endpoint-only period can see
    // +02:00 at both ends and incorrectly assume that the +01:00 interval never
    // existed. That is especially dangerous because getOffsetNanosecondsFor()
    // feeds ordinary Temporal wall-clock/DST-gap math, not only public
    // transition queries.
    expect(
      timeZone.getOffsetNanosecondsFor(BigInt(-842_916_600) * bigNanoInSec),
    ).toBe(3_600_000_000_000)

    expect(
      Number(
        timeZone.getTransition(BigInt(-842_920_200) * bigNanoInSec, 1)! /
          bigNanoInSec,
      ),
    ).toBe(-842_918_400)

    expect(
      Number(
        timeZone.getTransition(BigInt(-842_916_600) * bigNanoInSec, -1)! /
          bigNanoInSec,
      ),
    ).toBe(-842_918_400)
  })

  it('samples offsets near TimeClip boundaries without asking Intl for out-of-range dates', () => {
    const timeZone = queryTimeZone('America/Vancouver')
    const maxEpochNano = BigInt(maxMilli) * 1_000_000n

    // Offset lookup samples both ends of a search period. At the Temporal
    // instant limits, one endpoint can sit outside native Intl's Date range
    // even though the requested instant itself is valid.
    expect(() => {
      timeZone.getOffsetNanosecondsFor(-maxEpochNano)
      timeZone.getOffsetNanosecondsFor(maxEpochNano)
      timeZone.getTransition(maxEpochNano, 1)
      timeZone.getTransition(maxEpochNano, -1)
    }).not.toThrow()
  })

  it('samples pre-modern named-zone offsets without asking Intl for BCE fields', () => {
    const timeZone = queryTimeZone('America/Vancouver')

    // This is the local-mean-time offset expected before North American
    // standard-time zones. Some host Intl implementations return unreliable
    // BCE date fields for the actual ancient instant, so the offset sampler
    // clamps far-past dates to a safer pre-modern sample point.
    expect(
      timeZone.getOffsetNanosecondsFor(BigInt(-93_314_917_968) * bigNanoInSec),
    ).toBe(-29_548_000_000_000)
  })

  // Both changes of each pair, and the offset between them. A period that holds both
  // reads the offset before them all the way through, or finds only one of them.
  it.each([
    // zone, first change, second change, offset nanoseconds between them
    ['Africa/Casablanca', 1526176800, 1529200800, 0], // 2018-05-13, 2018-06-17
    ['Africa/Cairo', 1281474000, 1284069600, 2 * 3_600_000_000_000], // 2010-08-10, 2010-09-09
    ['Europe/Chisinau', 638319600, 641944800, 4 * 3_600_000_000_000], // 1990-03-24, 1990-05-05
    ['Pacific/Fiji', 1608386400, 1610805600, 13 * 3_600_000_000_000], // 2020-12-19, 2021-01-16
    [
      'America/Argentina/Catamarca',
      1086058800,
      1087704000,
      -4 * 3_600_000_000_000,
    ], // 2004-06-01, 2004-06-20
    ['Africa/El_Aaiun', 198291600, 199756800, 0], // 1976-04-14, 1976-05-01
    ['Europe/London', -719445600, -717030000, 3_600_000_000_000], // 1947-03-16, 1947-04-13
  ] as const)(
    'finds both close-together transitions in %s',
    (id, first, second, offsetNano) => {
      const timeZone = queryTimeZone(id)
      const between = BigInt(first + secInUtcDay) * bigNanoInSec

      expect(timeZone.getOffsetNanosecondsFor(between)).toBe(offsetNano)
      expect(timeZone.getTransition(between, 1)).toBe(
        BigInt(second) * bigNanoInSec,
      )
      expect(timeZone.getTransition(between, -1)).toBe(
        BigInt(first) * bigNanoInSec,
      )
    },
  )

  // Guards the period table against the host's time zone data, including future releases
  it.skipIf(!NativeTemporal)(
    "has a search period shorter than the gaps between each zone's transitions",
    () => {
      const horizonMilli = Date.now() + 2 * 365 * secInUtcDay * 1000
      const tooClose: string[] = []

      for (const id of (Intl as any).supportedValuesOf('timeZone')) {
        const periodMilli = getTimeZonePeriodDays(id) * secInUtcDay * 1000
        let zoned = NativeTemporal.Instant.from('1847-01-01T00:00Z')
          .toZonedDateTimeISO(id)
          .getTimeZoneTransition('next')
        let prevMilli: number | undefined

        while (zoned && zoned.epochMilliseconds <= horizonMilli) {
          const milli = zoned.epochMilliseconds
          if (prevMilli !== undefined && milli - prevMilli < periodMilli) {
            tooClose.push(`${id} ${zoned.toInstant()}`)
          }
          prevMilli = milli
          zoned = zoned.getTimeZoneTransition('next')
        }
      }

      expect(tooClose).toEqual([])
    },
  )
})
