import { describe, expect, it } from 'vitest'
import { Temporal } from './implementation'

describe('time zone identifiers out of range', () => {
  const instant = Temporal.Instant.from('2024-01-01T00:00Z')

  it.each(['+24:00', '+23:60', '-24:00', '+2400'])('%s', (id) => {
    expect(() => instant.toZonedDateTimeISO(id)).toThrow(RangeError)
  })
})

describe('annotations have no limit on their number', () => {
  const annotations = '[foo=bar]'.repeat(50)

  it.each([
    ['2024-10-03', '2024-10-03'],
    ['2024-10-03[UTC]', '2024-10-03'],
  ])('%s', (s, expected) => {
    expect(Temporal.PlainDate.from(s + annotations).toString()).toBe(expected)
  })
})

describe('time-only strings', () => {
  it.each([
    ['12:00', '12:00:00'],
    ['T12:00', '12:00:00'],
    ['t12:00', '12:00:00'],
    ['1232', '12:32:00'], // not a possible month-day
    ['T1225', '12:25:00'], // the designator rules out a month-day
    ['12:00+01:00[u-ca=hebrew]', '12:00:00'],
    ['23:59:60', '23:59:59'],
  ])('%s', (s, expected) => {
    expect(Temporal.PlainTime.from(s).toString()).toBe(expected)
  })

  it.each([' 12:00', '12:00Z', '12:00z', '1225', '12-25', '202401', '2024-01'])(
    '%s is rejected',
    (s) => {
      expect(() => Temporal.PlainTime.from(s)).toThrow(RangeError)
    },
  )

  const date = Temporal.PlainDate.from('2024-01-01')

  it('can give a calendar', () => {
    expect(date.withCalendar('12:00[u-ca=gregory]').calendarId).toBe('gregory')
  })

  it("can't give a calendar with a Z, which a time can't have", () => {
    expect(() => date.withCalendar('12:00Z[u-ca=gregory]')).toThrow(RangeError)
  })
})
