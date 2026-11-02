import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as DurationFns from '../../funcApi/duration'
import * as PlainDateFns from '../../funcApi/plainDate'
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

describe('Duration#toString rounding to zero', () => {
  it('drops the sign when every field rounds away', () => {
    const duration = Temporal.Duration.from({ milliseconds: -1 })

    expect(duration.toString({ smallestUnit: 'second' })).toBe('PT0S')
    expect(duration.toString({ fractionalSecondDigits: 0 })).toBe('PT0S')
    expect(
      Temporal.Duration.from({ nanoseconds: -1 }).toString({
        smallestUnit: 'millisecond',
      }),
    ).toBe('PT0.000S')
  })

  it('keeps the sign when something remains', () => {
    expect(
      Temporal.Duration.from({ milliseconds: -1 }).toString({
        smallestUnit: 'second',
        roundingMode: 'expand',
      }),
    ).toBe('-PT1S')
    expect(
      Temporal.Duration.from({ weeks: -1, milliseconds: -1 }).toString({
        smallestUnit: 'second',
      }),
    ).toBe('-P1WT0S')
  })

  it('function API', () => {
    expect(
      DurationFns.toString(DurationFns.fromFields({ milliseconds: -1 }), {
        smallestUnit: 'second',
      }),
    ).toBe('PT0S')
  })
})

describe('Duration#toString rounding huge sub-second fields', () => {
  it('keeps the rounded digits above 2^53', () => {
    // A Number near 2^60 holds only multiples of 256, so leaving this in the
    // nanoseconds field would snap the rounded value back to the input
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 2 ** 60)

    expect(
      duration.toString({
        smallestUnit: 'microsecond',
        roundingMode: 'ceil',
      }),
    ).toBe('PT1152921504.606847S')
    expect(
      duration.negated().toString({
        smallestUnit: 'microsecond',
        roundingMode: 'floor',
      }),
    ).toBe('-PT1152921504.606847S')
  })

  it('applies to milliseconds and microseconds fields', () => {
    expect(
      new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 2 ** 60).toString({
        smallestUnit: 'second',
        roundingMode: 'ceil',
      }),
    ).toBe('PT1152921504606847S')
    expect(
      new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 2 ** 60).toString({
        smallestUnit: 'millisecond',
        roundingMode: 'ceil',
      }),
    ).toBe('PT1152921504606.847S')
  })
})

describe('relative rounding to zero', () => {
  // toBe compares with Object.is, so these fail on -0
  it('PlainDate#until gives positive zero', () => {
    const date = Temporal.PlainDate.from('2020-06-01')

    for (const unit of ['year', 'month', 'week'] as const) {
      const duration = date.until('2020-05-31', {
        largestUnit: unit,
        smallestUnit: unit,
        roundingMode: 'trunc',
      })
      expect(duration[`${unit}s`]).toBe(0)
    }
  })

  it('Duration#round gives positive zero', () => {
    const duration = Temporal.Duration.from({ days: -1 }).round({
      largestUnit: 'year',
      smallestUnit: 'year',
      roundingMode: 'ceil',
      relativeTo: '2020-06-01',
    })
    expect(duration.years).toBe(0)
  })

  it('ZonedDateTime#until gives positive zero', () => {
    const zoned = Temporal.ZonedDateTime.from(`2020-06-01T12:00[${newYork}]`)
    const duration = zoned.until(zoned.subtract({ hours: 1 }), {
      largestUnit: 'day',
      smallestUnit: 'day',
      roundingMode: 'trunc',
    })
    expect(duration.days).toBe(0)
  })

  it('function API', () => {
    const date = PlainDateFns.fromString('2020-06-01', CalendarFns.getBasic)
    const earlier = PlainDateFns.fromString('2020-05-31', CalendarFns.getBasic)

    expect(PlainDateFns.diffYears(date, earlier, 'trunc')).toBe(0)
  })
})
