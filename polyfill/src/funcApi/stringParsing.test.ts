import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import * as ZonedDateTimeFns from './zonedDateTime'

// These exports pick a native or shim implementation depending on the host, and the two
// parse strings separately, so run this file on a Node version with each of them.

const getCalendar = CalendarFns.getBasic

describe('dates at the limits', () => {
  it('accepts a date with a time at the lower limit of PlainDate', () => {
    const s = '-271821-04-19T00:00'
    expect(PlainDateFns.toString(PlainDateFns.fromString(s, getCalendar))).toBe(
      '-271821-04-19',
    )
  })

  it.each([
    ['-271821-04-19T00:00', '-271821-04'],
    ['+275760-09-30', '+275760-09'],
    ['-271821-04-19T00:00[u-ca=gregory]', '-271821-04-01[u-ca=gregory]'],
    ['+275760-09-14[u-ca=gregory]', '+275760-09-01[u-ca=gregory]'],
  ])('PlainYearMonth %s', (s, expected) => {
    expect(
      PlainYearMonthFns.toString(PlainYearMonthFns.fromString(s, getCalendar)),
    ).toBe(expected)
  })

  it.each([
    ['-271821-03-31', getCalendar],
    ['+275760-10-01', getCalendar],
    ['+275760-10-01[u-ca=gregory]', getCalendar],
    ['-271821-04-01[u-ca=hebrew]', CalendarFns.getAny], // month starts before the limit
  ])('PlainYearMonth %s is out of range', (s, getCalendarRecord) => {
    expect(() => PlainYearMonthFns.fromString(s, getCalendarRecord)).toThrow(
      RangeError,
    )
  })

  it('accepts any year for an ISO PlainMonthDay', () => {
    const record = PlainMonthDayFns.fromString('+999999-12-31', getCalendar)
    expect(PlainMonthDayFns.toString(record)).toBe('12-31')
  })
})

describe('annotations have no limit on their number', () => {
  const annotations = '[foo=bar]'.repeat(50)

  it.each(['2024-10-03', '2024-10-03[UTC]'])('%s', (s) => {
    const record = PlainDateFns.fromString(s + annotations, getCalendar)
    expect(PlainDateFns.toString(record)).toBe('2024-10-03')
  })

  it('applies to a ZonedDateTime', () => {
    const s = `2024-10-03T12:00[UTC]${annotations}`
    const record = ZonedDateTimeFns.fromString(s, getCalendar)
    expect(ZonedDateTimeFns.toString(record)).toBe(
      '2024-10-03T12:00:00+00:00[UTC]',
    )
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
    expect(PlainTimeFns.toString(PlainTimeFns.fromString(s))).toBe(expected)
  })

  it.each([' 12:00', '12:00Z', '12:00z', '1225', '12-25', '202401', '2024-01'])(
    '%s is rejected',
    (s) => {
      expect(() => PlainTimeFns.fromString(s)).toThrow(RangeError)
    },
  )
})

describe('time zone identifiers out of range', () => {
  const instant = InstantFns.fromEpochMilliseconds(0)

  it.each(['+24:00', '+23:60', '-24:00', '+2400'])('%s', (id) => {
    expect(() => InstantFns.toZonedDateTimeISO(instant, id)).toThrow(RangeError)
  })
})

describe('Duration strings', () => {
  it.each([
    ['P1Y2M3W4DT5H6M7.5S', 'P1Y2M3W4DT5H6M7.5S'],
    ['-P1Y', '-P1Y'],
    ['+p1yt1h', 'P1YT1H'],
    ['PT1.5H', 'PT1H30M'],
    ['PT1,5M', 'PT1M30S'],
    ['PT1.123456789H', 'PT1H7M24.4444404S'],
    ['-PT1.123456789M', '-PT1M7.40740734S'],
    ['PT1H1M1.5S', 'PT1H1M1.5S'],
    ['P0D', 'PT0S'],
  ])('%s', (s, expected) => {
    expect(DurationFns.toString(DurationFns.fromString(s))).toBe(expected)
  })

  it.each([
    'P',
    'PT',
    '-P',
    'P1YT',
    'P1DT',
    'PT1.5H1M',
    'PT1.5M1S',
    'PT1.5H1.5M',
    'P1.5D',
    'PT.5S',
    'PT1.S',
    'PT1.1234567891S',
    'P1Y\n',
    '',
    `P${'9'.repeat(400)}Y`,
    `PT${'9'.repeat(400)}S`,
  ])('%j is rejected', (s) => {
    expect(() => DurationFns.fromString(s)).toThrow(RangeError)
  })
})
