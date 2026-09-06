import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as Duration from '../shim/duration'
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

// Each row selects a different arithmetic leaf; the two directions also cover
// the small subtract adapters without multiplying every exported unit alias.
describe.each(['add', 'subtract'] as const)('%s movement parity', (method) => {
  it.each([
    ['hours', 25, Instant.addHours, Instant.subtractHours],
    [
      'nanoseconds',
      Number.MAX_SAFE_INTEGER,
      Instant.addNanoseconds,
      Instant.subtractNanoseconds,
    ],
  ] as const)('Instant %s (%s)', (unit, count, add, subtract) => {
    const input = -123456789n
    const fields = { [unit]: count }
    const expected = new Temporal.Instant(input)[method](
      fields,
    ).epochNanoseconds
    expect(
      Instant[method](Instant.create(input), Duration.fromFields(fields))
        .epochNanoseconds,
    ).toBe(expected)
    expect(
      (method === 'add' ? add : subtract)(Instant.create(input), count)
        .epochNanoseconds,
    ).toBe(expected)
    if (unit === 'nanoseconds') {
      expect(expected).toBe(
        input + BigInt(count) * (method === 'add' ? 1n : -1n),
      )
    }
  })

  it('PlainTime balances and wraps through midnight', () => {
    const value = '23:45:00.000000001'
    const fields = { minutes: 90 }
    const record = PlainTime.fromString(value)
    const expected = Temporal.PlainTime.from(value)[method](fields).toString()
    expect(
      PlainTime.toString(
        PlainTime[method](record, Duration.fromFields(fields)),
      ),
    ).toBe(expected)
    expect(
      PlainTime.toString(
        (method === 'add' ? PlainTime.addMinutes : PlainTime.subtractMinutes)(
          record,
          90,
        ),
      ),
    ).toBe(expected)
  })

  it.each([
    ['2024-02-29', 'years', 1, PlainDate.addYears, PlainDate.subtractYears],
    ['2024-03-31', 'months', 1, PlainDate.addMonths, PlainDate.subtractMonths],
    ['2024-01-03', 'weeks', 2, PlainDate.addWeeks, PlainDate.subtractWeeks],
    ['2024-01-01', 'days', 1, PlainDate.addDays, PlainDate.subtractDays],
    [
      '2024-03-10[u-ca=hebrew]',
      'months',
      1,
      PlainDate.addMonths,
      PlainDate.subtractMonths,
    ],
  ] as const)('PlainDate %s by %s', (value, unit, count, add, subtract) => {
    const record = PlainDate.fromString(value, Calendar.getAny)
    const fields = { [unit]: count }
    const expected = Temporal.PlainDate.from(value)[method](fields, {
      overflow: 'constrain',
    })
    expectPlainParity(
      PlainDate[method](record, Duration.fromFields(fields), {
        overflow: 'constrain',
      }),
      expected,
      PlainDate.toString,
    )
    expectPlainParity(
      (method === 'add' ? add : subtract)(record, count, {
        overflow: 'constrain',
      }),
      expected,
      PlainDate.toString,
    )
  })

  it.each([
    [
      '2024-01-31T23:30',
      'months',
      1,
      PlainDateTime.addMonths,
      PlainDateTime.subtractMonths,
    ],
    [
      '2024-02-29T23:30',
      'years',
      1,
      PlainDateTime.addYears,
      PlainDateTime.subtractYears,
    ],
    [
      '2024-01-01T23:30',
      'hours',
      25,
      PlainDateTime.addHours,
      PlainDateTime.subtractHours,
    ],
  ] as const)('PlainDateTime %s by %s', (value, unit, count, add, subtract) => {
    const record = PlainDateTime.fromString(value, Calendar.getAny)
    const fields = { [unit]: count }
    const expected = Temporal.PlainDateTime.from(value)[method](fields)
    expectPlainParity(
      PlainDateTime[method](record, Duration.fromFields(fields)),
      expected,
      PlainDateTime.toString,
    )
    expectPlainParity(
      (method === 'add' ? add : subtract)(record, count),
      expected,
      PlainDateTime.toString,
    )
  })

  it.each([
    ['years', 1, PlainYearMonth.addYears, PlainYearMonth.subtractYears],
    ['months', 13, PlainYearMonth.addMonths, PlainYearMonth.subtractMonths],
  ] as const)(
    'PlainYearMonth %s with a non-default reference day',
    (unit, count, add, subtract) => {
      const record = PlainYearMonth.create(2024, 2, undefined, 29)
      const temporal = new Temporal.PlainYearMonth(2024, 2, 'iso8601', 29)
      const fields = { [unit]: count }
      const expected = temporal[method](fields)
      expectPlainParity(
        PlainYearMonth[method](record, Duration.fromFields(fields)),
        expected,
        PlainYearMonth.toString,
      )
      expectPlainParity(
        (method === 'add' ? add : subtract)(record, count),
        expected,
        PlainYearMonth.toString,
      )
    },
  )

  it.each([
    [
      '2024-03-09T12:00[America/New_York]',
      'days',
      1,
      ZonedDateTime.addDays,
      ZonedDateTime.subtractDays,
    ],
    [
      '2024-11-02T12:00[America/New_York]',
      'days',
      1,
      ZonedDateTime.addDays,
      ZonedDateTime.subtractDays,
    ],
    [
      '2024-03-10T12:00[America/New_York]',
      'hours',
      24,
      ZonedDateTime.addHours,
      ZonedDateTime.subtractHours,
    ],
    [
      '2024-11-03T12:00[America/New_York]',
      'hours',
      24,
      ZonedDateTime.addHours,
      ZonedDateTime.subtractHours,
    ],
    [
      '2024-03-13T12:00[America/New_York]',
      'weeks',
      1,
      ZonedDateTime.addWeeks,
      ZonedDateTime.subtractWeeks,
    ],
    [
      '2024-03-31T12:00[America/New_York]',
      'months',
      1,
      ZonedDateTime.addMonths,
      ZonedDateTime.subtractMonths,
    ],
    [
      '2024-02-29T12:00[America/New_York]',
      'years',
      1,
      ZonedDateTime.addYears,
      ZonedDateTime.subtractYears,
    ],
  ] as const)('ZonedDateTime %s by %s', (value, unit, count, add, subtract) => {
    const record = ZonedDateTime.fromString(value, Calendar.getAny)
    const fields = { [unit]: count }
    const expected = zonedFields(
      Temporal.ZonedDateTime.from(value)[method](fields),
    )
    expect(
      zonedFields(ZonedDateTime[method](record, Duration.fromFields(fields))),
    ).toStrictEqual(expected)
    expect(
      zonedFields((method === 'add' ? add : subtract)(record, count)),
    ).toStrictEqual(expected)
  })

  it('PlainDateTime composes calendar movement with a time carry', () => {
    const value = '2024-03-31T23:30'
    const fields = { months: 1, hours: 25 }
    const record = PlainDateTime.fromString(value, Calendar.getAny)
    expectPlainParity(
      PlainDateTime[method](record, Duration.fromFields(fields)),
      Temporal.PlainDateTime.from(value)[method](fields),
      PlainDateTime.toString,
    )
  })

  it('ZonedDateTime composes calendar days with exact hours across DST', () => {
    const value =
      method === 'add'
        ? '2024-03-09T12:00[America/New_York]'
        : '2024-11-04T12:00[America/New_York]'
    const fields = { days: 1, hours: 12 }
    const record = ZonedDateTime.fromString(value, Calendar.getAny)
    expect(
      zonedFields(ZonedDateTime[method](record, Duration.fromFields(fields))),
    ).toStrictEqual(
      zonedFields(Temporal.ZonedDateTime.from(value)[method](fields)),
    )
  })

  it('rejects calendar overflow in full and fixed month movement', () => {
    const value = '2024-03-31'
    const record = PlainDate.fromString(value, Calendar.getAny)
    const temporal = Temporal.PlainDate.from(value)
    const options = { overflow: 'reject' } as const
    expectErrorParity(
      () =>
        PlainDate[method](record, Duration.fromFields({ months: 1 }), options),
      () => temporal[method]({ months: 1 }, options),
    )
    expectErrorParity(
      () =>
        (method === 'add' ? PlainDate.addMonths : PlainDate.subtractMonths)(
          record,
          1,
          options,
        ),
      () => temporal[method]({ months: 1 }, options),
    )
  })

  it.each(['weeks', 'days', 'hours'] as const)(
    'PlainYearMonth rejects %s',
    (unit) => {
      expectErrorParity(
        () =>
          PlainYearMonth[method](
            PlainYearMonth.create(2024, 1),
            Duration.fromFields({ [unit]: 1 }),
          ),
        () => new Temporal.PlainYearMonth(2024, 1)[method]({ [unit]: 1 }),
      )
    },
  )

  it('rejects movement beyond the Instant range', () => {
    const input = (method === 'add' ? 1n : -1n) * 8_640_000_000_000_000_000_000n
    expectErrorParity(
      () =>
        Instant[method](
          Instant.create(input),
          Duration.fromFields({ nanoseconds: 1 }),
        ),
      () => new Temporal.Instant(input)[method]({ nanoseconds: 1 }),
    )
    expectErrorParity(
      () =>
        (method === 'add'
          ? Instant.addNanoseconds
          : Instant.subtractNanoseconds)(Instant.create(input), 1),
      () => new Temporal.Instant(input)[method]({ nanoseconds: 1 }),
    )
  })

  it('rejects movement beyond the PlainDate range', () => {
    const value = method === 'add' ? '+275760-09-13' : '-271821-04-19'
    const record = PlainDate.fromString(value, Calendar.getAny)
    const temporal = Temporal.PlainDate.from(value)
    expectErrorParity(
      () => PlainDate[method](record, Duration.fromFields({ days: 1 })),
      () => temporal[method]({ days: 1 }),
    )
    expectErrorParity(
      () =>
        (method === 'add' ? PlainDate.addDays : PlainDate.subtractDays)(
          record,
          1,
        ),
      () => temporal[method]({ days: 1 }),
    )
  })
})

describe('movement shared-result checks', () => {
  it.each([
    ['2024-03-09T12:00[America/New_York]', 23, 13],
    ['2024-11-02T12:00[America/New_York]', 25, 11],
  ] as const)(
    'calendar day differs from 24 hours at %s',
    (value, elapsedHours, exactHour) => {
      const record = ZonedDateTime.fromString(value, Calendar.getAny)
      const day = ZonedDateTime.addDays(record, 1)
      const exact = ZonedDateTime.addHours(record, 24)
      expect(day.epochNanoseconds - record.epochNanoseconds).toBe(
        BigInt(elapsedHours) * 3_600_000_000_000n,
      )
      expect(day.hour).toBe(12)
      expect(exact.hour).toBe(exactHour)
    },
  )

  it.each(['constrain', 'reject'] as const)(
    'PlainYearMonth non-ISO leap-month overflow: %s',
    (overflow) => {
      const value = '2024-03-01[u-ca=hebrew]'
      const record = PlainYearMonth.fromString(value, Calendar.getAny)
      const temporal = Temporal.PlainYearMonth.from(value)
      const move = () => PlainYearMonth.addYears(record, 1, { overflow })
      const fullMove = () =>
        PlainYearMonth.add(record, Duration.fromFields({ years: 1 }), {
          overflow,
        })
      const oracle = () => temporal.add({ years: 1 }, { overflow })
      if (overflow === 'reject') {
        expectErrorParity(move, oracle)
        expectErrorParity(fullMove, oracle)
      } else {
        expectPlainParity(move(), oracle(), PlainYearMonth.toString)
        expectPlainParity(fullMove(), oracle(), PlainYearMonth.toString)
      }
    },
  )
})
