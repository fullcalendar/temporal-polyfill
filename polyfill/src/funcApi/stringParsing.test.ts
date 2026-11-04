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

// The class API tests go through the same parser with many more strings. These only
// show that each function reaches it, and on native Temporal that the host agrees.
describe('time-only strings', () => {
  it('accepts one', () => {
    expect(PlainTimeFns.toString(PlainTimeFns.fromString('T1225'))).toBe(
      '12:25:00',
    )
  })

  it('rejects a possible month-day', () => {
    expect(() => PlainTimeFns.fromString('1225')).toThrow(RangeError)
  })
})

describe('time zone identifiers out of range', () => {
  it('rejects +24:00', () => {
    const instant = InstantFns.fromEpochMilliseconds(0)
    expect(() => InstantFns.toZonedDateTimeISO(instant, '+24:00')).toThrow(
      RangeError,
    )
  })
})

describe('Duration strings', () => {
  it('accepts a fractional unit', () => {
    expect(DurationFns.toString(DurationFns.fromString('PT1.5H'))).toBe(
      'PT1H30M',
    )
  })

  it.each(['P', 'PT1.5H1M'])('rejects %s', (s) => {
    expect(() => DurationFns.fromString(s)).toThrow(RangeError)
  })
})
