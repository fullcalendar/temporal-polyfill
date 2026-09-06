import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as PlainMonthDay from '../shim/plainMonthDay'
import * as PlainTime from '../shim/plainTime'
import * as PlainYearMonth from '../shim/plainYearMonth'
import * as ZonedDateTime from '../shim/zonedDateTime'
import {
  Temporal,
  expectErrorParity,
  expectPlainParity,
  zonedFields,
} from './testUtils'

describe('field update parity', () => {
  it('PlainTime replaces only the supplied fields', () => {
    const value = '12:34:56.123456789'
    const fields = { minute: 3, microsecond: 4 }
    const actual = PlainTime.withFields(PlainTime.fromString(value), fields)
    expect(PlainTime.toString(actual)).toBe(
      Temporal.PlainTime.from(value).with(fields).toString(),
    )
    expect(PlainTime.toString(actual)).toBe('12:03:56.123004789')
  })

  it.each(['constrain', 'reject'] as const)(
    'PlainDate and PlainDateTime overflow: %s',
    (overflow) => {
      for (const value of ['2024-01-31', '2024-03-10[u-ca=hebrew]']) {
        const fields = { day: 32 }
        const options = { overflow }
        const record = PlainDate.fromString(value, Calendar.getAny)
        const temporal = Temporal.PlainDate.from(value)
        const recordTime = PlainDate.toPlainDateTime(
          record,
          PlainTime.create(18, 45),
        )
        const temporalTime = temporal.toPlainDateTime('18:45')
        if (overflow === 'reject') {
          expectErrorParity(
            () => PlainDate.withFields(record, fields, options),
            () => temporal.with(fields, options),
          )
          expectErrorParity(
            () => PlainDateTime.withFields(recordTime, fields, options),
            () => temporalTime.with(fields, options),
          )
        } else {
          expectPlainParity(
            PlainDate.withFields(record, fields, options),
            temporal.with(fields, options),
            PlainDate.toString,
          )
          expectPlainParity(
            PlainDateTime.withFields(recordTime, fields, options),
            temporalTime.with(fields, options),
            PlainDateTime.toString,
          )
        }
      }
    },
  )

  it('resolves a non-ISO leap monthCode instead of retaining the old month', () => {
    const value = '2024-04-15[u-ca=hebrew]'
    const fields = { monthCode: 'M05L' }
    const record = PlainDate.fromString(value, Calendar.getAny)
    const temporal = Temporal.PlainDate.from(value)
    const actual = PlainDate.withFields(record, fields)
    expectPlainParity(actual, temporal.with(fields), PlainDate.toString)
    expect(actual.monthCode).toBe('M05L')
    expectPlainParity(
      PlainDateTime.withFields(PlainDate.toPlainDateTime(record), fields),
      temporal.toPlainDateTime().with(fields),
      PlainDateTime.toString,
    )
  })

  it.each(['iso8601', 'hebrew'])(
    'PlainYearMonth preserves reference-sensitive resolution in %s',
    (calendar) => {
      const record = PlainYearMonth.create(
        2024,
        3,
        Calendar.getAny(calendar),
        25,
      )
      const temporal = new Temporal.PlainYearMonth(2024, 3, calendar, 25)
      const fields = { year: temporal.year + 1 }
      expectPlainParity(
        PlainYearMonth.withFields(record, fields),
        temporal.with(fields),
        PlainYearMonth.toString,
      )
    },
  )

  it.each(['iso8601', 'hebrew'])(
    'PlainMonthDay resolves its reference year in %s',
    (calendar) => {
      const record = PlainMonthDay.create(
        2,
        29,
        Calendar.getAny(calendar),
        2024,
      )
      const temporal = new Temporal.PlainMonthDay(2, 29, calendar, 2024)
      const fields = { day: 15 }
      expectPlainParity(
        PlainMonthDay.withFields(record, fields),
        temporal.with(fields),
        PlainMonthDay.toString,
      )
    },
  )

  it('rejects an empty replacement bag', () => {
    expectErrorParity(
      () => PlainTime.withFields(PlainTime.create(), {}),
      () => new Temporal.PlainTime().with({}),
      TypeError,
    )
  })

  it('rejects inconsistent month and monthCode', () => {
    const fields = { month: 2, monthCode: 'M03' }
    expectErrorParity(
      () => PlainDate.withFields(PlainDate.create(2024, 1, 1), fields),
      () => new Temporal.PlainDate(2024, 1, 1).with(fields),
    )
  })
})

describe('zoned field update parity', () => {
  it.each(['compatible', 'earlier', 'later', 'reject'] as const)(
    'disambiguates a gap with %s',
    (disambiguation) => {
      const value = '2024-03-10T00:30[America/New_York]'
      const record = ZonedDateTime.fromString(value, Calendar.getAny)
      const temporal = Temporal.ZonedDateTime.from(value)
      const fields = { hour: 2 }
      const options = { disambiguation, offset: 'ignore' } as const
      if (disambiguation === 'reject') {
        expectErrorParity(
          () => ZonedDateTime.withFields(record, fields, options),
          () => temporal.with(fields, options),
        )
      } else {
        const actual = ZonedDateTime.withFields(record, fields, options)
        expect(zonedFields(actual)).toStrictEqual(
          zonedFields(temporal.with(fields, options)),
        )
        expect(actual.hour).toBe(disambiguation === 'earlier' ? 1 : 3)
      }
    },
  )

  it.each(['use', 'prefer', 'ignore', 'reject'] as const)(
    'handles an explicit mismatching offset with %s',
    (offset) => {
      const value = '2024-11-03T00:30[America/New_York]'
      const record = ZonedDateTime.fromString(value, Calendar.getAny)
      const temporal = Temporal.ZonedDateTime.from(value)
      const fields = { hour: 1, offset: '-06:00' }
      const options = { offset, disambiguation: 'later' } as const
      if (offset === 'reject') {
        expectErrorParity(
          () => ZonedDateTime.withFields(record, fields, options),
          () => temporal.with(fields, options),
        )
      } else {
        expect(
          zonedFields(ZonedDateTime.withFields(record, fields, options)),
        ).toStrictEqual(zonedFields(temporal.with(fields, options)))
      }
    },
  )

  it('prefers a valid supplied offset in the repeated hour', () => {
    const value = '2024-11-03T00:30[America/New_York]'
    const fields = { hour: 1, offset: '-05:00' }
    const record = ZonedDateTime.fromString(value, Calendar.getAny)
    const actual = ZonedDateTime.withFields(record, fields)
    expect(zonedFields(actual)).toStrictEqual(
      zonedFields(Temporal.ZonedDateTime.from(value).with(fields)),
    )
    expect(actual.epochNanoseconds).toBe(
      Temporal.Instant.from('2024-11-03T06:30Z').epochNanoseconds,
    )
  })

  it.each(['constrain', 'reject'] as const)(
    'handles zoned overflow with %s',
    (overflow) => {
      const value = '2024-01-31T12:00[America/New_York]'
      const record = ZonedDateTime.fromString(value, Calendar.getAny)
      const temporal = Temporal.ZonedDateTime.from(value)
      const fields = { month: 2 }
      if (overflow === 'reject') {
        expectErrorParity(
          () => ZonedDateTime.withFields(record, fields, { overflow }),
          () => temporal.with(fields, { overflow }),
        )
      } else {
        expect(
          zonedFields(ZonedDateTime.withFields(record, fields, { overflow })),
        ).toStrictEqual(zonedFields(temporal.with(fields, { overflow })))
      }
    },
  )
})
