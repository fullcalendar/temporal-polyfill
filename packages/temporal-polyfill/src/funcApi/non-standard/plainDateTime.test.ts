import { describe, expect, it } from 'vitest'
import '../../intl-calendars'
import * as DurationFns from './duration'
import * as PlainDateTimeFns from './plainDateTime'
import { expectPlainDateTimeEquals } from './testUtils'

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfYear(pdt, 5),
      PlainDateTimeFns.fromString('2024-01-05T12:30:00'),
    )
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfYear(pdt, '5.5' as any),
      PlainDateTimeFns.fromString('2024-01-05T12:30:00'),
    )
  })

  it('works with non-ISO calendar', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfYear(pdt, 5),
      PlainDateTimeFns.fromString('2023-09-20T12:30:00[u-ca=hebrew]'),
    )
  })
})

describe('withDayOfMonth', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfMonth(pdt, 5),
      PlainDateTimeFns.withFields(pdt, { day: 5 }),
    )
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfMonth(pdt, '5.5' as any),
      PlainDateTimeFns.withFields(pdt, { day: 5 }),
    )
  })
})

describe('withDayOfWeek', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfWeek(pdt, 4),
      PlainDateTimeFns.fromString('2024-02-29T12:30:00'),
    )
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfWeek(pdt, '4.5' as any),
      PlainDateTimeFns.fromString('2024-02-29T12:30:00'),
    )
  })

  it('works with non-ISO calendar', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.withDayOfWeek(pdt, 4),
      PlainDateTimeFns.fromString('2024-02-29T12:30:00[u-ca=hebrew]'),
    )
  })
})

describe('withWeekOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    // weekOfYear:9, yearOfWeek:2024
    const pdt0 = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pdExp = PlainDateTimeFns.fromString('2024-07-02T12:30:00')
    const yearExp = 2024

    const pdt1 = PlainDateTimeFns.withWeekOfYear(pdt0, 27)
    expectPlainDateTimeEquals(pdt1, pdExp)
    expect(PlainDateTimeFns.yearOfWeek(pdt1)).toBe(yearExp)

    // coerce...
    const pdt2 = PlainDateTimeFns.withWeekOfYear(pdt0, '27.5' as any)
    expectPlainDateTimeEquals(pdt2, pdExp)
    expect(PlainDateTimeFns.yearOfWeek(pdt2)).toBe(yearExp)
  })

  it('errors on calendars that do not support week numbers', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(() => {
      PlainDateTimeFns.withWeekOfYear(pdt, 27)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Add
// -----------------------------------------------------------------------------

describe('addYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addYears(pdt, 5),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateTimeFns.addYears(pdt, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-29T12:30:00') // leap day
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addYears(pdt, 5, { overflow: 'constrain' }),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-29T12:30:00') // leap day
    expect(() => {
      PlainDateTimeFns.addYears(pdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addMonths', () => {
  it('works without options (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addMonths(pdt, 5),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateTimeFns.addMonths(pdt, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pdt = PlainDateTimeFns.fromString(
      '2024-01-31T12:30:00', // 31 days
    )
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addMonths(pdt, 1, { overflow: 'constrain' }),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pdt = PlainDateTimeFns.fromString(
      '2024-01-31T12:30:00', // 31 days
    )
    expect(() => {
      PlainDateTimeFns.addMonths(pdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addWeeks(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addWeeks(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addDays', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addDays(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addDays(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addHours', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addHours(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ hours: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addHours(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addMinutes', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addMinutes(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ minutes: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addMinutes(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addSeconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addSeconds(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ seconds: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addSeconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addMilliseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addMilliseconds(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ milliseconds: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addMilliseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addMicroseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addMicroseconds(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ microseconds: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addMicroseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addNanoseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.addNanoseconds(pdt, 300),
      PlainDateTimeFns.add(pdt, DurationFns.fromFields({ nanoseconds: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.addNanoseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Subtract
// -----------------------------------------------------------------------------

describe('subtractYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractYears(pdt, 5),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractYears(pdt, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-29T12:30:00') // leap day
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractYears(pdt, 5, {
        overflow: 'constrain',
      }),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-29T12:30:00') // leap day
    expect(() => {
      PlainDateTimeFns.subtractYears(pdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractMonths', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractMonths(pdt, 5),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractMonths(pdt, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pdt = PlainDateTimeFns.fromString(
      '2024-03-31T12:30:00', // 31 days
    )
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractMonths(pdt, 1, {
        overflow: 'constrain',
      }),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pdt = PlainDateTimeFns.fromString(
      '2024-03-31T12:30:00', // 31 days
    )
    expect(() => {
      PlainDateTimeFns.subtractMonths(pdt, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractWeeks(pdt, 300),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractWeeks(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractDays', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractDays(pdt, 300),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractDays(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractHours', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractHours(pdt, 300),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ hours: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractHours(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractMinutes', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractMinutes(pdt, 300),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ minutes: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractMinutes(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractSeconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractSeconds(pdt, 300),
      PlainDateTimeFns.subtract(pdt, DurationFns.fromFields({ seconds: 300 })),
    )
    expect(() => {
      PlainDateTimeFns.subtractSeconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractMilliseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractMilliseconds(pdt, 300),
      PlainDateTimeFns.subtract(
        pdt,
        DurationFns.fromFields({ milliseconds: 300 }),
      ),
    )
    expect(() => {
      PlainDateTimeFns.subtractMilliseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractMicroseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractMicroseconds(pdt, 300),
      PlainDateTimeFns.subtract(
        pdt,
        DurationFns.fromFields({ microseconds: 300 }),
      ),
    )
    expect(() => {
      PlainDateTimeFns.subtractMicroseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractNanoseconds', () => {
  it('works (and throws on non-integers)', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.subtractNanoseconds(pdt, 300),
      PlainDateTimeFns.subtract(
        pdt,
        DurationFns.fromFields({ nanoseconds: 300 }),
      ),
    )
    expect(() => {
      PlainDateTimeFns.subtractNanoseconds(pdt, 300.5)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Round
// -----------------------------------------------------------------------------

describe('roundToYear', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToYear(pdt),
      PlainDateTimeFns.fromString('2025-01-01T00:00:00'),
    )
  })

  it('works with single roundingMode arg', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToYear(pdt, 'floor'),
      PlainDateTimeFns.fromString('2024-01-01T00:00:00'),
    )
  })

  it('works with options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToYear(pdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateTimeFns.fromString('2024-01-01T00:00:00'),
    )
    expect(() => {
      PlainDateTimeFns.roundToYear(pdt, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToMonth', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToMonth(pdt),
      PlainDateTimeFns.fromString('2024-08-01T00:00:00'),
    )
  })

  it('works with single roundingMode arg', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToMonth(pdt, 'floor'),
      PlainDateTimeFns.fromString('2024-07-01T00:00:00'),
    )
  })

  it('works with options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToMonth(pdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateTimeFns.fromString('2024-07-01T00:00:00'),
    )
    expect(() => {
      PlainDateTimeFns.roundToMonth(pdt, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToWeek', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00') // Saturday
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToWeek(pdt),
      PlainDateTimeFns.fromString('2024-07-22T00:00:00'), // next Monday
    )
  })

  it('works with single roundingMode arg', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00') // Saturday
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToWeek(pdt, 'floor'),
      PlainDateTimeFns.fromString('2024-07-15T00:00:00'), // this Monday
    )
  })

  it('works with options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00') // Saturday
    expectPlainDateTimeEquals(
      PlainDateTimeFns.roundToWeek(pdt, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateTimeFns.fromString('2024-07-15T00:00:00'), // this Monday
    )
    expect(() => {
      PlainDateTimeFns.roundToWeek(pdt, {
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
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfYear(pdt),
      PlainDateTimeFns.fromString('2024-01-01T00:00:00'),
    )
  })
})

describe('startOfMonth', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfMonth(pdt),
      PlainDateTimeFns.fromString('2024-07-01T00:00:00'),
    )
  })
})

describe('startOfWeek', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00') // Saturday
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfWeek(pdt),
      PlainDateTimeFns.fromString('2024-07-15T00:00:00'), // this Monday
    )
  })
})

describe('startOfDay', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfDay(pdt),
      PlainDateTimeFns.fromString('2024-07-20T00:00:00'),
    )
  })
})

describe('startOfHour', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfHour(pdt),
      PlainDateTimeFns.fromString('2024-07-20T12:00:00'),
    )
  })
})

describe('startOfMinute', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:30')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfMinute(pdt),
      PlainDateTimeFns.fromString('2024-07-20T12:30:00'),
    )
  })
})

describe('startOfSecond', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:44.5')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfSecond(pdt),
      PlainDateTimeFns.fromString('2024-07-20T12:30:44'),
    )
  })
})

describe('startOfMillisecond', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:44.4023')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfMillisecond(pdt),
      PlainDateTimeFns.fromString('2024-07-20T12:30:44.402'),
    )
  })
})

describe('startOfMicrosecond', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-07-20T12:30:44.4000023')
    expectPlainDateTimeEquals(
      PlainDateTimeFns.startOfMicrosecond(pdt),
      PlainDateTimeFns.fromString('2024-07-20T12:30:44.400002'),
    )
  })
})

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

describe('endOfYear', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    const pdt1 = PlainDateTimeFns.endOfYear(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2025-01-01T00:00:00')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfMonth', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-27T12:30:00')
    const pdt1 = PlainDateTimeFns.endOfMonth(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-08-01T00:00:00')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfWeek', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00') // Saturday
    const pdt1 = PlainDateTimeFns.endOfWeek(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-22T00:00:00') // next Monday
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfDay', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.endOfDay(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-21T00:00:00')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfHour', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.endOfHour(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-20T13:00:00')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfMinute', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:30')
    const pdt1 = PlainDateTimeFns.endOfMinute(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-20T12:31:00')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfSecond', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:44.5')
    const pdt1 = PlainDateTimeFns.endOfSecond(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-20T12:30:45')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfMillisecond', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:44.4023')
    const pdt1 = PlainDateTimeFns.endOfMillisecond(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-20T12:30:44.403')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

describe('endOfMicrosecond', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:44.4000023')
    const pdt1 = PlainDateTimeFns.endOfMicrosecond(pdt0)
    const pdt2 = PlainDateTimeFns.fromString('2024-07-20T12:30:44.400003')
    expectPlainDateTimeEquals(
      pdt1,
      PlainDateTimeFns.subtractNanoseconds(pdt2, 1),
    )
  })
})

// Non-standard: Diffing
// -----------------------------------------------------------------------------

describe('diffYears', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2026-04-20T12:30:00')
    const years = PlainDateTimeFns.diffYears(pdt0, pdt1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2026-04-20T12:30:00')
    const years = PlainDateTimeFns.diffYears(pdt0, pdt1, 'floor')
    expect(years).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2026-04-20T12:30:00')
    const years = PlainDateTimeFns.diffYears(pdt0, pdt1, {
      roundingMode: 'floor',
    })
    const yearsInc = PlainDateTimeFns.diffYears(pdt0, pdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(years).toBe(1)
    expect(yearsInc).toBe(3)
  })
})

describe('diffMonths', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-02-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-04-10T12:30:00')
    const months = PlainDateTimeFns.diffMonths(pdt0, pdt1)
    expect(months).toBeCloseTo(1.677)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-02-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-04-10T12:30:00')
    const months = PlainDateTimeFns.diffMonths(pdt0, pdt1, 'floor')
    expect(months).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-02-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-04-10T12:30:00')
    const months = PlainDateTimeFns.diffMonths(pdt0, pdt1, {
      roundingMode: 'floor',
    })
    const monthsInc = PlainDateTimeFns.diffMonths(pdt0, pdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(months).toBe(1)
    expect(monthsInc).toBe(3)
  })
})

describe('diffWeeks', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-16T15:30:00')
    const weeks = PlainDateTimeFns.diffWeeks(pdt0, pdt1)
    expect(weeks).toBeCloseTo(1.66)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-16T15:30:00')
    const weeks = PlainDateTimeFns.diffWeeks(pdt0, pdt1, 'floor')
    expect(weeks).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-16T15:30:00')
    const weeks = PlainDateTimeFns.diffWeeks(pdt0, pdt1, {
      roundingMode: 'floor',
    })
    const weeksInc = PlainDateTimeFns.diffWeeks(pdt0, pdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(weeks).toBe(1)
    expect(weeksInc).toBe(3)
  })
})

describe('diffDays', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-15T15:30:00')
    const days = PlainDateTimeFns.diffDays(pdt0, pdt1)
    expect(days).toBe(10.625)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-15T15:30:00')
    const days = PlainDateTimeFns.diffDays(pdt0, pdt1, 'floor')
    expect(days).toBe(10)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-05T00:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-15T15:30:00')
    const days = PlainDateTimeFns.diffDays(pdt0, pdt1, {
      roundingMode: 'floor',
    })
    const daysInc = PlainDateTimeFns.diffDays(pdt0, pdt1, {
      roundingMode: 'ceil',
      roundingIncrement: 7,
    })
    expect(days).toBe(10)
    expect(daysInc).toBe(14)
  })
})

describe('diffHours', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-09T22:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-10T03:30:00')
    const hours = PlainDateTimeFns.diffHours(pdt0, pdt1)
    expect(hours).toBe(5.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-09T22:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-10T03:30:00')
    const hours = PlainDateTimeFns.diffHours(pdt0, pdt1, 'floor')
    expect(hours).toBe(5)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-09T22:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-10T03:30:00')
    const hours = PlainDateTimeFns.diffHours(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const hoursEven = PlainDateTimeFns.diffHours(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(hours).toBe(5)
    expect(hoursEven).toBe(4)
  })
})

describe('diffMinutes', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:31:30')
    const minutes = PlainDateTimeFns.diffMinutes(pdt0, pdt1)
    expect(minutes).toBe(31.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:31:30')
    const minutes = PlainDateTimeFns.diffMinutes(pdt0, pdt1, 'floor')
    expect(minutes).toBe(31)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:00:00')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:31:30')
    const minutes = PlainDateTimeFns.diffMinutes(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const minutesEven = PlainDateTimeFns.diffMinutes(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(minutes).toBe(31)
    expect(minutesEven).toBe(30)
  })
})

describe('diffSeconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:31.5')
    const seconds = PlainDateTimeFns.diffSeconds(pdt0, pdt1)
    expect(seconds).toBe(11.5)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:31.1')
    const seconds = PlainDateTimeFns.diffSeconds(pdt0, pdt1, 'floor')
    expect(seconds).toBe(11)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:31.1')
    const seconds = PlainDateTimeFns.diffSeconds(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 1,
    })
    const secondsEven = PlainDateTimeFns.diffSeconds(pdt0, pdt1, {
      roundingMode: 'floor',
      roundingIncrement: 2,
    })
    expect(seconds).toBe(11)
    expect(secondsEven).toBe(10)
  })
})

describe('diffMilliseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:21.6668')
    const milli = PlainDateTimeFns.diffMilliseconds(pdt0, pdt1)
    expect(milli).toBe(1666.8)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:21.6667')
    const milli = PlainDateTimeFns.diffMilliseconds(pdt0, pdt1, 'halfExpand')
    expect(milli).toBe(1667)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:21.6667')
    const milli = PlainDateTimeFns.diffMilliseconds(pdt0, pdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 1,
    })
    const milliEven = PlainDateTimeFns.diffMilliseconds(pdt0, pdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 2,
    })
    expect(milli).toBe(1667)
    expect(milliEven).toBe(1666)
  })
})

describe('diffMicroseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.0006668')
    const micro = PlainDateTimeFns.diffMicroseconds(pdt0, pdt1)
    expect(micro).toBe(666.8)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.0006668')
    const micro = PlainDateTimeFns.diffMicroseconds(pdt0, pdt1, 'halfExpand')
    expect(micro).toBe(667)
  })

  it('gives rounded result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.0006668')
    const micro = PlainDateTimeFns.diffMicroseconds(pdt0, pdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 1,
    })
    const microEven = PlainDateTimeFns.diffMicroseconds(pdt0, pdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 2,
    })
    expect(micro).toBe(667)
    expect(microEven).toBe(666)
  })
})

describe('diffNanoseconds', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.000000666')
    const nano = PlainDateTimeFns.diffNanoseconds(pdt0, pdt1)
    expect(nano).toBe(666)
  })

  it('parses but ignores single roundingMode arg', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.000000666')
    const nano = PlainDateTimeFns.diffNanoseconds(pdt0, pdt1, 'halfExpand')
    expect(nano).toBe(666)
    expect(() => {
      PlainDateTimeFns.diffNanoseconds(pdt0, pdt1, 'halfExpanddd' as any)
    }).toThrowError(RangeError)
  })

  it('gives increment-aligned result with options object', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-03-20T12:30:20')
    const pdt1 = PlainDateTimeFns.fromString('2024-03-20T12:30:20.000000666')
    const nano = PlainDateTimeFns.diffNanoseconds(pdt0, pdt1, {
      roundingMode: 'halfExpand',
      roundingIncrement: 10,
    })
    expect(nano).toBe(670)
  })
})
