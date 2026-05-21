import { describe, expect, it } from 'vitest'
import { expectPlainDateEquals } from '../shim/testUtils'
import * as PlainDateFns from './plainDate'

const describeNative = (globalThis as any).Temporal ? describe : describe.skip

function expectRoundToYearEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToYear(PlainDateFns.fromString(isoString)),
    PlainDateFns.fromString(expected),
  )
}

function expectRoundToMonthEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToMonth(PlainDateFns.fromString(isoString)),
    PlainDateFns.fromString(expected),
  )
}

function expectRoundToWeekEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToWeek(PlainDateFns.fromString(isoString)),
    PlainDateFns.fromString(expected),
  )
}

describeNative('PlainDate native non-standard parity cases', () => {
  // Keep these canonical cases aligned with ../shim/plainDate.test.ts.
  it('matches canonical coercion and error types', () => {
    const pd = PlainDateFns.fromString('2024-02-27')

    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, -5),
      PlainDateFns.fromString('2024-01-01'),
    )
    expect(() => {
      PlainDateFns.withDayOfYear(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, -5),
      PlainDateFns.fromString('2024-02-26'),
    )
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectPlainDateEquals(
      PlainDateFns.withWeekOfYear(pd, -5),
      PlainDateFns.fromString('2024-01-02'),
    )
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })

  it('matches canonical rounding boundaries', () => {
    expectRoundToYearEquals('2024-01-01', '2024-01-01')
    expectRoundToYearEquals('2024-07-01', '2024-01-01')
    expectRoundToYearEquals('2024-07-02', '2025-01-01')
    expectRoundToYearEquals('2024-07-03', '2025-01-01')

    expectRoundToMonthEquals('2024-04-01', '2024-04-01')
    expectRoundToMonthEquals('2024-04-15', '2024-04-01')
    expectRoundToMonthEquals('2024-04-16', '2024-05-01')
    expectRoundToMonthEquals('2024-04-17', '2024-05-01')

    expectRoundToWeekEquals('2024-03-04', '2024-03-04')
    expectRoundToWeekEquals('2024-03-07', '2024-03-04')
    expectRoundToWeekEquals('2024-03-08', '2024-03-11')
    expectRoundToWeekEquals('2024-03-11', '2024-03-11')
  })
})
