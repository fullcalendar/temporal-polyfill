import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as Instant from '../shim/instant'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as PlainTime from '../shim/plainTime'
import { Temporal, expectErrorParity, zonedFields } from './testUtils'

describe('zoned conversion parity', () => {
  // The 23:30 -> 00:30 gap spans midnight. Start of day is 00:30,
  // but compatible disambiguation maps the missing midnight to 01:00.
  it('PlainDate distinguishes absent plainTime from explicit midnight', () => {
    const value = '1919-03-31'
    const timeZone = 'America/Toronto'
    const record = PlainDate.fromString(value, Calendar.getAny)
    const temporal = Temporal.PlainDate.from(value)
    const start = PlainDate.toZonedDateTime(record, { timeZone })
    const midnight = PlainDate.toZonedDateTime(record, {
      timeZone,
      plainTime: PlainTime.create(),
    })
    expect(zonedFields(start)).toStrictEqual(
      zonedFields(temporal.toZonedDateTime({ timeZone })),
    )
    expect(zonedFields(midnight)).toStrictEqual(
      zonedFields(temporal.toZonedDateTime({ timeZone, plainTime: '00:00' })),
    )
    expect([start.hour, start.minute]).toStrictEqual([0, 30])
    expect([midnight.hour, midnight.minute]).toStrictEqual([1, 0])
    expect(midnight.epochNanoseconds - start.epochNanoseconds).toBe(
      1_800_000_000_000n,
    )
  })

  it.each(['compatible', 'earlier', 'later', 'reject'] as const)(
    'PlainDateTime resolves gaps/repeats with %s',
    (disambiguation) => {
      for (const value of ['2024-03-10T02:30', '2024-11-03T01:30']) {
        const record = PlainDateTime.fromString(value, Calendar.getAny)
        const temporal = Temporal.PlainDateTime.from(value)
        const options = { disambiguation }
        const timeZone = 'America/New_York'
        if (disambiguation === 'reject') {
          expectErrorParity(
            () => PlainDateTime.toZonedDateTime(record, timeZone, options),
            () => temporal.toZonedDateTime(timeZone, options),
          )
        } else {
          expect(
            zonedFields(
              PlainDateTime.toZonedDateTime(record, timeZone, options),
            ),
          ).toStrictEqual(
            zonedFields(temporal.toZonedDateTime(timeZone, options)),
          )
        }
      }
    },
  )

  it('rejects invalid zones at each conversion boundary', () => {
    const zone = 'Not/A_Zone'
    expectErrorParity(
      () => PlainDate.toZonedDateTime(PlainDate.create(2024, 1, 1), zone),
      () => new Temporal.PlainDate(2024, 1, 1).toZonedDateTime(zone),
    )
    expectErrorParity(
      () =>
        PlainDateTime.toZonedDateTime(PlainDateTime.create(2024, 1, 1), zone),
      () => new Temporal.PlainDateTime(2024, 1, 1).toZonedDateTime(zone),
    )
    expectErrorParity(
      () => Instant.toZonedDateTimeISO(Instant.create(0n), zone),
      () => new Temporal.Instant(0n).toZonedDateTimeISO(zone),
    )
  })

  it('rejects an invalid disambiguation', () => {
    const options = { disambiguation: 'invalid' as never }
    expectErrorParity(
      () =>
        PlainDateTime.toZonedDateTime(
          PlainDateTime.create(2024, 1, 1),
          'UTC',
          options,
        ),
      () =>
        new Temporal.PlainDateTime(2024, 1, 1).toZonedDateTime('UTC', options),
    )
  })

  it('Instant retains the epoch and uses the ISO calendar', () => {
    const epoch = -123456789n
    expect(
      zonedFields(
        Instant.toZonedDateTimeISO(Instant.create(epoch), 'America/New_York'),
      ),
    ).toStrictEqual(
      zonedFields(
        new Temporal.Instant(epoch).toZonedDateTimeISO('America/New_York'),
      ),
    )
  })
})
