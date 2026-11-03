import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as InstantFns from './instant'
import * as NowFns from './now'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as ZonedDateTimeFns from './zonedDateTime'

// These go through the public exports, so they cover the shim branch and, on a host with
// native Temporal, the native branch too. Both reject a string with a time zone annotation.
// A string with only a Z or an offset is rejected by the shim alone, so isn't covered here.

const notIdentifiers = [
  '2024-10-03T12:00[Asia/Tokyo]',
  '2024-10-03T12:00+09:00[Asia/Tokyo]',
  '12:00[UTC]',
  '2024-10[UTC]',
  '10-03[UTC]',
]
const identifiers = ['UTC', 'asia/tokyo', '+09:00', '+0900', '+09']

const getCalendar = CalendarFns.getBasic
const zonedStr = '2024-01-01T00:00:00+00:00[UTC]'

const routes: [string, (timeZoneId: string) => unknown][] = [
  ['ZonedDateTime.create', (id) => ZonedDateTimeFns.create(0n, id)],
  [
    'ZonedDateTime.withTimeZone',
    (id) =>
      ZonedDateTimeFns.withTimeZone(
        ZonedDateTimeFns.fromString(zonedStr, getCalendar),
        id,
      ),
  ],
  [
    'ZonedDateTime.fromFields',
    (id) =>
      ZonedDateTimeFns.fromFields({
        year: 2024,
        month: 1,
        day: 1,
        timeZone: id,
      }),
  ],
  [
    'Instant.toZonedDateTimeISO',
    (id) =>
      InstantFns.toZonedDateTimeISO(InstantFns.fromEpochMilliseconds(0), id),
  ],
  [
    'Instant.toString',
    (id) =>
      InstantFns.toString(InstantFns.fromEpochMilliseconds(0), {
        timeZone: id,
      }),
  ],
  [
    'PlainDate.toZonedDateTime',
    (id) =>
      PlainDateFns.toZonedDateTime(
        PlainDateFns.fromString('2024-01-01', getCalendar),
        id,
      ),
  ],
  [
    'PlainDate.toZonedDateTime with options',
    (id) =>
      PlainDateFns.toZonedDateTime(
        PlainDateFns.fromString('2024-01-01', getCalendar),
        { timeZone: id },
      ),
  ],
  [
    'PlainDateTime.toZonedDateTime',
    (id) =>
      PlainDateTimeFns.toZonedDateTime(
        PlainDateTimeFns.fromString('2024-01-01', getCalendar),
        id,
      ),
  ],
  ['Now.zonedDateTimeISO', (id) => NowFns.zonedDateTimeISO(id)],
  ['Now.plainDateTimeISO', (id) => NowFns.plainDateTimeISO(id)],
  ['Now.plainDateISO', (id) => NowFns.plainDateISO(id)],
  ['Now.plainTimeISO', (id) => NowFns.plainTimeISO(id)],
]

describe.each(routes)('%s', (_name, route) => {
  it.each(notIdentifiers)('rejects %s', (s) => {
    expect(() => route(s)).toThrow(RangeError)
  })

  it.each(identifiers)('accepts %s', (id) => {
    expect(() => route(id)).not.toThrow()
  })
})

describe('Instant.toString options', () => {
  it('keeps its other options', () => {
    expect(
      InstantFns.toString(
        InstantFns.fromEpochMilliseconds(0),
        Object.create({ fractionalSecondDigits: 2, timeZone: 'UTC' }),
      ),
    ).toBe('1970-01-01T00:00:00.00+00:00')
  })

  it('still rejects bad options', () => {
    expect(() =>
      InstantFns.toString(InstantFns.fromEpochMilliseconds(0), null as any),
    ).toThrow(TypeError)
  })
})

describe('non-string time zones', () => {
  it('are left to fail as usual', () => {
    const record = ZonedDateTimeFns.fromString(zonedStr, getCalendar)
    expect(() => ZonedDateTimeFns.withTimeZone(record, 0 as any)).toThrow(
      TypeError,
    )
  })
})

describe('Now without a time zone', () => {
  it('still uses the current one', () => {
    expect(NowFns.zonedDateTimeISO().timeZoneId).toBe(NowFns.timeZoneId())
    expect(() => NowFns.plainDateISO()).not.toThrow()
  })
})
