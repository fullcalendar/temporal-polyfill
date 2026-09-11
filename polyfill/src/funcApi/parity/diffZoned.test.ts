import {
  type RoundingMathOptions,
  type RoundingMode,
  diffDays,
  diffMonths,
  diffWeeks,
  diffYears,
} from 'temporal-utils'
import { describe, expect, it } from 'vitest'
import { Temporal } from '../../classApi/basic/implementation'
import * as CalendarFns from '../calendar'
import { itSkipNative } from '../testUtils'
import * as ZonedDateTimeFns from '../zonedDateTime'

type DiffName = 'years' | 'months' | 'weeks' | 'days'
type DiffOptions = RoundingMathOptions | RoundingMode | undefined

const recordDiffs = {
  years: ZonedDateTimeFns.diffYears,
  months: ZonedDateTimeFns.diffMonths,
  weeks: ZonedDateTimeFns.diffWeeks,
  days: ZonedDateTimeFns.diffDays,
}

const temporalDiffs = {
  years: diffYears,
  months: diffMonths,
  weeks: diffWeeks,
  days: diffDays,
}

interface DiffParityCase {
  name: string
  unit: DiffName
  instant0: string
  instant1: string
  timeZone?: string
  options?: DiffOptions
  skipNative?: boolean
}

interface DiffFunction<T> {
  (value0: T, value1: T, roundingMode?: RoundingMode): number
  (value0: T, value1: T, options: RoundingMathOptions): number
}

const diffParityCases: DiffParityCase[] = [
  {
    name: 'tiny backward difference in years',
    unit: 'years',
    instant0: '2011-12-30T00:00:00Z',
    instant1: '2011-12-29T23:59:59.999Z',
  },
  {
    name: 'tiny backward difference in months',
    unit: 'months',
    instant0: '2011-12-30T00:00:00Z',
    instant1: '2011-12-29T23:59:59.999Z',
  },
  {
    name: 'fractional week before a spring-forward transition',
    unit: 'weeks',
    instant0: '2024-03-10T00:00:00Z',
    instant1: '2024-03-10T00:00:00.001Z',
    timeZone: 'America/New_York',
  },
  {
    name: 'fractional day before a spring-forward transition',
    unit: 'days',
    instant0: '2024-03-10T00:00:00Z',
    instant1: '2024-03-10T00:00:00.001Z',
    timeZone: 'America/New_York',
  },
  {
    name: 'backward fractional week after a spring-forward transition',
    unit: 'weeks',
    instant0: '2024-03-11T00:00:00Z',
    instant1: '2024-03-10T15:00:00Z',
    timeZone: 'America/New_York',
  },
  {
    name: 'backward fractional day after a spring-forward transition',
    unit: 'days',
    instant0: '2024-03-11T00:00:00Z',
    instant1: '2024-03-10T15:00:00Z',
    timeZone: 'America/New_York',
  },
  {
    name: 'fractional day before a fall-back transition',
    unit: 'days',
    instant0: '2024-11-03T00:00:00Z',
    instant1: '2024-11-03T00:00:00.001Z',
    timeZone: 'America/New_York',
  },
  ...(['floor', 'ceil', 'trunc', 'expand'] as const).map(
    (roundingMode): DiffParityCase => ({
      name: `backward month with ${roundingMode} rounding`,
      unit: 'months',
      instant0: '2024-11-02T00:00:00Z',
      instant1: '2024-11-01T15:00:00Z',
      options: roundingMode,
      skipNative: roundingMode === 'ceil' || roundingMode === 'trunc',
    }),
  ),
  {
    name: 'backward hour across a repeated wall-clock time, floored to a year',
    unit: 'years',
    instant0: '2024-11-03T06:30:00Z',
    instant1: '2024-11-03T05:30:00Z',
    timeZone: 'America/New_York',
    options: 'floor',
    skipNative: true,
  },
  {
    name: 'backward hour across a repeated wall-clock time, totaled in months',
    unit: 'months',
    instant0: '2024-11-03T06:30:00Z',
    instant1: '2024-11-03T05:30:00Z',
    timeZone: 'America/New_York',
    skipNative: true,
  },
  // The origin is the later instance of a repeated wall-clock time, so the
  // exact diff carries a 24-hour time part that re-adds past the endpoint
  ...(['years', 'months', 'weeks', 'days'] as const).map((unit) => ({
    name: `${unit} total from the later instance of a repeated hour`,
    unit,
    instant0: '2024-11-03T06:30:00Z',
    instant1: '2024-11-04T05:30:00Z',
    timeZone: 'America/New_York',
    skipNative: unit !== 'days',
  })),
  {
    name: 'zero total at the upper bound',
    unit: 'years',
    instant0: '+275760-09-13T00:00:00Z',
    instant1: '+275760-09-13T00:00:00Z',
  },
  {
    name: 'lower-bound day rounding with an increment',
    unit: 'days',
    instant0: '-271821-04-20T00:00:00.000000001Z',
    instant1: '-271821-04-20T00:00:00Z',
    options: { roundingIncrement: 2 },
  },
  {
    name: 'backward year with floor rounding near a transition',
    unit: 'years',
    instant0: '2024-03-10T00:00:00Z',
    instant1: '2024-03-09T23:00:00Z',
    timeZone: 'America/New_York',
    options: 'floor',
  },
  {
    name: 'backward fractional day across a skipped date',
    unit: 'days',
    instant0: '2011-12-31T00:00:00Z',
    instant1: '2011-12-30T15:00:00Z',
    timeZone: 'Pacific/Apia',
    skipNative: true,
  },
  ...(['floor', 'ceil', 'trunc', 'expand'] as const).map(
    (roundingMode): DiffParityCase => ({
      name: `backward day across a skipped date with ${roundingMode} rounding`,
      unit: 'days',
      instant0: '2011-12-31T00:00:00Z',
      instant1: '2011-12-30T15:00:00Z',
      timeZone: 'Pacific/Apia',
      options: roundingMode,
      skipNative: true,
    }),
  ),
  {
    name: 'multi-day rounding whose window contains a skipped date',
    unit: 'days',
    instant0: '2011-12-31T12:00:00Z',
    instant1: '2011-12-30T12:00:00Z',
    timeZone: 'Pacific/Apia',
    options: {
      roundingIncrement: 3,
      roundingMode: 'halfExpand',
    },
  },
]

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

function expectDiffParity({
  unit,
  instant0,
  instant1,
  timeZone,
  options,
}: DiffParityCase): void {
  const epochNanoseconds0 = Temporal.Instant.from(instant0).epochNanoseconds
  const epochNanoseconds1 = Temporal.Instant.from(instant1).epochNanoseconds
  const resolvedTimeZone = timeZone || 'UTC'
  const record0 = ZonedDateTimeFns.create(epochNanoseconds0, resolvedTimeZone)
  const record1 = ZonedDateTimeFns.create(epochNanoseconds1, resolvedTimeZone)
  const temporal0 = new Temporal.ZonedDateTime(
    epochNanoseconds0,
    resolvedTimeZone,
  )
  const temporal1 = new Temporal.ZonedDateTime(
    epochNanoseconds1,
    resolvedTimeZone,
  )

  expect(
    captureResult(() => callDiff(recordDiffs[unit], record0, record1, options)),
  ).toStrictEqual(
    captureResult(() =>
      callDiff(temporalDiffs[unit], temporal0, temporal1, options),
    ),
  )
}

const portableDiffParityCases = diffParityCases.filter(
  ({ skipNative }) => !skipNative,
)
const nativeBugDiffParityCases = diffParityCases.filter(
  ({ skipNative }) => skipNative,
)

describe('zoned diff parity', () => {
  it.each(portableDiffParityCases)('$name', expectDiffParity)

  // Node 26 native Temporal has known rounding and transition bugs for these
  // cases. They continue to run against the shim on older Node versions.
  itSkipNative.each(nativeBugDiffParityCases)('$name', expectDiffParity)

  // Node 26 native Temporal rejects different time-zone IDs before observing
  // that the instants are equal. The shim still covers the intended result.
  itSkipNative.each(['years', 'months', 'weeks', 'days'] as const)(
    '$s returns zero for equal instants in different time zones',
    (unit) => {
      const epochNanoseconds = 0n
      const record0 = ZonedDateTimeFns.create(epochNanoseconds, 'UTC')
      const record1 = ZonedDateTimeFns.create(
        epochNanoseconds,
        'America/New_York',
      )
      const temporal0 = new Temporal.ZonedDateTime(epochNanoseconds, 'UTC')
      const temporal1 = new Temporal.ZonedDateTime(
        epochNanoseconds,
        'America/New_York',
      )

      expect(
        captureResult(() => recordDiffs[unit](record0, record1)),
      ).toStrictEqual(
        captureResult(() => temporalDiffs[unit](temporal0, temporal1)),
      )
    },
  )

  it.each(['weeks', 'days'] as const)(
    '$s rejects mismatching calendars',
    (unit) => {
      const epochNanoseconds0 = 0n
      const epochNanoseconds1 = 86_400_000_000_000n
      const record0 = ZonedDateTimeFns.create(
        epochNanoseconds0,
        'UTC',
        CalendarFns.getBasic('iso8601'),
      )
      const record1 = ZonedDateTimeFns.create(
        epochNanoseconds1,
        'UTC',
        CalendarFns.getBasic('gregory'),
      )
      const temporal0 = new Temporal.ZonedDateTime(
        epochNanoseconds0,
        'UTC',
        'iso8601',
      )
      const temporal1 = new Temporal.ZonedDateTime(
        epochNanoseconds1,
        'UTC',
        'gregory',
      )

      expect(
        captureResult(() => recordDiffs[unit](record0, record1)),
      ).toStrictEqual(
        captureResult(() => temporalDiffs[unit](temporal0, temporal1)),
      )
    },
  )

  it('matches a multi-unit rounding increment', () => {
    const epochNanoseconds0 = Temporal.Instant.from(
      '2024-03-05T00:00:00Z',
    ).epochNanoseconds
    const epochNanoseconds1 = Temporal.Instant.from(
      '2024-03-25T00:00:00Z',
    ).epochNanoseconds
    const options: RoundingMathOptions = {
      roundingIncrement: 3,
      roundingMode: 'halfExpand',
    }
    const record0 = ZonedDateTimeFns.create(epochNanoseconds0, 'UTC')
    const record1 = ZonedDateTimeFns.create(epochNanoseconds1, 'UTC')
    const temporal0 = new Temporal.ZonedDateTime(epochNanoseconds0, 'UTC')
    const temporal1 = new Temporal.ZonedDateTime(epochNanoseconds1, 'UTC')

    expect(ZonedDateTimeFns.diffWeeks(record0, record1, options)).toBe(
      diffWeeks(temporal0, temporal1, options),
    )
  })
})
