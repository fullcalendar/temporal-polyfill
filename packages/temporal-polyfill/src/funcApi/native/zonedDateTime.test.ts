import { describe, expect, it } from 'vitest'
import { expectZonedDateTimeEquals } from '../shim/testUtils'
import { getCoreCalendar } from './calendar'
import * as ZonedDateTimeFns from './zonedDateTime'

const describeNative = (globalThis as any).Temporal ? describe : describe.skip

function expectRoundToYearEquals(isoString: string, expected: string) {
  expectZonedDateTimeEquals(
    ZonedDateTimeFns.roundToYear(
      ZonedDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    ZonedDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

function expectRoundToMonthEquals(isoString: string, expected: string) {
  expectZonedDateTimeEquals(
    ZonedDateTimeFns.roundToMonth(
      ZonedDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    ZonedDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

function expectRoundToWeekEquals(isoString: string, expected: string) {
  expectZonedDateTimeEquals(
    ZonedDateTimeFns.roundToWeek(
      ZonedDateTimeFns.fromString(isoString, getCoreCalendar),
    ),
    ZonedDateTimeFns.fromString(expected, getCoreCalendar),
  )
}

describeNative('ZonedDateTime native non-standard parity cases', () => {
  // Keep these canonical cases aligned with ../shim/zonedDateTime.test.ts.
  it('matches canonical coercion and error types', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
      getCoreCalendar,
    )

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.withDayOfYear(zdt, -5),
      ZonedDateTimeFns.fromString(
        '2024-01-01T12:30:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expect(() => {
      ZonedDateTimeFns.withDayOfYear(zdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfYear(zdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfYear(zdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfYear(zdt, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.withDayOfWeek(zdt, -5),
      ZonedDateTimeFns.fromString(
        '2024-02-26T12:30:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expect(() => {
      ZonedDateTimeFns.withDayOfWeek(zdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfWeek(zdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfWeek(zdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      ZonedDateTimeFns.withDayOfWeek(zdt, 5, 'reject' as any)
    }).toThrowError(TypeError)

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.withWeekOfYear(zdt, -5),
      ZonedDateTimeFns.fromString(
        '2024-01-02T12:30:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expect(() => {
      ZonedDateTimeFns.withWeekOfYear(zdt, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withWeekOfYear(zdt, Infinity as any, {
        overflow: 'reject',
      })
    }).toThrowError(RangeError)
    expect(() => {
      ZonedDateTimeFns.withWeekOfYear(zdt, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      ZonedDateTimeFns.withWeekOfYear(zdt, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })

  it('matches canonical DST movement and sub-day alignment behavior', () => {
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addWeeks(
        ZonedDateTimeFns.fromString(
          '2024-03-03T12:00:00[America/New_York]',
          getCoreCalendar,
        ),
        1,
      ),
      ZonedDateTimeFns.fromString(
        '2024-03-10T12:00:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addWeeks(
        ZonedDateTimeFns.fromString(
          '2024-10-27T12:00:00[America/New_York]',
          getCoreCalendar,
        ),
        1,
      ),
      ZonedDateTimeFns.fromString(
        '2024-11-03T12:00:00[America/New_York]',
        getCoreCalendar,
      ),
    )

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addNanoseconds(
        ZonedDateTimeFns.fromString(
          '2024-03-10T01:59:59.999999999-05:00[America/New_York]',
          getCoreCalendar,
        ),
        1,
      ),
      ZonedDateTimeFns.fromString(
        '2024-03-10T03:00:00-04:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addNanoseconds(
        ZonedDateTimeFns.fromString(
          '2024-11-03T01:59:59.999999999-04:00[America/New_York]',
          getCoreCalendar,
        ),
        1,
      ),
      ZonedDateTimeFns.fromString(
        '2024-11-03T01:00:00-05:00[America/New_York]',
        getCoreCalendar,
      ),
    )

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfHour(
        ZonedDateTimeFns.fromString(
          '2024-11-03T01:30:00-05:00[America/New_York]',
          getCoreCalendar,
        ),
      ),
      ZonedDateTimeFns.fromString(
        '2024-11-03T01:00:00-05:00[America/New_York]',
        getCoreCalendar,
      ),
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.endOfHour(
        ZonedDateTimeFns.fromString(
          '2024-03-10T01:30:00-05:00[America/New_York]',
          getCoreCalendar,
        ),
      ),
      ZonedDateTimeFns.fromString(
        '2024-03-10T01:59:59.999999999-05:00[America/New_York]',
        getCoreCalendar,
      ),
    )
  })

  it('matches canonical large-unit boundaries when midnight is skipped', () => {
    // Keep these cases aligned with ../shim/zonedDateTime.test.ts.
    const skippedMidnight = ZonedDateTimeFns.fromString(
      '2009-06-01T01:00:00[Africa/Casablanca]',
      getCoreCalendar,
    )

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfMonth(
        ZonedDateTimeFns.fromString(
          '2009-06-15T12:30:00[Africa/Casablanca]',
          getCoreCalendar,
        ),
      ),
      skippedMidnight,
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfWeek(
        ZonedDateTimeFns.fromString(
          '2009-06-03T12:30:00[Africa/Casablanca]',
          getCoreCalendar,
        ),
      ),
      skippedMidnight,
    )

    expectZonedDateTimeEquals(
      ZonedDateTimeFns.endOfMonth(
        ZonedDateTimeFns.fromString(
          '2009-05-15T12:30:00[Africa/Casablanca]',
          getCoreCalendar,
        ),
      ),
      ZonedDateTimeFns.subtractNanoseconds(skippedMidnight, 1),
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.endOfWeek(
        ZonedDateTimeFns.fromString(
          '2009-05-30T12:30:00[Africa/Casablanca]',
          getCoreCalendar,
        ),
      ),
      ZonedDateTimeFns.subtractNanoseconds(skippedMidnight, 1),
    )
  })

  it('matches canonical rounding boundaries across DST', () => {
    expectRoundToYearEquals(
      '2024-01-01T00:00:00[America/New_York]',
      '2024-01-01T00:00:00[America/New_York]',
    )
    expectRoundToYearEquals(
      '2024-07-02T00:59:59.999999999[America/New_York]',
      '2024-01-01T00:00:00[America/New_York]',
    )
    expectRoundToYearEquals(
      '2024-07-02T01:00:00[America/New_York]',
      '2025-01-01T00:00:00[America/New_York]',
    )
    expectRoundToYearEquals(
      '2024-07-02T01:00:00.000000001[America/New_York]',
      '2025-01-01T00:00:00[America/New_York]',
    )

    expectRoundToMonthEquals(
      '2024-03-01T00:00:00[America/New_York]',
      '2024-03-01T00:00:00[America/New_York]',
    )
    expectRoundToMonthEquals(
      '2024-03-16T12:29:59.999999999[America/New_York]',
      '2024-03-01T00:00:00[America/New_York]',
    )
    expectRoundToMonthEquals(
      '2024-03-16T12:30:00[America/New_York]',
      '2024-04-01T00:00:00[America/New_York]',
    )
    expectRoundToMonthEquals(
      '2024-03-16T12:30:00.000000001[America/New_York]',
      '2024-04-01T00:00:00[America/New_York]',
    )

    expectRoundToWeekEquals(
      '2024-03-04T00:00:00[America/New_York]',
      '2024-03-04T00:00:00[America/New_York]',
    )
    expectRoundToWeekEquals(
      '2024-03-07T11:29:59.999999999[America/New_York]',
      '2024-03-04T00:00:00[America/New_York]',
    )
    expectRoundToWeekEquals(
      '2024-03-07T11:30:00[America/New_York]',
      '2024-03-11T00:00:00[America/New_York]',
    )
    expectRoundToWeekEquals(
      '2024-03-07T11:30:00.000000001[America/New_York]',
      '2024-03-11T00:00:00[America/New_York]',
    )
  })
})
