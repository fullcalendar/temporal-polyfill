import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as PlainDateShim from '../../funcApi/shim/plainDate'
import * as PlainYearMonthShim from '../../funcApi/shim/plainYearMonth'
import { Temporal as FullTemporal } from '../full/implementation'
import { Temporal } from './implementation'

const getCalendar = CalendarFns.getBasic

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

describe('dates at the lower limit, with a time that a PlainDateTime would reject', () => {
  const s = '-271821-04-19T00:00'

  it('are valid for PlainDate', () => {
    expect(Temporal.PlainDate.from(s).toString()).toBe('-271821-04-19')
    expect(
      PlainDateShim.toString(PlainDateShim.fromString(s, getCalendar)),
    ).toBe('-271821-04-19')
  })

  it('are still invalid for PlainDateTime', () => {
    expect(() => Temporal.PlainDateTime.from(s)).toThrow(RangeError)
  })
})

describe('year-months at the limits only need the year-month in range', () => {
  it.each([
    ['-271821-04-19T00:00', '-271821-04'],
    ['-271821-04-01', '-271821-04'],
    ['+275760-09-30', '+275760-09'],
    ['-271821-04-19T00:00[u-ca=gregory]', '-271821-04-01[u-ca=gregory]'],
    ['-271821-04-01[u-ca=gregory]', '-271821-04-01[u-ca=gregory]'],
    ['+275760-09-14[u-ca=gregory]', '+275760-09-01[u-ca=gregory]'],
  ])('%s', (s, expected) => {
    expect(Temporal.PlainYearMonth.from(s).toString()).toBe(expected)
    expect(
      PlainYearMonthShim.toString(
        PlainYearMonthShim.fromString(s, getCalendar),
      ),
    ).toBe(expected)
  })

  it.each([
    '-271821-03-31',
    '+275760-10-01',
    '-271821-03-31[u-ca=gregory]',
    '+275760-10-01[u-ca=gregory]',
  ])('%s is out of range', (s) => {
    expect(() => Temporal.PlainYearMonth.from(s)).toThrow(RangeError)
  })

  it('rejects a non-ISO month that starts before the first ISO month', () => {
    expect(() =>
      FullTemporal.PlainYearMonth.from('-271821-04-01[u-ca=hebrew]'),
    ).toThrow(RangeError)
  })
})
