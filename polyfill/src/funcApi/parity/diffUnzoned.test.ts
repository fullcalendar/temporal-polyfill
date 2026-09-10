import {
  type RoundingMathOptions,
  type RoundingMode,
  diffDays,
  diffHours,
  diffMicroseconds,
  diffMilliseconds,
  diffMinutes,
  diffMonths,
  diffNanoseconds,
  diffSeconds,
  diffWeeks,
  diffYears,
} from 'temporal-utils'
import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../calendar'
import * as InstantFns from '../instant'
import * as PlainDateFns from '../plainDate'
import * as PlainDateTimeFns from '../plainDateTime'
import * as PlainTimeFns from '../plainTime'
import * as PlainYearMonthFns from '../plainYearMonth'
import { Temporal } from './testUtils'

type DateDiffName = 'years' | 'months' | 'weeks' | 'days'
type TimeDiffName =
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'
  | 'microseconds'
  | 'nanoseconds'
type DiffOptions = RoundingMathOptions | RoundingMode | undefined

interface DiffFunction<T> {
  (value0: T, value1: T, roundingMode?: RoundingMode): number
  (value0: T, value1: T, options: RoundingMathOptions): number
}

const temporalDateDiffs = {
  years: diffYears,
  months: diffMonths,
  weeks: diffWeeks,
  days: diffDays,
}

const plainDateDiffs = {
  years: PlainDateFns.diffYears,
  months: PlainDateFns.diffMonths,
  weeks: PlainDateFns.diffWeeks,
  days: PlainDateFns.diffDays,
}

const plainDateTimeDiffs = {
  years: PlainDateTimeFns.diffYears,
  months: PlainDateTimeFns.diffMonths,
  weeks: PlainDateTimeFns.diffWeeks,
  days: PlainDateTimeFns.diffDays,
}

const plainYearMonthDiffs = {
  years: PlainYearMonthFns.diffYears,
  months: PlainYearMonthFns.diffMonths,
}

const temporalTimeDiffs = {
  hours: diffHours,
  minutes: diffMinutes,
  seconds: diffSeconds,
  milliseconds: diffMilliseconds,
  microseconds: diffMicroseconds,
  nanoseconds: diffNanoseconds,
}

const instantTimeDiffs = {
  hours: InstantFns.diffHours,
  minutes: InstantFns.diffMinutes,
  seconds: InstantFns.diffSeconds,
  milliseconds: InstantFns.diffMilliseconds,
  microseconds: InstantFns.diffMicroseconds,
  nanoseconds: InstantFns.diffNanoseconds,
}

function callDiff<T>(
  diff: DiffFunction<T>,
  value0: T,
  value1: T,
  options: DiffOptions,
): number {
  return typeof options === 'object'
    ? diff(value0, value1, options)
    : diff(value0, value1, options)
}

function captureResult(
  callback: () => number,
): { value: number } | { errorName: string } {
  try {
    return { value: callback() }
  } catch (error) {
    return {
      errorName: error instanceof Error ? error.name : typeof error,
    }
  }
}

function expectDiffParity<Record, TemporalValue>(
  recordDiff: DiffFunction<Record>,
  temporalDiff: DiffFunction<TemporalValue>,
  record0: Record,
  record1: Record,
  temporal0: TemporalValue,
  temporal1: TemporalValue,
  options?: DiffOptions,
  expected?: number,
): void {
  const recordResult = captureResult(() =>
    callDiff(recordDiff, record0, record1, options),
  )
  expect(recordResult).toStrictEqual(
    captureResult(() => callDiff(temporalDiff, temporal0, temporal1, options)),
  )

  if (expected !== undefined) {
    expect(recordResult).toStrictEqual({ value: expected })
  }
}

function plainDateRecord(value: Temporal.PlainDate) {
  return PlainDateFns.create(value.year, value.month, value.day)
}

function plainDateTimeRecord(value: Temporal.PlainDateTime) {
  return PlainDateTimeFns.create(
    value.year,
    value.month,
    value.day,
    value.hour,
    value.minute,
    value.second,
    value.millisecond,
    value.microsecond,
    value.nanosecond,
  )
}

describe('PlainDate diff parity', () => {
  interface ParityCase {
    name: string
    unit: DateDiffName
    value0: string
    value1: string
    options?: DiffOptions
    expected?: number
  }

  const cases: ParityCase[] = [
    {
      name: 'constructs a fractional week in the same order',
      unit: 'weeks',
      value0: '2001-02-18',
      value1: '2001-03-15',
    },
    {
      name: 'rounds a backward calendar-unit difference',
      unit: 'months',
      value0: '2004-03-09',
      value1: '2002-01-24',
      options: { roundingIncrement: 3, roundingMode: 'halfExpand' },
    },
    {
      name: 'validates a lower-bound relativeTo date',
      unit: 'years',
      value0: '-271821-04-19',
      value1: '-271821-04-20',
    },
    {
      name: 'rounds a single day down to zero with an increment',
      unit: 'days',
      value0: '-271821-04-19',
      value1: '-271821-04-20',
      options: { roundingIncrement: 2 },
      expected: 0,
    },
    {
      name: 'rounds a single day down to zero weeks with an increment',
      unit: 'weeks',
      value0: '-271821-04-19',
      value1: '-271821-04-20',
      options: { roundingIncrement: 2 },
      expected: 0,
    },
    {
      name: 'truncates whole weeks to a multiple of the increment',
      unit: 'weeks',
      value0: '2024-01-31',
      value1: '2024-02-29',
      options: { roundingIncrement: 3 },
      expected: 3,
    },
    {
      name: 'truncates days to a multiple of the increment near the lower bound',
      unit: 'days',
      value0: '2024-01-31',
      value1: '-271821-04-19',
      options: { roundingIncrement: 5 },
      expected: -100019750,
    },
    {
      name: 'probes an exact month multiple at the upper bound',
      unit: 'months',
      value0: '2024-01-31',
      value1: '+275760-08-31',
      options: 'floor',
    },
    {
      name: 'validates an upper-bound week window',
      unit: 'weeks',
      value0: '+275760-09-12',
      value1: '+275760-09-13',
      options: 'floor',
    },
  ]

  it.each(cases)('$name', ({ unit, value0, value1, options, expected }) => {
    const temporal0 = Temporal.PlainDate.from(value0)
    const temporal1 = Temporal.PlainDate.from(value1)

    expectDiffParity(
      plainDateDiffs[unit],
      temporalDateDiffs[unit],
      plainDateRecord(temporal0),
      plainDateRecord(temporal1),
      temporal0,
      temporal1,
      options,
      expected,
    )
  })

  it.each(['weeks', 'days'] as const)(
    '$s rejects mismatching calendars',
    (unit) => {
      const record0 = PlainDateFns.create(
        2024,
        1,
        1,
        CalendarFns.getBasic('iso8601'),
      )
      const record1 = PlainDateFns.create(
        2024,
        1,
        2,
        CalendarFns.getBasic('gregory'),
      )
      const temporal0 = new Temporal.PlainDate(2024, 1, 1, 'iso8601')
      const temporal1 = new Temporal.PlainDate(2024, 1, 2, 'gregory')

      expectDiffParity(
        plainDateDiffs[unit],
        temporalDateDiffs[unit],
        record0,
        record1,
        temporal0,
        temporal1,
      )
    },
  )

  it('rounds at the requested unit when only an increment is given', () => {
    const temporal0 = Temporal.PlainDate.from('2024-01-01')
    const temporal1 = Temporal.PlainDate.from('2024-01-06')
    const options: RoundingMathOptions = { roundingIncrement: 2 }

    expectDiffParity(
      PlainDateFns.diffYears,
      diffYears,
      plainDateRecord(temporal0),
      plainDateRecord(temporal1),
      temporal0,
      temporal1,
      options,
    )
  })
})

describe('PlainDateTime diff parity', () => {
  interface ParityCase {
    name: string
    unit: DateDiffName
    value0: string
    value1: string
    options?: DiffOptions
    expected?: number
  }

  const cases: ParityCase[] = [
    {
      name: 'includes the time remainder in a month total',
      unit: 'months',
      value0: '1990-08-10T23:48:34.038167799',
      value1: '1990-10-10T21:04:07.121329937',
    },
    {
      name: 'rounds a time-aware month difference',
      unit: 'months',
      value0: '2024-03-31T23:00',
      value1: '2024-01-30T12:00',
      options: { roundingIncrement: 3, roundingMode: 'halfExpand' },
    },
    {
      name: 'constructs a fractional week in the same order',
      unit: 'weeks',
      value0: '1967-01-14T12:30:14.370581404',
      value1: '1967-02-24T05:12:08.285872474',
    },
    {
      name: 'validates a lower-bound relativeTo date',
      unit: 'years',
      value0: '-271821-04-19T00:00:00.000000001',
      value1: '-271821-04-20T23:59:59.999999999',
    },
    {
      name: 'rounds a single day down to zero with an increment',
      unit: 'days',
      value0: '-271821-04-19T00:00:00.000000001',
      value1: '-271821-04-19T00:00:00.000000002',
      options: { roundingIncrement: 10 },
      expected: 0,
    },
    {
      name: 'rounds a single day down to zero weeks with an increment',
      unit: 'weeks',
      value0: '-271821-04-19T00:00:00.000000001',
      value1: '-271821-04-19T00:00:00.000000002',
      options: { roundingIncrement: 10 },
      expected: 0,
    },
    {
      name: 'rounds a near-half day without float drift',
      unit: 'days',
      value0: '2024-01-31T12:00',
      value1: '2023-01-31T00:00:00.000000001',
      options: 'halfExpand',
      expected: -365,
    },
    {
      name: 'totals weeks with the same float construction',
      unit: 'weeks',
      value0: '2024-01-31T12:00',
      value1: '2024-02-29T23:59:59.999999999',
    },
    {
      name: 'validates an upper-bound week window',
      unit: 'weeks',
      value0: '+275760-09-12T00:00',
      value1: '+275760-09-13T23:59:59.999999999',
      options: 'floor',
    },
  ]

  it.each(cases)('$name', ({ unit, value0, value1, options, expected }) => {
    const temporal0 = Temporal.PlainDateTime.from(value0)
    const temporal1 = Temporal.PlainDateTime.from(value1)

    expectDiffParity(
      plainDateTimeDiffs[unit],
      temporalDateDiffs[unit],
      plainDateTimeRecord(temporal0),
      plainDateTimeRecord(temporal1),
      temporal0,
      temporal1,
      options,
      expected,
    )
  })

  it.each(['weeks', 'days'] as const)(
    '$s rejects mismatching calendars',
    (unit) => {
      const record0 = PlainDateTimeFns.create(
        2024,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        CalendarFns.getBasic('iso8601'),
      )
      const record1 = PlainDateTimeFns.create(
        2024,
        1,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        CalendarFns.getBasic('gregory'),
      )
      const temporal0 = new Temporal.PlainDateTime(
        2024,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        'iso8601',
      )
      const temporal1 = new Temporal.PlainDateTime(
        2024,
        1,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        'gregory',
      )

      expectDiffParity(
        plainDateTimeDiffs[unit],
        temporalDateDiffs[unit],
        record0,
        record1,
        temporal0,
        temporal1,
      )
    },
  )

  it('rounds at the requested unit when only an increment is given', () => {
    const temporal0 = Temporal.PlainDateTime.from('2024-01-01T00:00')
    const temporal1 = Temporal.PlainDateTime.from(
      '2024-01-01T00:00:00.000000005',
    )
    const record0 = plainDateTimeRecord(temporal0)
    const record1 = plainDateTimeRecord(temporal1)
    const options: RoundingMathOptions = { roundingIncrement: 2 }

    expectDiffParity(
      plainDateTimeDiffs.months,
      diffMonths,
      record0,
      record1,
      temporal0,
      temporal1,
      options,
    )
    expectDiffParity(
      PlainDateTimeFns.diffHours,
      diffHours,
      record0,
      record1,
      temporal0,
      temporal1,
      options,
    )
  })
})

describe('PlainYearMonth diff parity', () => {
  it.each(['years', 'months'] as const)(
    '$s ignores reference ISO days',
    (unit) => {
      const record0 = PlainYearMonthFns.create(2020, 1, undefined, 1)
      const record1 = PlainYearMonthFns.create(2021, 3, undefined, 28)
      const temporal0 = new Temporal.PlainYearMonth(2020, 1, 'iso8601', 1)
      const temporal1 = new Temporal.PlainYearMonth(2021, 3, 'iso8601', 28)

      expectDiffParity(
        plainYearMonthDiffs[unit],
        temporalDateDiffs[unit],
        record0,
        record1,
        temporal0,
        temporal1,
      )
    },
  )

  it.each(['years', 'months'] as const)(
    '$s distinguishes calendar months that start in the same ISO month',
    (unit) => {
      // Hebrew Adar and Nisan 5785 both begin in ISO March 2025
      const value0 = '2025-03-01[u-ca=hebrew]'
      const value1 = '2025-03-30[u-ca=hebrew]'
      const record0 = PlainYearMonthFns.fromString(value0, CalendarFns.getAny)
      const record1 = PlainYearMonthFns.fromString(value1, CalendarFns.getAny)
      const temporal0 = Temporal.PlainYearMonth.from(value0)
      const temporal1 = Temporal.PlainYearMonth.from(value1)

      expect(temporal0.monthCode).not.toBe(temporal1.monthCode)
      expectDiffParity(
        plainYearMonthDiffs[unit],
        temporalDateDiffs[unit],
        record0,
        record1,
        temporal0,
        temporal1,
        undefined,
        unit === 'months' ? 1 : undefined,
      )
    },
  )

  it('rounds multiple months from month-precision values', () => {
    const record0 = PlainYearMonthFns.create(2020, 1, undefined, 1)
    const record1 = PlainYearMonthFns.create(2020, 2, undefined, 29)
    const temporal0 = new Temporal.PlainYearMonth(2020, 1, 'iso8601', 1)
    const temporal1 = new Temporal.PlainYearMonth(2020, 2, 'iso8601', 29)
    const options: RoundingMathOptions = {
      roundingIncrement: 3,
      roundingMode: 'halfExpand',
    }

    expectDiffParity(
      PlainYearMonthFns.diffMonths,
      diffMonths,
      record0,
      record1,
      temporal0,
      temporal1,
      options,
    )
  })

  it('validates the implicit first day at the lower bound', () => {
    const record0 = PlainYearMonthFns.create(-271821, 4, undefined, 19)
    const record1 = PlainYearMonthFns.create(-271821, 5)
    const temporal0 = new Temporal.PlainYearMonth(-271821, 4, 'iso8601', 19)
    const temporal1 = new Temporal.PlainYearMonth(-271821, 5)

    expectDiffParity(
      PlainYearMonthFns.diffYears,
      diffYears,
      record0,
      record1,
      temporal0,
      temporal1,
      'floor',
    )
  })

  it('does not probe beyond an exact month at the upper bound', () => {
    const record0 = PlainYearMonthFns.create(275760, 8, undefined, 31)
    const record1 = PlainYearMonthFns.create(275760, 9, undefined, 13)
    const temporal0 = new Temporal.PlainYearMonth(275760, 8, 'iso8601', 31)
    const temporal1 = new Temporal.PlainYearMonth(275760, 9, 'iso8601', 13)

    expectDiffParity(
      PlainYearMonthFns.diffMonths,
      diffMonths,
      record0,
      record1,
      temporal0,
      temporal1,
      'floor',
    )
  })

  it('rounds at the requested unit when only an increment is given', () => {
    const record0 = PlainYearMonthFns.create(2024, 1)
    const record1 = PlainYearMonthFns.create(2024, 6)
    const temporal0 = Temporal.PlainYearMonth.from('2024-01')
    const temporal1 = Temporal.PlainYearMonth.from('2024-06')
    const options: RoundingMathOptions = { roundingIncrement: 2 }

    expectDiffParity(
      PlainYearMonthFns.diffYears,
      diffYears,
      record0,
      record1,
      temporal0,
      temporal1,
      options,
    )
  })
})

describe('PlainTime diff parity', () => {
  it('constructs a fractional hour in the same order', () => {
    const temporal0 = Temporal.PlainTime.from('14:23:35.924799773')
    const temporal1 = Temporal.PlainTime.from('14:11:15.964456559')

    expectDiffParity(
      PlainTimeFns.diffHours,
      diffHours,
      PlainTimeFns.create(
        temporal0.hour,
        temporal0.minute,
        temporal0.second,
        temporal0.millisecond,
        temporal0.microsecond,
        temporal0.nanosecond,
      ),
      PlainTimeFns.create(
        temporal1.hour,
        temporal1.minute,
        temporal1.second,
        temporal1.millisecond,
        temporal1.microsecond,
        temporal1.nanosecond,
      ),
      temporal0,
      temporal1,
    )
  })

  it('canonicalizes a rounded negative zero', () => {
    const temporal0 = Temporal.PlainTime.from('14:23:35.924799773')
    const temporal1 = Temporal.PlainTime.from('14:11:15.964456559')

    expectDiffParity(
      PlainTimeFns.diffHours,
      diffHours,
      PlainTimeFns.create(
        temporal0.hour,
        temporal0.minute,
        temporal0.second,
        temporal0.millisecond,
        temporal0.microsecond,
        temporal0.nanosecond,
      ),
      PlainTimeFns.create(
        temporal1.hour,
        temporal1.minute,
        temporal1.second,
        temporal1.millisecond,
        temporal1.microsecond,
        temporal1.nanosecond,
      ),
      temporal0,
      temporal1,
      'ceil',
    )
  })

  it('rounds at the requested unit when only an increment is given', () => {
    const temporal0 = Temporal.PlainTime.from('00:00')
    const temporal1 = Temporal.PlainTime.from('00:00:00.000000005')
    const options: RoundingMathOptions = { roundingIncrement: 2 }

    expectDiffParity(
      PlainTimeFns.diffHours,
      diffHours,
      PlainTimeFns.create(),
      PlainTimeFns.create(0, 0, 0, 0, 0, 5),
      temporal0,
      temporal1,
      options,
    )
  })
})

describe('Instant diff parity', () => {
  it.each(Object.keys(temporalTimeDiffs) as TimeDiffName[])(
    '%s preserves precision across the full Instant range',
    (unit) => {
      const epochNanoseconds0 = -8_640_000_000_000_000_000_000n
      const epochNanoseconds1 = 8_640_000_000_000_000_000_000n
      const temporal0 = new Temporal.Instant(epochNanoseconds0)
      const temporal1 = new Temporal.Instant(epochNanoseconds1)

      expectDiffParity(
        instantTimeDiffs[unit],
        temporalTimeDiffs[unit],
        InstantFns.create(epochNanoseconds0),
        InstantFns.create(epochNanoseconds1),
        temporal0,
        temporal1,
      )
    },
  )

  it('rounds at the requested unit when only an increment is given', () => {
    const epochNanoseconds0 = 0n
    const epochNanoseconds1 = 5n
    const temporal0 = new Temporal.Instant(epochNanoseconds0)
    const temporal1 = new Temporal.Instant(epochNanoseconds1)
    const options: RoundingMathOptions = { roundingIncrement: 2 }

    expectDiffParity(
      InstantFns.diffHours,
      diffHours,
      InstantFns.create(epochNanoseconds0),
      InstantFns.create(epochNanoseconds1),
      temporal0,
      temporal1,
      options,
    )
  })
})
