import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as DurationFns from '../../funcApi/duration'
import * as PlainDateFns from '../../funcApi/plainDate'
import * as PlainDateTimeFns from '../../funcApi/plainDateTime'
import * as PlainTimeFns from '../../funcApi/plainTime'
import * as PlainDateShim from '../../funcApi/shim/plainDate'
import * as PlainDateTimeShim from '../../funcApi/shim/plainDateTime'
import * as PlainTimeShim from '../../funcApi/shim/plainTime'
import * as ZonedDateTimeShim from '../../funcApi/shim/zonedDateTime'
import * as ZonedDateTimeFns from '../../funcApi/zonedDateTime'
import { Temporal } from './implementation'

// Regressions found while auditing the polyfill's rounding, sign and BigInt
// math. Expected results match the reference implementation except for the
// collapsed Apia day window documented below.

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

describe('roundingIncrement range', () => {
  const instant = new Temporal.Instant(5n)

  it('Instant#round rejects increments above 1e9 that divide a day', () => {
    for (const roundingIncrement of [2e9, 86400e9]) {
      expect(() =>
        instant.round({ smallestUnit: 'nanosecond', roundingIncrement }),
      ).toThrow(RangeError)
    }
  })

  it('still accepts an increment of exactly 1e9', () => {
    expect(
      instant
        .round({ smallestUnit: 'nanosecond', roundingIncrement: 1e9 })
        .toString(),
    ).toBe('1970-01-01T00:00:00Z')
    expect(
      Temporal.Duration.from({ days: 1 })
        .round({ smallestUnit: 'day', roundingIncrement: 1e9 })
        .toString(),
    ).toBe('PT0S')
  })

  it('rejects before reading later options', () => {
    let didReadRoundingMode = false

    expect(() =>
      instant.round({
        smallestUnit: 'nanosecond',
        roundingIncrement: 2e9,
        get roundingMode() {
          didReadRoundingMode = true
          return 'trunc' as const
        },
      }),
    ).toThrow(RangeError)
    expect(didReadRoundingMode).toBe(false)
  })
})

describe('halfEven with an increment on wall-clock time', () => {
  // A unit counts its multiples from the start of the next larger unit. It only shows
  // on an exact tie, with an increment that goes into that larger unit an odd number of
  // times, when the multiples counted from midnight have the opposite parity.
  const cases = [
    ['05:58:00', 'minute', 4, '05:56:00'], // 14.5 multiples into the hour
    ['19:54:00', 'minute', 4, '19:56:00'], // 13.5
    ['12:01:54', 'second', 4, '12:01:56'],
    ['12:01:50', 'second', 4, '12:01:48'],
    ['12:00:01.004', 'millisecond', 8, '12:00:01'],
    ['12:00:00.001004', 'microsecond', 8, '12:00:00.001'],
    ['12:00:00.000001004', 'nanosecond', 8, '12:00:00.000001'],
    // hours count from midnight, so nothing changes for them
    ['03:00:00', 'hour', 2, '04:00:00'],
    ['01:00:00', 'hour', 2, '00:00:00'],
  ] as const

  const zoned = (time: string) => `2024-07-15T${time}+09:00[Asia/Tokyo]`

  it.each(cases)('%s to %s by %i', (time, smallestUnit, inc, expected) => {
    const options = {
      smallestUnit,
      roundingIncrement: inc,
      roundingMode: 'halfEven',
    } as const

    expect(Temporal.PlainTime.from(time).round(options).toString()).toBe(
      expected,
    )
    expect(
      Temporal.PlainDateTime.from(`2024-07-15T${time}`)
        .round(options)
        .toString(),
    ).toBe(`2024-07-15T${expected}`)
    expect(
      Temporal.ZonedDateTime.from(zoned(time)).round(options).toString(),
    ).toBe(zoned(expected))
  })

  it('matches through the function API', () => {
    const options = { roundingIncrement: 4, roundingMode: 'halfEven' } as const
    const time = '12:01:54'
    const dateTime = `2024-07-15T${time}`

    expect(
      PlainTimeFns.toString(
        PlainTimeFns.roundToSecond(PlainTimeFns.fromString(time), options),
      ),
    ).toBe('12:01:56')
    expect(
      PlainDateTimeFns.toString(
        PlainDateTimeFns.roundToSecond(
          PlainDateTimeFns.fromString(dateTime, CalendarFns.getBasic),
          options,
        ),
      ),
    ).toBe('2024-07-15T12:01:56')
    expect(
      ZonedDateTimeFns.toString(
        ZonedDateTimeFns.roundToSecond(
          ZonedDateTimeFns.fromString(zoned(time), CalendarFns.getBasic),
          options,
        ),
      ),
    ).toBe(zoned('12:01:56'))
  })

  it('carries out of the larger unit and the day', () => {
    const options = {
      smallestUnit: 'second',
      roundingIncrement: 3,
      roundingMode: 'halfEven',
    } as const

    // 58.5 is 19.5 multiples into the minute, and 20 reaches the next one
    expect(
      Temporal.PlainTime.from('12:59:58.5').round(options).toString(),
    ).toBe('13:00:00')
    expect(
      Temporal.PlainTime.from('23:59:58.5').round(options).toString(),
    ).toBe('00:00:00')
    expect(
      Temporal.PlainDateTime.from('2024-07-15T23:59:58.5')
        .round(options)
        .toString(),
    ).toBe('2024-07-16T00:00:00')
  })

  it('leaves Instant counting from the epoch', () => {
    // The same wall-clock digits as the PlainTime above give a different multiple,
    // because an Instant has no larger unit to count from
    expect(
      Temporal.Instant.from('2024-07-15T12:01:54Z')
        .round({
          smallestUnit: 'second',
          roundingIncrement: 4,
          roundingMode: 'halfEven',
        })
        .toString(),
    ).toBe('2024-07-15T12:01:52Z')
  })
})

describe('Duration#total rounding once', () => {
  // Rounding the fraction first gives 2 + 0.522 = 2.5220000000000002.
  it('totals fixed-length units without rounding intermediate values', () => {
    expect(
      Temporal.Duration.from({ nanoseconds: 2522 }).total('microsecond'),
    ).toBe(2.522)
    expect(
      Temporal.Duration.from({
        hours: 29,
        seconds: 223,
        microseconds: 3760,
      }).total('day'),
    ).toBe(1.2109143953703703)
  })

  it('rounds halfway cases to even in both directions', () => {
    // At 2^50 microseconds the spacing is 250 ns, so 125 and 375 ns are ties.
    const baseMicro = 2 ** 50
    for (const sign of [1, -1]) {
      const totalMicro = (nano: number) =>
        Temporal.Duration.from({
          microseconds: sign * baseMicro,
          nanoseconds: sign * nano,
        }).total('microsecond')

      expect(totalMicro(125)).toBe(sign * baseMicro)
      expect(totalMicro(126)).toBe(sign * (baseMicro + 0.25))
      expect(totalMicro(375)).toBe(sign * (baseMicro + 0.5))
    }
  })

  it('totals fractional calendar units in both directions', () => {
    // One January plus five days of a 29-day February.
    expect(
      Temporal.Duration.from({ days: 36 }).total({
        unit: 'month',
        relativeTo: '2020-01-01',
      }),
    ).toBe(34 / 29)
    // Back 366 days to 2020-01-31, then 30 days into the preceding 365-day year.
    expect(
      Temporal.Duration.from({ days: -396 }).total({
        unit: 'year',
        relativeTo: '2021-01-31',
      }),
    ).toBe(-395 / 365)
  })

  it('returns the whole day count when a skipped date collapses the window', () => {
    // Apia skipped Dec 30, so both day boundaries land on Dec 31. The shim
    // returns the same whole day count as until(). Native Temporal can throw here.
    const start = '2012-01-01T00:00[Pacific/Apia]'
    const end = '2011-12-31T00:00[Pacific/Apia]'
    expect(
      Temporal.Duration.from({ hours: -24 }).total({
        unit: 'day',
        relativeTo: start,
      }),
    ).toBe(-1)
    expect(
      ZonedDateTimeShim.diffDays(
        ZonedDateTimeShim.fromString(start, CalendarFns.getBasic),
        ZonedDateTimeShim.fromString(end, CalendarFns.getBasic),
      ),
    ).toBe(-1)
  })

  it('rounds fractional differences in the function API', () => {
    expect(
      PlainTimeShim.diffMicroseconds(
        PlainTimeShim.fromString('00:00'),
        PlainTimeShim.fromString('00:00:00.000002522'),
      ),
    ).toBe(2.522)
    expect(
      PlainDateTimeShim.diffMicroseconds(
        PlainDateTimeShim.fromString('2020-01-01T00:00', CalendarFns.getBasic),
        PlainDateTimeShim.fromString(
          '2020-01-01T00:00:00.000002522',
          CalendarFns.getBasic,
        ),
      ),
    ).toBe(2.522)
    expect(
      PlainDateShim.diffWeeks(
        PlainDateShim.fromString('2020-01-01', CalendarFns.getBasic),
        PlainDateShim.fromString('2020-01-10', CalendarFns.getBasic),
      ),
    ).toBe(9 / 7)
  })
})
