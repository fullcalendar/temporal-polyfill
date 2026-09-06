import { roundToMonth, roundToWeek, roundToYear } from 'temporal-utils'
import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as Instant from '../shim/instant'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as PlainTime from '../shim/plainTime'
import * as PlainYearMonth from '../shim/plainYearMonth'
import * as ZonedDateTime from '../shim/zonedDateTime'
import {
  Temporal,
  expectErrorParity,
  expectPlainParity,
  zonedFields,
} from './testUtils'

describe('standard rounding parity', () => {
  it.each(['halfEven', 'halfExpand', 'floor'] as const)(
    'Instant negative epoch with %s and an increment',
    (roundingMode) => {
      const epoch = -450_000_000_000n
      const options = { roundingIncrement: 15, roundingMode }
      const expected = new Temporal.Instant(epoch).round({
        ...options,
        smallestUnit: 'minute',
      }).epochNanoseconds
      expect(
        Instant.roundToMinute(Instant.create(epoch), options).epochNanoseconds,
      ).toBe(expected)
      if (roundingMode === 'halfEven') expect(expected).toBe(0n)
    },
  )

  it.each([
    ['12:07:30', '12:00:00'],
    ['23:59:59.999999999', '00:00:00'],
  ])('PlainTime %s rounds to %s', (value, direct) => {
    const record = PlainTime.fromString(value)
    const options = { roundingIncrement: 15, roundingMode: 'halfEven' } as const
    const expected = Temporal.PlainTime.from(value)
      .round({ ...options, smallestUnit: 'minute' })
      .toString()
    expect(PlainTime.toString(PlainTime.roundToMinute(record, options))).toBe(
      expected,
    )
    expect(expected).toBe(direct)
  })

  it('PlainDateTime rounding carries into a new year', () => {
    const value = '2023-12-31T23:59:59.999999999'
    const record = PlainDateTime.fromString(value, Calendar.getAny)
    const expected = Temporal.PlainDateTime.from(value).round('second')
    expectPlainParity(
      PlainDateTime.roundToSecond(record),
      expected,
      PlainDateTime.toString,
    )
    expect(expected.toString()).toBe('2024-01-01T00:00:00')
  })

  it.each([
    [
      '2024-03-10T12:15[America/New_York]',
      '2024-03-10T00:00:00-05:00[America/New_York]',
    ],
    [
      '2024-11-03T11:45[America/New_York]',
      '2024-11-04T00:00:00-05:00[America/New_York]',
    ],
  ])(
    'ZonedDateTime day rounding uses the actual length at %s',
    (value, direct) => {
      const record = ZonedDateTime.fromString(value, Calendar.getAny)
      const expected = Temporal.ZonedDateTime.from(value).round('day')
      expect(zonedFields(ZonedDateTime.roundToDay(record))).toStrictEqual(
        zonedFields(expected),
      )
      expect(expected.toString()).toBe(direct)
    },
  )

  it.each([
    '2024-03-10T01:45-05:00[America/New_York]',
    '2024-11-03T01:45-04:00[America/New_York]',
    '2024-11-03T01:15-05:00[America/New_York]',
  ])('ZonedDateTime hour rounding near a gap/repeat: %s', (value) => {
    const record = ZonedDateTime.fromString(value, Calendar.getAny)
    const options = { roundingMode: 'halfEven' } as const
    const expected = zonedFields(
      Temporal.ZonedDateTime.from(value).round({
        ...options,
        smallestUnit: 'hour',
      }),
    )
    expect(
      zonedFields(ZonedDateTime.roundToHour(record, options)),
    ).toStrictEqual(expected)
  })

  it('rejects invalid increments in fixed time rounding', () => {
    const record = PlainTime.create(12)
    const temporal = new Temporal.PlainTime(12)
    expectErrorParity(
      () => PlainTime.roundToMinute(record, { roundingIncrement: 7 }),
      () => temporal.round({ smallestUnit: 'minute', roundingIncrement: 7 }),
    )
  })
})

describe('calendar interval rounding parity', () => {
  it.each([
    ['roundToYear', PlainDate.roundToYear, roundToYear, '2025-01-01'],
    ['roundToMonth', PlainDate.roundToMonth, roundToMonth, '2024-09-01'],
    ['roundToWeek', PlainDate.roundToWeek, roundToWeek, '2024-08-19'],
  ] as const)('PlainDate %s', (_name, round, oracle, direct) => {
    const value = '2024-08-20'
    const actual = round(PlainDate.fromString(value, Calendar.getAny))
    expectPlainParity(
      actual,
      (oracle as typeof roundToMonth)(Temporal.PlainDate.from(value)),
      PlainDate.toString,
    )
    expect(PlainDate.toString(actual)).toBe(direct)
  })

  it.each([
    ['roundToYear', PlainDateTime.roundToYear, roundToYear],
    ['roundToMonth', PlainDateTime.roundToMonth, roundToMonth],
    ['roundToWeek', PlainDateTime.roundToWeek, roundToWeek],
  ] as const)(
    'PlainDateTime %s with an explicit mode',
    (_name, round, oracle) => {
      const value = '2024-08-20T23:59:59.999999999'
      expectPlainParity(
        round(PlainDateTime.fromString(value, Calendar.getAny), 'ceil'),
        (oracle as typeof roundToMonth)(
          Temporal.PlainDateTime.from(value),
          'ceil',
        ),
        PlainDateTime.toString,
      )
    },
  )

  it.each(['2024-08-20', '2024-03-10[u-ca=hebrew]'])(
    'PlainYearMonth year interval at %s',
    (value) => {
      const record = PlainYearMonth.fromString(value, Calendar.getAny)
      expectPlainParity(
        PlainYearMonth.roundToYear(record, 'floor'),
        roundToYear(Temporal.PlainYearMonth.from(value), 'floor'),
        PlainYearMonth.toString,
      )
    },
  )

  it.each([
    ['roundToYear', ZonedDateTime.roundToYear, roundToYear],
    ['roundToMonth', ZonedDateTime.roundToMonth, roundToMonth],
    ['roundToWeek', ZonedDateTime.roundToWeek, roundToWeek],
  ] as const)(
    'ZonedDateTime %s across a DST interval',
    (_name, round, oracle) => {
      const value = '2024-03-10T12:00[America/New_York]'
      expect(
        zonedFields(
          round(ZonedDateTime.fromString(value, Calendar.getAny), 'ceil'),
        ),
      ).toStrictEqual(
        zonedFields(
          (oracle as typeof roundToMonth)(
            Temporal.ZonedDateTime.from(value),
            'ceil',
          ),
        ),
      )
    },
  )

  it('rounds a non-ISO month using its calendar boundaries', () => {
    const value = '2024-03-10[u-ca=hebrew]'
    const record = PlainDate.fromString(value, Calendar.getAny)
    const actual = PlainDate.roundToMonth(record, 'floor')
    expectPlainParity(
      actual,
      roundToMonth(Temporal.PlainDate.from(value), 'floor'),
      PlainDate.toString,
    )
    expect(PlainDate.toString(actual)).toBe('2024-02-10[u-ca=hebrew]')
    expect(actual.day).toBe(1)
    expect(actual.monthCode).toBe(record.monthCode)
  })

  it('rejects invalid interval increments', () => {
    const value = '2024-08-20'
    expectErrorParity(
      () =>
        PlainDate.roundToMonth(PlainDate.fromString(value, Calendar.getAny), {
          roundingIncrement: 2,
        }),
      () =>
        roundToMonth(Temporal.PlainDate.from(value), { roundingIncrement: 2 }),
    )
  })
})
