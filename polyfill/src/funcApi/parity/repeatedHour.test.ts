import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as PlainYearMonth from '../shim/plainYearMonth'
import * as ZonedDateTime from '../shim/zonedDateTime'
import { Temporal, zonedFields } from './testUtils'

// The later 01:30 of a repeated hour, and the same wall-clock time on days around it
const laterOccurrence = '2024-11-03T01:30:00-05:00[America/New_York]'
const nearbySameOffset = '2024-11-10T01:30:00-05:00[America/New_York]'
const nearbyOtherOffset = '2024-10-27T01:30:00-04:00[America/New_York]'
const values = [laterOccurrence, nearbySameOffset, nearbyOtherOffset]

function zoned(value: string) {
  return ZonedDateTime.fromString(value, Calendar.getAny)
}

describe('shim zoned date transforms in a repeated hour', () => {
  it.each(values)('withDayOfMonth is with({ day }) for %s', (value) => {
    const actual = ZonedDateTime.withDayOfMonth(zoned(value), 3)
    const expected = Temporal.ZonedDateTime.from(value).with({ day: 3 })
    expect(zonedFields(actual)).toStrictEqual(zonedFields(expected))
  })

  it('withDayOfMonth keeps the later occurrence from another day', () => {
    expect(
      ZonedDateTime.toString(
        ZonedDateTime.withDayOfMonth(zoned(nearbySameOffset), 3),
      ),
    ).toBe(laterOccurrence)
  })

  it.each(values)('moves are add() for %s', (value) => {
    const temporal = Temporal.ZonedDateTime.from(value)
    const record = zoned(value)
    for (const [actual, expected] of [
      [ZonedDateTime.addYears(record, 0), temporal.add({ years: 0 })],
      [ZonedDateTime.addMonths(record, 0), temporal.add({ months: 0 })],
      [ZonedDateTime.addWeeks(record, 0), temporal.add({ weeks: 0 })],
      [ZonedDateTime.addDays(record, 0), temporal.add({ days: 0 })],
      [ZonedDateTime.subtractDays(record, 0), temporal.subtract({ days: 0 })],
      [ZonedDateTime.addDays(record, 7), temporal.add({ days: 7 })],
      [ZonedDateTime.subtractDays(record, 7), temporal.subtract({ days: 7 })],
    ] as const) {
      expect(zonedFields(actual)).toStrictEqual(zonedFields(expected))
    }
  })

  it('an ordinal setter that lands on the same date keeps the exact instant', () => {
    const record = zoned(laterOccurrence)
    for (const actual of [
      ZonedDateTime.withDayOfYear(record, ZonedDateTime.dayOfYear(record)),
      ZonedDateTime.withDayOfWeek(record, ZonedDateTime.dayOfWeek(record)),
      ZonedDateTime.withWeekOfYear(record, ZonedDateTime.weekOfYear(record)!),
    ]) {
      expect(ZonedDateTime.toString(actual)).toBe(laterOccurrence)
    }
  })

  it('an ordinal setter that moves the date resolves as compatible', () => {
    expect(
      ZonedDateTime.toString(
        ZonedDateTime.withDayOfYear(
          zoned(nearbySameOffset),
          ZonedDateTime.dayOfYear(zoned(laterOccurrence)),
        ),
      ),
    ).toBe('2024-11-03T01:30:00-04:00[America/New_York]')
  })
})

describe('shim withDayOfMonth arguments', () => {
  const value = '2024-11-10T01:30:00-05:00[America/New_York]'

  it.each([0, -1, 0.5])('rejects day %s like with({ day })', (day) => {
    expect(() => ZonedDateTime.withDayOfMonth(zoned(value), day)).toThrow(
      RangeError,
    )
    expect(() => Temporal.ZonedDateTime.from(value).with({ day })).toThrow(
      RangeError,
    )
    const date = PlainDate.fromString('2024-11-10', Calendar.getAny)
    expect(() => PlainDate.withDayOfMonth(date, day)).toThrow(RangeError)
    const dateTime = PlainDateTime.fromString('2024-11-10', Calendar.getAny)
    expect(() => PlainDateTime.withDayOfMonth(dateTime, day)).toThrow(
      RangeError,
    )
  })

  it('still constrains a day past the end of the month', () => {
    expect(
      ZonedDateTime.toString(ZonedDateTime.withDayOfMonth(zoned(value), 40)),
    ).toBe('2024-11-30T01:30:00-05:00[America/New_York]')
  })
})

describe('resolving a time in a repeat of a few seconds', () => {
  // America/Denver repeated 12:00:00 to 12:00:04 in 1883, going from -06:59:56 to -07:00.
  // The offsets round to the same minute, so only an exact match tells them apart.
  const secondOccurrence = -2717643599500n * 1000000n

  it('ZonedDateTime#round stays on the second occurrence', () => {
    const zdt = new Temporal.ZonedDateTime(secondOccurrence, 'America/Denver')
    const rounded = zdt.round({
      smallestUnit: 'second',
      roundingMode: 'floor',
    })
    expect(rounded.offset).toBe('-07:00')
    expect(rounded.epochMilliseconds).toBe(-2717643600000)
  })

  it('startOfSecond stays on the second occurrence', () => {
    const record = ZonedDateTime.create(secondOccurrence, 'America/Denver')
    expect(ZonedDateTime.startOfSecond(record).epochMilliseconds).toBe(
      -2717643600000,
    )
  })
})

describe('shim PlainYearMonth at the earliest year', () => {
  const earliest = '-271821-04'

  it('startOfYear rejects a start before the earliest PlainYearMonth', () => {
    const record = PlainYearMonth.fromString(earliest, Calendar.getAny)
    expect(() => PlainYearMonth.startOfYear(record)).toThrow(RangeError)
  })

  it('roundToYear rejects a result before the earliest PlainYearMonth', () => {
    const record = PlainYearMonth.fromString(earliest, Calendar.getAny)
    expect(() => PlainYearMonth.roundToYear(record)).toThrow(RangeError)
  })

  it('roundToYear rejects a result after the latest PlainYearMonth', () => {
    const record = PlainYearMonth.fromString('+275760-09', Calendar.getAny)
    expect(() => PlainYearMonth.roundToYear(record)).toThrow(RangeError)
  })

  it('endOfYear is still in range', () => {
    const record = PlainYearMonth.fromString(earliest, Calendar.getAny)
    expect(PlainYearMonth.toString(PlainYearMonth.endOfYear(record))).toBe(
      '-271821-12',
    )
  })
})
