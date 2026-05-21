import { describe, expect, it } from 'vitest'
import { expectPlainDateTimeEquals } from '../shim/testUtils'
import { getCoreCalendar } from './calendar'
import * as PlainDateTimeFns from './plainDateTime'

const describeNative = (globalThis as any).Temporal ? describe : describe.skip

function expectRoundToYearEquals(isoString: string, expected: string) {
  expectPlainDateTimeEquals(
    PlainDateTimeFns.roundToYear(
      PlainDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    PlainDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

function expectRoundToMonthEquals(isoString: string, expected: string) {
  expectPlainDateTimeEquals(
    PlainDateTimeFns.roundToMonth(
      PlainDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    PlainDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

function expectRoundToWeekEquals(isoString: string, expected: string) {
  expectPlainDateTimeEquals(
    PlainDateTimeFns.roundToWeek(
      PlainDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    PlainDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

describeNative('PlainDateTime native non-standard parity cases', () => {
  // Keep these canonical cases aligned with ../shim/plainDateTime.test.ts.
  it('matches canonical coercion and error types', () => {
    const pdt = PlainDateTimeFns.fromString(
      '2024-02-27T12:30:00',
      getCoreCalendar,
    )

    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfYear(pdt, -5),
      PlainDateTimeFns.fromString('2024-01-01T12:30:00', getCoreCalendar),
    )
    expect(() => {
      PlainDateTimeFns.withDayOfYear(pdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withDayOfYear(pdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withDayOfYear(pdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateTimeFns.withDayOfYear(pdt, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfWeek(pdt, -5),
      PlainDateTimeFns.fromString('2024-02-26T12:30:00', getCoreCalendar),
    )
    expect(() => {
      PlainDateTimeFns.withDayOfWeek(pdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withDayOfWeek(pdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withDayOfWeek(pdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateTimeFns.withDayOfWeek(pdt, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectPlainDateTimeEquals(
      PlainDateTimeFns.withWeekOfYear(pdt, -5),
      PlainDateTimeFns.fromString('2024-01-02T12:30:00', getCoreCalendar),
    )
    expect(() => {
      PlainDateTimeFns.withWeekOfYear(pdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withWeekOfYear(pdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateTimeFns.withWeekOfYear(pdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateTimeFns.withWeekOfYear(pdt, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })

  it('matches canonical rounding boundaries', () => {
    expectRoundToYearEquals('2024-01-01T00:00:00', '2024-01-01T00:00:00')
    expectRoundToYearEquals(
      '2024-07-01T23:59:59.999999999',
      '2024-01-01T00:00:00',
    )
    expectRoundToYearEquals('2024-07-02T00:00:00', '2025-01-01T00:00:00')
    expectRoundToYearEquals(
      '2024-07-02T00:00:00.000000001',
      '2025-01-01T00:00:00',
    )

    expectRoundToMonthEquals('2024-04-01T00:00:00', '2024-04-01T00:00:00')
    expectRoundToMonthEquals(
      '2024-04-15T23:59:59.999999999',
      '2024-04-01T00:00:00',
    )
    expectRoundToMonthEquals('2024-04-16T00:00:00', '2024-05-01T00:00:00')
    expectRoundToMonthEquals(
      '2024-04-16T00:00:00.000000001',
      '2024-05-01T00:00:00',
    )

    expectRoundToWeekEquals('2024-03-04T00:00:00', '2024-03-04T00:00:00')
    expectRoundToWeekEquals(
      '2024-03-07T11:59:59.999999999',
      '2024-03-04T00:00:00',
    )
    expectRoundToWeekEquals('2024-03-07T12:00:00', '2024-03-11T00:00:00')
    expectRoundToWeekEquals(
      '2024-03-07T12:00:00.000000001',
      '2024-03-11T00:00:00',
    )
  })
})
