import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as PlainTimeFns from '../../funcApi/plainTime'
import * as ZonedDateTimeFns from '../../funcApi/zonedDateTime'
import { Temporal } from './implementation'

// Regressions from user reports that test262 doesn't reach. Expected values match
// native Temporal and the reference implementation in proposal-temporal/polyfill.

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
