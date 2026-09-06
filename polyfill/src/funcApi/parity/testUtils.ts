import type { Temporal as TemporalSpec } from 'temporal-spec'
import { expect } from 'vitest'
import { Temporal as FullTemporal } from '../../classApi/full/implementation'
import type { DurationFields } from '../../internal/durationFields'

// Use the actual class implementation, even when the host has native Temporal.
// Full calendars let the same oracle cover ISO and non-ISO arithmetic.
export const Temporal = FullTemporal as typeof TemporalSpec

// Compare all ten fields without comparing class/record prototypes or identity.
// The fields are getters, so object spread would miss them; string comparison
// can hide field differences such as 1000 milliseconds versus 1 second.
export function durationFields(value: DurationFields): DurationFields {
  return {
    years: value.years,
    months: value.months,
    weeks: value.weeks,
    days: value.days,
    hours: value.hours,
    minutes: value.minutes,
    seconds: value.seconds,
    milliseconds: value.milliseconds,
    microseconds: value.microseconds,
    nanoseconds: value.nanoseconds,
  }
}

export function zonedFields(value: {
  epochNanoseconds: bigint
  timeZoneId: string
  calendarId: string
}) {
  return {
    epochNanoseconds: value.epochNanoseconds,
    timeZoneId: value.timeZoneId,
    calendarId: value.calendarId,
  }
}

// Explicit calendar annotations force YearMonth/MonthDay serialization to keep
// their reference ISO day/year. Public calendar field getters cannot recover
// those fields, and non-ISO year/month/day getters are not ISO dates.
export function expectPlainParity<R extends { calendarId: string }>(
  record: R,
  temporal: {
    calendarId: string
    toString(options: { calendarName: 'always' }): string
  },
  format: (record: R, options: { calendarName: 'always' }) => string,
): void {
  const options = { calendarName: 'always' } as const
  expect({
    iso: format(record, options).split('[')[0],
    calendarId: record.calendarId,
  }).toStrictEqual({
    iso: temporal.toString(options).split('[')[0],
    calendarId: temporal.calendarId,
  })
}

// Require the specified constructor on both sides: two unexpected failures
// must not make a case intended to succeed look like passing parity.
export function expectErrorParity(
  recordOperation: () => unknown,
  classOperation: () => unknown,
  errorConstructor: typeof RangeError | typeof TypeError = RangeError,
): void {
  for (const operation of [recordOperation, classOperation]) {
    let caught: unknown
    try {
      operation()
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(errorConstructor)
    expect((caught as Error).constructor).toBe(errorConstructor)
  }
}
