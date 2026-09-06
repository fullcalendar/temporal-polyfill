import * as Utils from 'temporal-utils'
import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as PlainTime from '../shim/plainTime'
import * as PlainYearMonth from '../shim/plainYearMonth'
import * as ZonedDateTime from '../shim/zonedDateTime'
import { Temporal, expectPlainParity, zonedFields } from './testUtils'

// These invariants supplement the utility oracle: two implementations agreeing
// on a boundary outside the input interval is still a bug.
function checkAlignment<R>(
  value: R,
  start: (value: R) => R,
  end: (value: R) => R,
  compare: (left: R, right: R) => number,
  interval: (value: R) => unknown,
  normalize: (value: R) => unknown,
): [R, R] {
  const first = start(value)
  const last = end(value)
  expect(normalize(start(first))).toStrictEqual(normalize(first))
  expect(normalize(end(last))).toStrictEqual(normalize(last))
  expect(compare(first, value)).toBeLessThanOrEqual(0)
  expect(compare(last, value)).toBeGreaterThanOrEqual(0)
  expect(interval(first)).toStrictEqual(interval(value))
  expect(interval(last)).toStrictEqual(interval(value))
  return [first, last]
}

describe('alignment parity', () => {
  it.each(['Year', 'Month', 'Week'] as const)(
    'PlainDate %s interval',
    (unit) => {
      const value = '2024-08-20'
      const record = PlainDate.fromString(value, Calendar.getAny)
      const temporal = Temporal.PlainDate.from(value)
      const [first, last] = checkAlignment(
        record,
        PlainDate[`startOf${unit}`],
        PlainDate[`endOf${unit}`],
        PlainDate.compare,
        (r) =>
          unit === 'Year'
            ? r.year
            : unit === 'Month'
              ? [r.year, r.monthCode]
              : [PlainDate.yearOfWeek(r), PlainDate.weekOfYear(r)],
        PlainDate.toString,
      )
      expectPlainParity(
        first,
        (Utils[`startOf${unit}`] as typeof Utils.startOfMonth)(temporal),
        PlainDate.toString,
      )
      expectPlainParity(
        last,
        (Utils[`endOf${unit}`] as typeof Utils.endOfMonth)(temporal),
        PlainDate.toString,
      )
    },
  )

  it.each(['Year', 'Month'] as const)(
    'non-ISO PlainDate %s boundaries',
    (unit) => {
      const value = '2024-03-10[u-ca=hebrew]'
      const record = PlainDate.fromString(value, Calendar.getAny)
      const temporal = Temporal.PlainDate.from(value)
      const [first, last] = checkAlignment(
        record,
        PlainDate[`startOf${unit}`],
        PlainDate[`endOf${unit}`],
        PlainDate.compare,
        (r) => (unit === 'Year' ? r.year : [r.year, r.monthCode]),
        PlainDate.toString,
      )
      expectPlainParity(
        first,
        (Utils[`startOf${unit}`] as typeof Utils.startOfMonth)(temporal),
        PlainDate.toString,
      )
      expectPlainParity(
        last,
        (Utils[`endOf${unit}`] as typeof Utils.endOfMonth)(temporal),
        PlainDate.toString,
      )
      expect(PlainDate.toString(first)).toBe(
        unit === 'Year' ? '2023-09-16[u-ca=hebrew]' : '2024-02-10[u-ca=hebrew]',
      )
    },
  )

  it.each(['Year', 'Month', 'Week', 'Day', 'Hour', 'Microsecond'] as const)(
    'PlainDateTime %s interval',
    (unit) => {
      const value = '2024-08-20T12:34:56.123456789'
      const record = PlainDateTime.fromString(value, Calendar.getAny)
      const temporal = Temporal.PlainDateTime.from(value)
      // The floored value identifies the interval even across ISO week-years.
      const start = PlainDateTime[`startOf${unit}`]
      const [first, last] = checkAlignment(
        record,
        start,
        PlainDateTime[`endOf${unit}`],
        PlainDateTime.compare,
        (r) => PlainDateTime.toString(start(r)),
        PlainDateTime.toString,
      )
      expectPlainParity(
        first,
        (Utils[`startOf${unit}`] as typeof Utils.startOfHour)(temporal),
        PlainDateTime.toString,
      )
      expectPlainParity(
        last,
        (Utils[`endOf${unit}`] as typeof Utils.endOfHour)(temporal),
        PlainDateTime.toString,
      )
      if (unit === 'Day') {
        expect(PlainDateTime.toString(first)).toBe('2024-08-20T00:00:00')
        expect(PlainDateTime.toString(last)).toBe(
          '2024-08-20T23:59:59.999999999',
        )
      }
    },
  )

  it.each(['Hour', 'Microsecond'] as const)('PlainTime %s interval', (unit) => {
    const value = '23:34:56.123456789'
    const record = PlainTime.fromString(value)
    const temporal = Temporal.PlainTime.from(value)
    const start = PlainTime[`startOf${unit}`]
    const [first, last] = checkAlignment(
      record,
      start,
      PlainTime[`endOf${unit}`],
      PlainTime.compare,
      (r) => PlainTime.toString(start(r)),
      PlainTime.toString,
    )
    expect(PlainTime.toString(first)).toBe(
      Utils[`startOf${unit}`](temporal).toString(),
    )
    expect(PlainTime.toString(last)).toBe(
      Utils[`endOf${unit}`](temporal).toString(),
    )
  })

  it.each(['2024-08-20', '2024-03-10[u-ca=hebrew]'])(
    'PlainYearMonth year interval at %s',
    (value) => {
      const record = PlainYearMonth.fromString(value, Calendar.getAny)
      const temporal = Temporal.PlainYearMonth.from(value)
      const [first, last] = checkAlignment(
        record,
        PlainYearMonth.startOfYear,
        PlainYearMonth.endOfYear,
        PlainYearMonth.compare,
        (r) => r.year,
        (r) => PlainYearMonth.toString(r, { calendarName: 'always' }),
      )
      expectPlainParity(
        first,
        Utils.startOfYear(temporal),
        PlainYearMonth.toString,
      )
      expectPlainParity(
        last,
        Utils.endOfYear(temporal),
        PlainYearMonth.toString,
      )
    },
  )

  it.each([
    ['Year', '2024-03-10T12:00[America/New_York]'],
    ['Month', '2024-11-03T12:00[America/New_York]'],
    ['Week', '2024-03-10T12:00[America/New_York]'],
    ['Day', '2024-03-10T12:00[America/New_York]'],
    ['Day', '2024-11-03T12:00[America/New_York]'],
    ['Hour', '2024-11-03T01:30-04:00[America/New_York]'],
    ['Hour', '2024-11-03T01:30-05:00[America/New_York]'],
    ['Microsecond', '2024-03-10T03:00:00.123456789[America/New_York]'],
    ['Year', '2024-03-10T12:00[America/New_York][u-ca=hebrew]'],
  ] as const)('ZonedDateTime %s at %s', (unit, value) => {
    const record = ZonedDateTime.fromString(value, Calendar.getAny)
    const temporal = Temporal.ZonedDateTime.from(value)
    const start = ZonedDateTime[`startOf${unit}`]
    const [first, last] = checkAlignment(
      record,
      start,
      ZonedDateTime[`endOf${unit}`],
      ZonedDateTime.compare,
      (r) => start(r).epochNanoseconds,
      zonedFields,
    )
    expect(zonedFields(first)).toStrictEqual(
      zonedFields(
        (Utils[`startOf${unit}`] as typeof Utils.startOfHour)(temporal),
      ),
    )
    expect(zonedFields(last)).toStrictEqual(
      zonedFields((Utils[`endOf${unit}`] as typeof Utils.endOfHour)(temporal)),
    )
    if (unit === 'Day' && value.includes('America/New_York')) {
      const hours = value.includes('03-10') ? 23n : 25n
      expect(last.epochNanoseconds - first.epochNanoseconds + 1n).toBe(
        hours * 3_600_000_000_000n,
      )
    }
  })
})

// temporal-utils endOfDay adds one day to the 00:30 start, spilling into the
// next date. Use a direct boundary here rather than reproducing that oracle bug.
it('ends a day with a skipped midnight at the next date boundary', () => {
  const record = ZonedDateTime.fromString(
    '1919-03-31T12:00[America/Toronto]',
    Calendar.getAny,
  )
  const [first, last] = checkAlignment(
    record,
    ZonedDateTime.startOfDay,
    ZonedDateTime.endOfDay,
    ZonedDateTime.compare,
    (r) => [r.year, r.month, r.day],
    zonedFields,
  )
  expect([first.hour, first.minute]).toStrictEqual([0, 30])
  expect([
    last.hour,
    last.minute,
    last.second,
    last.millisecond,
    last.microsecond,
    last.nanosecond,
  ]).toStrictEqual([23, 59, 59, 999, 999, 999])
  expect(last.epochNanoseconds - first.epochNanoseconds + 1n).toBe(
    84_600_000_000_000n,
  )
})
