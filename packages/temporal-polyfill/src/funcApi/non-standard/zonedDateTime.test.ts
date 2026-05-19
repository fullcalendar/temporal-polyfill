import { describe, expect, it } from 'vitest'
import '../../intl-calendars'
import * as DurationFns from './duration'
import { expectZonedDateTimeEquals } from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdtExp = ZonedDateTimeFns.fromString(
      '2024-01-05T12:30:00[America/New_York]',
    )

    const zdt1 = ZonedDateTimeFns.withDayOfYear(zdt0, 5)
    expectZonedDateTimeEquals(zdt1, zdtExp)

    // coerce...
    const zdt2 = ZonedDateTimeFns.withDayOfYear(zdt0, '5.5' as any)
    expectZonedDateTimeEquals(zdt2, zdtExp)
  })

  it('works with non-ISO calendar', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    const zdtExp = ZonedDateTimeFns.fromString(
      '2023-09-20T12:30:00-04:00[America/New_York][u-ca=hebrew]',
    )

    const zdt1 = ZonedDateTimeFns.withDayOfYear(zdt0, 5)
    expectZonedDateTimeEquals(zdt1, zdtExp)

    // coerce...
    const zdt2 = ZonedDateTimeFns.withDayOfYear(zdt0, '5.5' as any)
    expectZonedDateTimeEquals(zdt2, zdtExp)
  })
})

describe('withDayOfMonth', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.withDayOfMonth(zdt, 5),
      ZonedDateTimeFns.withFields(zdt, { day: 5 }),
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.withDayOfMonth(zdt, '5.5' as any),
      ZonedDateTimeFns.withFields(zdt, { day: 5 }),
    )
  })
})

describe('withDayOfWeek', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdtExp = ZonedDateTimeFns.fromString(
      '2024-02-29T12:30:00[America/New_York]',
    )

    const zdt1 = ZonedDateTimeFns.withDayOfWeek(zdt0, 4)
    expectZonedDateTimeEquals(zdt1, zdtExp)

    // coerce...
    const zdt2 = ZonedDateTimeFns.withDayOfWeek(zdt0, '4.5' as any)
    expectZonedDateTimeEquals(zdt2, zdtExp)
  })

  it('works with non-ISO calendar', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    const zdtExp = {
      // 2024-02-29T12:30:00[America/New_York][u-ca=hebrew]
      epochNanoseconds: 1709227800000000000n,
      timeZoneId: 'America/New_York',
      calendarId: 'hebrew',
    }

    const zdt1 = ZonedDateTimeFns.withDayOfWeek(zdt0, 4)
    expectZonedDateTimeEquals(zdt1, zdtExp)

    // coerce...
    const zdt2 = ZonedDateTimeFns.withDayOfWeek(zdt0, '4.5' as any)
    expectZonedDateTimeEquals(zdt2, zdtExp)
  })
})

describe('withWeekOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]', // weekOfYear:9, yearOfWeek:2024
    )
    const zdtExp = ZonedDateTimeFns.fromString(
      '2024-07-02T12:30:00-04:00[America/New_York]',
    )
    const yearExp = 2024

    const zdt1 = ZonedDateTimeFns.withWeekOfYear(zdt0, 27)
    expectZonedDateTimeEquals(zdt1, zdtExp)
    expect(ZonedDateTimeFns.yearOfWeek(zdt1)).toBe(yearExp)

    // coerce...
    const zdt2 = ZonedDateTimeFns.withWeekOfYear(zdt0, '27.5' as any)
    expectZonedDateTimeEquals(zdt2, zdtExp)
    expect(ZonedDateTimeFns.yearOfWeek(zdt2)).toBe(yearExp)
  })

  it('errors on calendars that do not support week numbers', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expect(() => {
      ZonedDateTimeFns.withWeekOfYear(zdt, 27)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Add
// -----------------------------------------------------------------------------

describe('addYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addYears(zdt, 5),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      ZonedDateTimeFns.addYears(zdt, '5.5' as any)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-29T12:30:00[America/New_York]', // leap day
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addYears(zdt, 5, { overflow: 'constrain' }),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-29T12:30:00[America/New_York]', // leap day
    )
    expect(() => {
      ZonedDateTimeFns.addYears(zdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addMonths', () => {
  it('works without options (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addMonths(zdt, 5),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      ZonedDateTimeFns.addMonths(zdt, '5.5' as any)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-01-31T12:30:00[America/New_York]', // 31 days
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addMonths(zdt, 1, { overflow: 'constrain' }),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-01-31T12:30:00[America/New_York]', // 31 days
    )
    expect(() => {
      ZonedDateTimeFns.addMonths(zdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addWeeks(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addWeeks(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addDays', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addDays(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addDays(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addHours', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addHours(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ hours: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addHours(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addMinutes', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addMinutes(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ minutes: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addMinutes(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addSeconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addSeconds(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ seconds: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addSeconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addMilliseconds (and throws on non-integers)', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addMilliseconds(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ milliseconds: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addMilliseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addMicroseconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addMicroseconds(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ microseconds: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addMicroseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('addNanoseconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.addNanoseconds(zdt, 300),
      ZonedDateTimeFns.add(zdt, DurationFns.fromFields({ nanoseconds: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.addNanoseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Subtract
// -----------------------------------------------------------------------------

describe('subtractYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractYears(zdt, 5),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractYears(zdt, '5.5' as any)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-29T12:30:00[America/New_York]', // leap day
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractYears(zdt, 5, { overflow: 'constrain' }),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-29T12:30:00[America/New_York]', // leap day
    )
    expect(() => {
      ZonedDateTimeFns.subtractYears(zdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractMonths', () => {
  it('works without options (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractMonths(zdt, 5),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractMonths(zdt, '5.5' as any)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-03-31T12:30:00[America/New_York]', // 31 days
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractMonths(zdt, 1, { overflow: 'constrain' }),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-03-31T12:30:00[America/New_York]', // 31 days
    )
    expect(() => {
      ZonedDateTimeFns.subtractMonths(zdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractWeeks(zdt, 300),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractWeeks(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractDays', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractDays(zdt, 300),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractDays(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractHours', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractHours(zdt, 300),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ hours: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractHours(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractMinutes', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractMinutes(zdt, 300),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ minutes: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractMinutes(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractSeconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractSeconds(zdt, 300),
      ZonedDateTimeFns.subtract(zdt, DurationFns.fromFields({ seconds: 300 })),
    )
    expect(() => {
      ZonedDateTimeFns.subtractSeconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractMilliseconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractMilliseconds(zdt, 300),
      ZonedDateTimeFns.subtract(
        zdt,
        DurationFns.fromFields({ milliseconds: 300 }),
      ),
    )
    expect(() => {
      ZonedDateTimeFns.subtractMilliseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractMicroseconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractMicroseconds(zdt, 300),
      ZonedDateTimeFns.subtract(
        zdt,
        DurationFns.fromFields({ microseconds: 300 }),
      ),
    )
    expect(() => {
      ZonedDateTimeFns.subtractMicroseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

describe('subtractNanoseconds', () => {
  it('works (and throws on non-integers)', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.subtractNanoseconds(zdt, 300),
      ZonedDateTimeFns.subtract(
        zdt,
        DurationFns.fromFields({ nanoseconds: 300 }),
      ),
    )
    expect(() => {
      ZonedDateTimeFns.subtractNanoseconds(zdt, '300.5' as any)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Round
// -----------------------------------------------------------------------------

describe('roundToYear', () => {
  it('works without options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToYear(zdt),
      ZonedDateTimeFns.fromString('2025-01-01T00:00:00[America/New_York]'),
    )
  })

  it('works with single roundingMode arg', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToYear(zdt, 'floor'),
      ZonedDateTimeFns.fromString('2024-01-01T00:00:00[America/New_York]'),
    )
  })

  it('works with options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToYear(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      ZonedDateTimeFns.fromString('2024-01-01T00:00:00[America/New_York]'),
    )
    expect(() => {
      ZonedDateTimeFns.roundToYear(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToMonth', () => {
  it('works without options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToMonth(zdt),
      ZonedDateTimeFns.fromString('2024-08-01T00:00:00[America/New_York]'),
    )
  })

  it('works with single roundingMode arg', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToMonth(zdt, 'floor'),
      ZonedDateTimeFns.fromString('2024-07-01T00:00:00[America/New_York]'),
    )
  })

  it('works with options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToMonth(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      ZonedDateTimeFns.fromString('2024-07-01T00:00:00[America/New_York]'),
    )
    expect(() => {
      ZonedDateTimeFns.roundToMonth(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToWeek', () => {
  it('works without options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // Saturday
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToWeek(zdt),
      ZonedDateTimeFns.fromString(
        '2024-07-22T00:00:00[America/New_York]', // next Monday
      ),
    )
  })

  it('works with single roundingMode arg', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // Saturday
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToWeek(zdt, 'floor'),
      ZonedDateTimeFns.fromString(
        '2024-07-15T00:00:00[America/New_York]', // this Monday
      ),
    )
  })

  it('works with options', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // Saturday
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.roundToWeek(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      ZonedDateTimeFns.fromString(
        '2024-07-15T00:00:00[America/New_York]', // this Monday
      ),
    )
    expect(() => {
      ZonedDateTimeFns.roundToWeek(zdt, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

describe('startOfYear', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfYear(zdt),
      ZonedDateTimeFns.fromString('2024-01-01T00:00:00[America/New_York]'),
    )
  })
})

describe('startOfMonth', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfMonth(zdt),
      ZonedDateTimeFns.fromString('2024-07-01T00:00:00[America/New_York]'),
    )
  })
})

describe('startOfWeek', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // Saturday
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfWeek(zdt),
      ZonedDateTimeFns.fromString(
        '2024-07-15T00:00:00[America/New_York]', // this Monday
      ),
    )
  })
})

describe('startOfDay', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfDay(zdt),
      ZonedDateTimeFns.fromString('2024-07-20T00:00:00[America/New_York]'),
    )
  })
})

describe('startOfHour', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfHour(zdt),
      ZonedDateTimeFns.fromString('2024-07-20T12:00:00[America/New_York]'),
    )
  })
})

describe('startOfMinute', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:30[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfMinute(zdt),
      ZonedDateTimeFns.fromString('2024-07-20T12:30:00[America/New_York]'),
    )
  })
})

describe('startOfSecond', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.5[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfSecond(zdt),
      ZonedDateTimeFns.fromString('2024-07-20T12:30:44[America/New_York]'),
    )
  })
})

describe('startOfMillisecond', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.4023[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfMillisecond(zdt),
      ZonedDateTimeFns.fromString('2024-07-20T12:30:44.402[America/New_York]'),
    )
  })
})

describe('startOfMicrosecond', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.4000023[America/New_York]',
    )
    expectZonedDateTimeEquals(
      ZonedDateTimeFns.startOfMicrosecond(zdt),
      ZonedDateTimeFns.fromString(
        '2024-07-20T12:30:44.400002[America/New_York]',
      ),
    )
  })
})

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

describe('endOfYear', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfYear(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2025-01-01T00:00:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfMonth', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfMonth(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-08-01T00:00:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfWeek', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // Saturday
    )
    const zdt1 = ZonedDateTimeFns.endOfWeek(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-22T00:00:00[America/New_York]', // next Monday
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfDay', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfDay(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-21T00:00:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfHour', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfHour(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-20T13:00:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfMinute', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:30[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfMinute(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:31:00[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfSecond', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.5[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfSecond(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:45[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfMillisecond', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.4023[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfMillisecond(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.403[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

describe('endOfMicrosecond', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.4000023[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.endOfMicrosecond(zdt0)
    const zdt2 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:44.400003[America/New_York]',
    )
    expectZonedDateTimeEquals(
      zdt1,
      ZonedDateTimeFns.subtractNanoseconds(zdt2, 1),
    )
  })
})

// Non-standard: Diffing
// -----------------------------------------------------------------------------

describe('diffYears', () => {
  it('gives exact result when no options/roundingMode specified, no offset change', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // -04:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2026-04-20T12:30:00[America/New_York]', // -04:00
    )
    const years = ZonedDateTimeFns.diffYears(zdt0, zdt1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives exact result when no options/roundingMode specified, offset change', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // -04:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2026-01-20T12:30:00[America/New_York]', // -05:00
    )
    const years = ZonedDateTimeFns.diffYears(zdt0, zdt1)
    expect(years).toBeCloseTo(1.504, 3)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // -04:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2026-04-20T12:30:00[America/New_York]', // -04:00
    )
    const years = ZonedDateTimeFns.diffYears(zdt0, zdt1, 'floor')
    expect(years).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-07-20T12:30:00[America/New_York]', // -04:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2026-04-20T12:30:00[America/New_York]', // -04:00
    )
    const years = ZonedDateTimeFns.diffYears(zdt0, zdt1, {
      roundingMode: 'floor',
    })
    const yearsInc = ZonedDateTimeFns.diffYears(zdt0, zdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(years).toBe(1)
    expect(yearsInc).toBe(3)
  })
})

describe('diffMonths', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-20T12:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-04-10T12:30:00[America/New_York]', // -04:00
    )
    const months = ZonedDateTimeFns.diffMonths(zdt0, zdt1)
    expect(months).toBeCloseTo(1.677)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-20T12:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-04-10T12:30:00[America/New_York]', // -04:00
    )
    const months = ZonedDateTimeFns.diffMonths(zdt0, zdt1, 'floor')
    expect(months).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-20T12:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-04-10T12:30:00[America/New_York]', // -04:00
    )
    const months = ZonedDateTimeFns.diffMonths(zdt0, zdt1, {
      roundingMode: 'floor',
    })
    const monthsInc = ZonedDateTimeFns.diffMonths(zdt0, zdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(months).toBe(1)
    expect(monthsInc).toBe(3)
  })
})

describe('diffWeeks', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-16T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const weeks = ZonedDateTimeFns.diffWeeks(zdt0, zdt1)
    expect(weeks).toBeCloseTo(1.66)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-16T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const weeks = ZonedDateTimeFns.diffWeeks(zdt0, zdt1, 'floor')
    expect(weeks).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-16T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const weeks = ZonedDateTimeFns.diffWeeks(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const weeksInc = ZonedDateTimeFns.diffWeeks(zdt0, zdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(weeks).toBe(1)
    expect(weeksInc).toBe(3)
  })
})

describe('diffDays', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-15T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const days = ZonedDateTimeFns.diffDays(zdt0, zdt1)
    expect(days).toBe(10.625)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-15T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const days = ZonedDateTimeFns.diffDays(zdt0, zdt1, 'floor')
    expect(days).toBe(10)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-05T00:30:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-15T15:30:00[America/New_York]', // -04:00 (not affected!)
    )
    const days = ZonedDateTimeFns.diffDays(zdt0, zdt1, {
      roundingMode: 'floor',
    })
    const daysInc = ZonedDateTimeFns.diffDays(zdt0, zdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 7,
    })
    expect(days).toBe(10)
    expect(daysInc).toBe(14)
  })
})

describe('diffHours', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-09T22:00:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-10T04:30:00[America/New_York]', // -04:00 (looses one hour)
    )
    const hours = ZonedDateTimeFns.diffHours(zdt0, zdt1)
    expect(hours).toBe(5.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-09T22:00:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-10T04:30:00[America/New_York]', // -04:00 (looses one hour)
    )
    const hours = ZonedDateTimeFns.diffHours(zdt0, zdt1, 'floor')
    expect(hours).toBe(5)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-09T22:00:00[America/New_York]', // -05:00
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-10T04:30:00[America/New_York]', // -04:00 (looses one hour)
    )
    const hours = ZonedDateTimeFns.diffHours(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const hoursEven = ZonedDateTimeFns.diffHours(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(hours).toBe(5)
    expect(hoursEven).toBe(4)
  })
})

describe('diffMinutes', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:00:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:31:30[America/New_York]',
    )
    const minutes = ZonedDateTimeFns.diffMinutes(zdt0, zdt1)
    expect(minutes).toBe(31.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:00:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:31:30[America/New_York]',
    )
    const minutes = ZonedDateTimeFns.diffMinutes(zdt0, zdt1, 'floor')
    expect(minutes).toBe(31)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:00:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:31:30[America/New_York]',
    )
    const minutes = ZonedDateTimeFns.diffMinutes(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const minutesEven = ZonedDateTimeFns.diffMinutes(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(minutes).toBe(31)
    expect(minutesEven).toBe(30)
  })
})

describe('diffSeconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:31.5[America/New_York]',
    )
    const seconds = ZonedDateTimeFns.diffSeconds(zdt0, zdt1)
    expect(seconds).toBe(11.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:31.1[America/New_York]',
    )
    const seconds = ZonedDateTimeFns.diffSeconds(zdt0, zdt1, 'floor')
    expect(seconds).toBe(11)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:31.1[America/New_York]',
    )
    const seconds = ZonedDateTimeFns.diffSeconds(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const secondsEven = ZonedDateTimeFns.diffSeconds(zdt0, zdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(seconds).toBe(11)
    expect(secondsEven).toBe(10)
  })
})

describe('diffMilliseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:21.6668[America/New_York]',
    )
    const milli = ZonedDateTimeFns.diffMilliseconds(zdt0, zdt1)
    expect(milli).toBe(1666.8)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:21.6667[America/New_York]',
    )
    const milli = ZonedDateTimeFns.diffMilliseconds(zdt0, zdt1, 'halfExpand')
    expect(milli).toBe(1667)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:21.6667[America/New_York]',
    )
    const milli = ZonedDateTimeFns.diffMilliseconds(zdt0, zdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 1,
    })
    const milliEven = ZonedDateTimeFns.diffMilliseconds(zdt0, zdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 2,
    })
    expect(milli).toBe(1667)
    expect(milliEven).toBe(1666)
  })
})

describe('diffMicroseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.0006668[America/New_York]',
    )
    const micro = ZonedDateTimeFns.diffMicroseconds(zdt0, zdt1)
    expect(micro).toBe(666.8)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.0006668[America/New_York]',
    )
    const micro = ZonedDateTimeFns.diffMicroseconds(zdt0, zdt1, 'halfExpand')
    expect(micro).toBe(667)
  })

  it('gives rounded result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.0006668[America/New_York]',
    )
    const micro = ZonedDateTimeFns.diffMicroseconds(zdt0, zdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 1,
    })
    const microEven = ZonedDateTimeFns.diffMicroseconds(zdt0, zdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 2,
    })
    expect(micro).toBe(667)
    expect(microEven).toBe(666)
  })
})

describe('diffNanoseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.000000666[America/New_York]',
    )
    const nano = ZonedDateTimeFns.diffNanoseconds(zdt0, zdt1)
    expect(nano).toBe(666)
  })

  it('parses but ignores single roundingMode arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.000000666[America/New_York]',
    )
    const nano = ZonedDateTimeFns.diffNanoseconds(zdt0, zdt1, 'halfExpand')
    expect(nano).toBe(666)
    expect(() => {
      ZonedDateTimeFns.diffNanoseconds(zdt0, zdt1, 'halfExpanddd' as any)
    }).toThrowError(RangeError)
  })

  it('gives increment-aligned result with options object', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2024-03-20T12:30:20.000000666[America/New_York]',
    )
    const nano = ZonedDateTimeFns.diffNanoseconds(zdt0, zdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 10,
    })
    expect(nano).toBe(670)
  })
})
