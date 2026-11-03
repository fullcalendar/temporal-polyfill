import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as PlainDateShim from '../../funcApi/shim/plainDate'
import * as PlainDateTimeShim from '../../funcApi/shim/plainDateTime'
import * as PlainMonthDayShim from '../../funcApi/shim/plainMonthDay'
import * as PlainYearMonthShim from '../../funcApi/shim/plainYearMonth'
import { Temporal } from './implementation'

// A string must be valid as a whole, including the parts that the requested type discards.
// test262 covers some of these per type, but not an offset that only the parser looks at.

const invalidDateTimes = [
  '2024-10-03T12:00+99:00', // offset
  '2024-10-03T12:00+24:00',
  '2024-10-03T12:00+00:99',
  '2024-10-03T12:00+01:00:99',
  '2024-10-03T25:00', // time
  '2024-10-03T12:60',
  '2024-02-30T12:00', // date
  '2024-13-03T12:00',
]

const zoned = Temporal.ZonedDateTime.from('2024-01-01T00:00[UTC]')
const date = Temporal.PlainDate.from('2024-01-01')

const getCalendar = CalendarFns.getBasic
const plainTypes: [string, (s: string) => unknown][] = [
  ['PlainDate.from', (s) => Temporal.PlainDate.from(s)],
  ['PlainDateTime.from', (s) => Temporal.PlainDateTime.from(s)],
  ['PlainYearMonth.from', (s) => Temporal.PlainYearMonth.from(s)],
  ['PlainMonthDay.from', (s) => Temporal.PlainMonthDay.from(s)],
  ['PlainTime.from', (s) => Temporal.PlainTime.from(s)],
  ['PlainDate.fromString', (s) => PlainDateShim.fromString(s, getCalendar)],
  [
    'PlainDateTime.fromString',
    (s) => PlainDateTimeShim.fromString(s, getCalendar),
  ],
  [
    'PlainYearMonth.fromString',
    (s) => PlainYearMonthShim.fromString(s, getCalendar),
  ],
  [
    'PlainMonthDay.fromString',
    (s) => PlainMonthDayShim.fromString(s, getCalendar),
  ],
]

describe('discarded fields in Temporal strings', () => {
  describe.each(plainTypes)('%s', (_name, parse) => {
    it.each(invalidDateTimes)('rejects %s', (s) => {
      expect(() => parse(s)).toThrow(RangeError)
    })

    it('accepts a valid offset that it discards', () => {
      expect(() => parse('2024-10-03T12:00+23:59:59.999999999')).not.toThrow()
    })
  })

  describe('withCalendar', () => {
    it.each([
      ...invalidDateTimes,
      '2024-02-30[u-ca=iso8601]',
      '2024-13-03',
      '25:00[u-ca=iso8601]',
      'T12:60[u-ca=iso8601]',
      '02-30[u-ca=iso8601]', // an impossible month-day, and not a valid time
      '--02-30[u-ca=iso8601]',
      '2024-10[u-ca=hebrew]', // a year-month or month-day must be ISO
      '-271821-04[u-ca=hebrew]',
      '10-03[u-ca=hebrew]',
      '--10-03[u-ca=hebrew]',
    ])('rejects %s', (s) => {
      expect(() => date.withCalendar(s)).toThrow(RangeError)
    })

    it.each([
      ['2024-10-03T12:00+09:00', 'iso8601'],
      ['2024-10-03[u-ca=gregory]', 'gregory'],
      ['2024-10[u-ca=iso8601]', 'iso8601'],
      ['10-03[u-ca=iso8601]', 'iso8601'],
      ['12:00[u-ca=gregory]', 'gregory'],
      ['2024-13', 'iso8601'], // not a year-month, so a time and an offset
      ['13-01[u-ca=gregory]', 'gregory'], // not a month-day, so likewise
    ])('reads %s as %s', (s, calendarId) => {
      expect(date.withCalendar(s).calendarId).toBe(calendarId)
    })
  })

  describe('withTimeZone', () => {
    it.each(['2024-02-30T12:00[UTC]', '2024-01-01T25:00[UTC]'])(
      'rejects %s',
      (s) => {
        expect(() => zoned.withTimeZone(s)).toThrow(RangeError)
      },
    )

    it('reads the time zone of a valid string', () => {
      expect(
        zoned.withTimeZone('2024-01-01T12:00[Asia/Tokyo]').timeZoneId,
      ).toBe('Asia/Tokyo')
    })
  })

  it('a relativeTo string gets the same treatment', () => {
    const duration = Temporal.Duration.from({ days: 1 })
    expect(() =>
      duration.total({ unit: 'hour', relativeTo: '2024-10-03T12:00+99:00' }),
    ).toThrow(RangeError)
  })
})
