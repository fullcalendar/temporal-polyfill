import { describe, expect, it } from 'vitest'
import * as ZonedDateTimeFns from '../../funcApi/zonedDateTime'
import { Temporal } from './implementation'

// Regressions found while auditing the polyfill's rounding, sign and BigInt
// math. test262 doesn't reach these inputs. Expected values match the reference
// implementation in proposal-temporal/polyfill.

const newYork = 'America/New_York'

describe('ZonedDateTime diffs ending in a repeated hour', () => {
  // The second 01:30 of the fall-back day. Moving the start's wall-clock time onto
  // that date resolves to the FIRST 01:30, an hour past the end when going
  // backward, so a day correction is needed even though the wall-clock times match.
  const end = Temporal.ZonedDateTime.from(`2024-11-03T01:30-05:00[${newYork}]`)
  const start = Temporal.ZonedDateTime.from(`2024-12-01T01:30[${newYork}]`)

  it('until backs up a day instead of mixing signs', () => {
    expect(start.until(end, { largestUnit: 'day' }).toString()).toBe(
      '-P27DT24H',
    )
  })

  it('since backs up a day instead of mixing signs', () => {
    expect(start.since(end, { largestUnit: 'day' }).toString()).toBe('P27DT24H')
  })

  it('Duration#total with a zoned relativeTo', () => {
    const hours = start.until(end, { largestUnit: 'hour' }).hours
    expect(
      Temporal.Duration.from({ hours }).total({
        unit: 'day',
        relativeTo: start,
      }),
    ).toBe(-27.96)
  })

  it('function API', () => {
    const toRecord = (zoned: Temporal.ZonedDateTime) =>
      ZonedDateTimeFns.create(zoned.epochNanoseconds, newYork)

    expect(ZonedDateTimeFns.diffDays(toRecord(start), toRecord(end))).toBe(
      -27.96,
    )
  })
})

describe('ZonedDateTime time rounding near a repeated hour', () => {
  // Both edges of the final day resolve from the wall clock, to the earlier
  // occurrence of a repeated hour, even when the origin is the later occurrence.
  const untilMinute = (start: string, end: string) =>
    Temporal.ZonedDateTime.from(start)
      .until(end, { largestUnit: 'day', smallestUnit: 'minute' })
      .toString()

  it('does not treat a second-occurrence origin as the start of the day', () => {
    expect(
      untilMinute(
        `2024-11-03T01:30-05:00[${newYork}]`,
        `2024-11-04T00:36[${newYork}]`,
      ),
    ).toBe('PT24H6M')
  })

  it('does not retry the day when the endpoint is past the day', () => {
    expect(
      untilMinute(
        `2024-11-02T01:30[${newYork}]`,
        `2024-11-03T01:12-05:00[${newYork}]`,
      ),
    ).toBe('P1DT42M')
  })

  it('throws when a skipped day leaves no interval to round within', () => {
    expect(() =>
      untilMinute(
        '2011-12-31T12:00[Pacific/Apia]',
        '2011-12-31T11:00[Pacific/Apia]',
      ),
    ).toThrow(RangeError)
  })

  it('rounding to the hour with a multi-hour transition', () => {
    expect(
      Temporal.ZonedDateTime.from('2024-10-26T01:46+02:00[Antarctica/Troll]')
        .until('2024-10-27T01:45+00:00[Antarctica/Troll]', {
          largestUnit: 'day',
          smallestUnit: 'hour',
          roundingMode: 'floor',
        })
        .toString(),
    ).toBe('P1DT1H')
  })
})
