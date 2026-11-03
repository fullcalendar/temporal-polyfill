import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as PlainTimeFns from '../../funcApi/plainTime'
import * as ZonedDateTimeFns from '../../funcApi/zonedDateTime'
import { Temporal } from './implementation'

// Regressions from user reports that test262 doesn't reach. Expected values match
// native Temporal and the spec. The reference implementation in
// proposal-temporal/polyfill also agrees, except on Z with offset: 'ignore'.

describe('ZonedDateTime diffs of equal instants in different time zones', () => {
  const newYorkStr = '2026-03-07T12:00[America/New_York]'
  const lisbonStr = '2026-03-07T17:00[Europe/Lisbon]' // same instant
  const newYork = Temporal.ZonedDateTime.from(newYorkStr)
  const lisbon = Temporal.ZonedDateTime.from(lisbonStr)

  for (const largestUnit of ['year', 'month', 'week', 'day'] as const) {
    it(`until and since reject largestUnit ${largestUnit}`, () => {
      expect(() => newYork.until(lisbon, { largestUnit })).toThrow(RangeError)
      expect(() => newYork.since(lisbon, { largestUnit })).toThrow(RangeError)
    })
  }

  it('until and since still give zero for a time unit', () => {
    expect(newYork.until(lisbon, { largestUnit: 'hour' }).toString()).toBe(
      'PT0S',
    )
    expect(newYork.since(lisbon).toString()).toBe('PT0S')
  })

  it('until and since still give zero within one time zone', () => {
    const copy = Temporal.ZonedDateTime.from(newYorkStr)
    const options = { largestUnit: 'day' } as const
    expect(newYork.until(copy, options).toString()).toBe('PT0S')
    expect(newYork.since(copy, options).toString()).toBe('PT0S')
  })

  it('treats a link name and its target as one time zone', () => {
    const calcutta = Temporal.ZonedDateTime.from(
      '2026-03-07T12:00[Asia/Calcutta]',
    )
    const kolkata = Temporal.ZonedDateTime.from(
      '2026-03-07T12:00[Asia/Kolkata]',
    )
    expect(calcutta.until(kolkata, { largestUnit: 'day' }).toString()).toBe(
      'PT0S',
    )
  })

  it('function API diff rejects a date largestUnit', () => {
    const record0 = ZonedDateTimeFns.fromString(
      newYorkStr,
      CalendarFns.getBasic,
    )
    const record1 = ZonedDateTimeFns.fromString(lisbonStr, CalendarFns.getBasic)
    expect(() =>
      ZonedDateTimeFns.diff(record0, record1, { largestUnit: 'day' }),
    ).toThrow(RangeError)
  })

  for (const unit of ['Years', 'Months', 'Weeks', 'Days'] as const) {
    it(`function API diff${unit} rejects them`, () => {
      const record0 = ZonedDateTimeFns.fromString(
        newYorkStr,
        CalendarFns.getBasic,
      )
      const record1 = ZonedDateTimeFns.fromString(
        lisbonStr,
        CalendarFns.getBasic,
      )
      expect(() => ZonedDateTimeFns[`diff${unit}`](record0, record1)).toThrow(
        RangeError,
      )
    })
  }
})

describe('ZonedDateTime#withPlainTime in a repeated hour', () => {
  const firstOccurrence = '2026-11-01T01:30:00-04:00[America/New_York]'
  const secondOccurrence = '2026-11-01T01:30:00-05:00[America/New_York]'

  it('takes the earlier occurrence from the later receiver', () => {
    const zdt = Temporal.ZonedDateTime.from(secondOccurrence)
    expect(zdt.withPlainTime('01:15').toString()).toBe(
      '2026-11-01T01:15:00-04:00[America/New_York]',
    )
  })

  it('takes the earlier occurrence from the earlier receiver', () => {
    const zdt = Temporal.ZonedDateTime.from(firstOccurrence)
    expect(zdt.withPlainTime('01:15').toString()).toBe(
      '2026-11-01T01:15:00-04:00[America/New_York]',
    )
  })

  it('moves forward from a skipped time', () => {
    const zdt = Temporal.ZonedDateTime.from(
      '2026-03-08T12:00[America/New_York]',
    )
    expect(zdt.withPlainTime('02:30').toString()).toBe(
      '2026-03-08T03:30:00-04:00[America/New_York]',
    )
  })

  it('still rejects a time past the Instant limit', () => {
    const zdt = new Temporal.ZonedDateTime(
      8640000000000000000000n,
      'Europe/Berlin',
    )
    expect(() => zdt.withPlainTime('12:00')).toThrow(RangeError)
  })

  it('keeps ZonedDateTime#with preferring the current offset', () => {
    const zdt = Temporal.ZonedDateTime.from(secondOccurrence)
    expect(zdt.with({ minute: 15 }).toString()).toBe(
      '2026-11-01T01:15:00-05:00[America/New_York]',
    )
  })

  it('function API withPlainTime agrees', () => {
    const record = ZonedDateTimeFns.fromString(
      secondOccurrence,
      CalendarFns.getBasic,
    )
    const time = PlainTimeFns.fromString('01:15')
    expect(
      ZonedDateTimeFns.toString(ZonedDateTimeFns.withPlainTime(record, time)),
    ).toBe('2026-11-01T01:15:00-04:00[America/New_York]')
  })
})

describe('ZonedDateTime.from near the Instant limits', () => {
  const minInstantTokyo = '-271821-04-20T00:00:00Z[Asia/Tokyo]'
  const minResultTokyo = '-271821-04-20T09:18:59+09:19[Asia/Tokyo]'

  it('accepts Z at the lower limit', () => {
    expect(Temporal.ZonedDateTime.from(minInstantTokyo).toString()).toBe(
      minResultTokyo,
    )
  })

  it('accepts Z at the upper limit', () => {
    expect(
      Temporal.ZonedDateTime.from(
        '+275760-09-13T00:00:00Z[America/New_York]',
      ).toString(),
    ).toBe('+275760-09-12T20:00:00-04:00[America/New_York]')
  })

  it('accepts Z just inside a limit, where the wall-clock time is past it', () => {
    expect(
      Temporal.ZonedDateTime.from(
        '-271821-04-20T01:00:00Z[Asia/Tokyo]',
      ).toString(),
    ).toBe('-271821-04-20T10:18:59+09:19[Asia/Tokyo]')
  })

  for (const offset of ['use', 'ignore', 'prefer', 'reject'] as const) {
    it(`treats Z as exact with offset ${offset}`, () => {
      expect(
        Temporal.ZonedDateTime.from(minInstantTokyo, { offset }).toString(),
      ).toBe(minResultTokyo)
      expect(
        Temporal.ZonedDateTime.from('2020-06-01T12:00Z[America/New_York]', {
          offset,
        }).toString(),
      ).toBe('2020-06-01T08:00:00-04:00[America/New_York]')
    })
  }

  it('rejects Z just past a limit', () => {
    expect(() =>
      Temporal.ZonedDateTime.from('-271821-04-19T23:59:59.999999999Z[UTC]'),
    ).toThrow(RangeError)
    expect(() =>
      Temporal.ZonedDateTime.from('+275760-09-13T00:00:00.000000001Z[UTC]'),
    ).toThrow(RangeError)
  })

  // The wall-clock date is one day before the Instant limit, but this zone's
  // negative offset puts the resulting instant inside it.
  const beforeLimitDateTime = '-271821-04-19T23:59:59.999999999'
  const beforeLimitResult = `${beforeLimitDateTime}-04:56[America/New_York]`

  it('accepts a wall-clock string before the limit date', () => {
    expect(
      Temporal.ZonedDateTime.from(
        `${beforeLimitDateTime}[America/New_York]`,
      ).toString(),
    ).toBe(beforeLimitResult)
  })

  it('accepts a property bag with no offset before the limit date', () => {
    const zdt = Temporal.ZonedDateTime.from({
      year: -271821,
      month: 4,
      day: 19,
      hour: 23,
      timeZone: 'America/New_York',
    })
    expect(zdt.toString()).toBe(
      '-271821-04-19T23:00:00-04:56[America/New_York]',
    )
  })

  it('still rejects a matched offset before the limit date', () => {
    expect(() =>
      Temporal.ZonedDateTime.from(
        `${beforeLimitDateTime}-04:56[America/New_York]`,
      ),
    ).toThrow(RangeError)
  })

  it('function API fromString agrees', () => {
    const record = ZonedDateTimeFns.fromString(
      minInstantTokyo,
      CalendarFns.getBasic,
    )
    expect(ZonedDateTimeFns.toString(record)).toBe(minResultTokyo)
  })
})
