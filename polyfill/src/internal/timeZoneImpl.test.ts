import { describe, expect, it } from 'vitest'
import { bigNanoInSec } from './bigNano'
import { maxMilli } from './temporalConstants'
import { queryTimeZone } from './timeZone'
import {
  getTimeZonePeriodDays,
  maxOneOffTransitionSec,
  minPossibleTransitionSec,
} from './timeZoneConfig'
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

  it('finds the transitions of 1844, the earliest in the time zone database', () => {
    // Asia/Manila and Pacific/Guam (with Saipan, Palau and Kosrae) moved across
    // the date line on 1844-12-31. Transition searches used to start at
    // 1847-01-01 and never saw these.
    const manila = queryTimeZone('Asia/Manila')
    const from1800 = BigInt(-5_364_662_400) * bigNanoInSec
    const from1846 = BigInt(-3_913_056_000) * bigNanoInSec
    const transitionSec = Number(
      manila.getTransition(from1800, 1)! / bigNanoInSec,
    )

    // 1844-12-31T15:56:00Z, or 15:56:08Z with time zone data that gives Manila's
    // local mean time to the second (-15:56:08)
    expect(transitionSec).toBeGreaterThanOrEqual(-3_944_621_040)
    expect(transitionSec).toBeLessThanOrEqual(-3_944_621_032)
    expect(Number(manila.getTransition(from1846, -1)! / bigNanoInSec)).toBe(
      transitionSec,
    )
    expect(
      Number(
        queryTimeZone('Pacific/Guam').getTransition(from1800, 1)! /
          bigNanoInSec,
      ),
    ).toBe(-3_944_626_740)
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

  it('finds a forward transition exactly at the start of a search period', () => {
    const timeZone = queryTimeZone('Africa/Algiers')
    const transitionSec = -950_486_400 // 1939-11-19T00:00Z

    expect(
      Math.abs(
        transitionSec % (getTimeZonePeriodDays('Africa/Algiers') * secInUtcDay),
      ),
    ).toBe(0)
    expect(
      timeZone.getTransition(BigInt(transitionSec) * bigNanoInSec - 1n, 1),
    ).toBe(BigInt(transitionSec) * bigNanoInSec)
  })

  // A backward search from far in the future. The answers don't depend on today's date.
  it.each([
    // zone, starting epoch second, previous transition's epoch second
    ['America/New_York', 4118083200, 4108690800], // from 2100-07-01, to 2100-03-14
    ['America/New_York', 32516726400, 32509494000], // from 3000-06-01, to 3000-03-09
    ['Africa/Casablanca', 4118083200, 3703456800], // from 2100-07-01, to 2087-05-11
    ['Asia/Tokyo', 4118083200, -577962000], // from 2100-07-01, to 1951-09-08
  ] as const)(
    'finds the previous transition from far in the future in %s',
    (id, fromSec, expectedSec) => {
      expect(
        queryTimeZone(id).getTransition(BigInt(fromSec) * bigNanoInSec, -1),
      ).toBe(BigInt(expectedSec) * bigNanoInSec)
    },
  )

  // Guards the ceiling against the host's time zone data, including future releases
  it.skipIf(!NativeTemporal)(
    "has a one-off ceiling after each zone's last non-recurring transition",
    () => {
      const tooLate: string[] = []

      for (const id of (Intl as any).supportedValuesOf('timeZone')) {
        const last = NativeTemporal.Instant.from('2400-01-01T00:00Z')
          .toZonedDateTimeISO(id)
          .getTimeZoneTransition('previous')

        // After the ceiling, a zone's transitions must carry on right up to 2400
        if (
          last &&
          last.year < 2397 &&
          last.epochMilliseconds >= maxOneOffTransitionSec * 1000
        ) {
          tooLate.push(`${id} ${last.toInstant()}`)
        }
      }

      expect(tooLate).toEqual([])
    },
  )

  // Guards the search floor against the host's time zone data, including future releases
  it.skipIf(!NativeTemporal)(
    "has a search floor before each zone's first transition",
    () => {
      const tooEarly: string[] = []

      for (const id of (Intl as any).supportedValuesOf('timeZone')) {
        const first = NativeTemporal.Instant.from('1800-01-01T00:00Z')
          .toZonedDateTimeISO(id)
          .getTimeZoneTransition('next')

        if (
          first &&
          first.epochMilliseconds <= minPossibleTransitionSec * 1000
        ) {
          tooEarly.push(`${id} ${first.toInstant()}`)
        }
      }

      expect(tooEarly).toEqual([])
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
        let zoned = NativeTemporal.Instant.from('1800-01-01T00:00Z')
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
