import { describe, expect, it } from 'vitest'
import '../../intl-calendars'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
import { expectPlainDateEquals } from './testUtils'

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, 5),
      PlainDateFns.fromString('2024-01-05'),
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, '5.5' as any),
      PlainDateFns.fromString('2024-01-05'),
    )
  })

  it('works with non-ISO calendar', () => {
    const pd = PlainDateFns.fromString('2024-02-27[u-ca=hebrew]')
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, 5),
      PlainDateFns.fromString('2023-09-20[u-ca=hebrew]'),
    )
  })
})

describe('withDayOfMonth', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfMonth(pd, 5),
      PlainDateFns.withFields(pd, { day: 5 }),
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfMonth(pd, '5.5' as any),
      PlainDateFns.withFields(pd, { day: 5 }),
    )
  })
})

describe('withDayOfWeek', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, 4),
      PlainDateFns.fromString('2024-02-29'),
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, '4.5' as any),
      PlainDateFns.fromString('2024-02-29'),
    )
  })

  it('works with non-ISO calendar', () => {
    const pd = PlainDateFns.fromString('2024-02-27[u-ca=hebrew]')
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, 4),
      PlainDateFns.fromString('2024-02-29[u-ca=hebrew]'),
    )
  })
})

describe('withWeekOfYear', () => {
  it('works with ISO calendar (and coercing to integer)', () => {
    // weekOfYear:9, yearOfWeek:2024
    const pd0 = PlainDateFns.fromString('2024-02-27')
    const pdExp = PlainDateFns.fromString('2024-07-02')
    const yearExp = 2024

    const pd1 = PlainDateFns.withWeekOfYear(pd0, 27)
    expectPlainDateEquals(PlainDateFns.withWeekOfYear(pd0, 27), pdExp)
    expect(PlainDateFns.yearOfWeek(pd1)).toBe(yearExp)

    // coerce...
    const pd2 = PlainDateFns.withWeekOfYear(pd0, '27.5' as any)
    expectPlainDateEquals(pd2, pdExp)
    expect(PlainDateFns.yearOfWeek(pd2)).toBe(yearExp)
  })

  it('errors on calendars that do not support week numbers', () => {
    const pd = PlainDateFns.fromString('2024-02-27[u-ca=hebrew]')
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 27)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Add
// -----------------------------------------------------------------------------

describe('addYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addYears(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateFns.addYears(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29') // leap day
    expectPlainDateEquals(
      PlainDateFns.addYears(pd, 5, { overflow: 'constrain' }),
      PlainDateFns.add(pd, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29') // leap day
    expect(() => {
      PlainDateFns.addYears(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addMonths', () => {
  it('works without options (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addMonths(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateFns.addMonths(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-01-31') // 31 days
    expectPlainDateEquals(
      PlainDateFns.addMonths(pd, 1, { overflow: 'constrain' }),
      PlainDateFns.add(pd, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-01-31') // 31 days
    expect(() => {
      PlainDateFns.addMonths(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addWeeks(pd, 300),
      PlainDateFns.add(pd, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      PlainDateFns.addWeeks(pd, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('addDays (and throws on non-integers)', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addDays(pd, 300),
      PlainDateFns.add(pd, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      PlainDateFns.addDays(pd, 300.5)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Subtract
// -----------------------------------------------------------------------------

describe('subtractYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractYears(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateFns.subtractYears(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29') // leap day
    expectPlainDateEquals(
      PlainDateFns.subtractYears(pd, 5, { overflow: 'constrain' }),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString(
      '2024-02-29', // leap day
    )
    expect(() => {
      PlainDateFns.subtractYears(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractMonths', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractMonths(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateFns.subtractMonths(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-03-31') // 31 days
    expectPlainDateEquals(
      PlainDateFns.subtractMonths(pd, 1, { overflow: 'constrain' }),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-03-31') // 31 days
    expect(() => {
      PlainDateFns.subtractMonths(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractWeeks(pd, 300),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ weeks: 300 })),
    )
    expect(() => {
      PlainDateFns.subtractWeeks(pd, 300.5)
    }).toThrowError(RangeError)
  })
})

describe('subtractDays', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractDays(pd, 300),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ days: 300 })),
    )
    expect(() => {
      PlainDateFns.subtractDays(pd, 300.5)
    }).toThrowError(RangeError)
  })
})

// Non-standard: Round
// -----------------------------------------------------------------------------

describe('roundToYear', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd),
      PlainDateFns.fromString('2025-01-01'),
    )
  })

  it('works with single roundingMode arg', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd, 'floor'),
      PlainDateFns.fromString('2024-01-01'),
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-01-01'),
    )
    expect(() => {
      PlainDateFns.roundToYear(pd, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToMonth', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd),
      PlainDateFns.fromString('2024-08-01'),
    )
  })

  it('works with single roundingMode arg', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd, 'floor'),
      PlainDateFns.fromString('2024-07-01'),
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-07-01'),
    )
    expect(() => {
      PlainDateFns.roundToMonth(pd, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })
})

describe('roundToWeek', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-07-20') // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd),
      PlainDateFns.fromString('2024-07-22'), // next Monday
    )
  })

  it('works with single roundingMode arg', () => {
    const pd = PlainDateFns.fromString('2024-07-20') // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd, 'floor'),
      PlainDateFns.fromString('2024-07-15'), // this Monday
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-20') // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-07-15'), // this Monday
    )
    expect(() => {
      PlainDateFns.roundToWeek(pd, {
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
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.startOfYear(pd),
      PlainDateFns.fromString('2024-01-01'),
    )
  })
})

describe('startOfMonth', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-07-27')
    expectPlainDateEquals(
      PlainDateFns.startOfMonth(pd),
      PlainDateFns.fromString('2024-07-01'),
    )
  })
})

describe('startOfWeek', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-07-20') // Saturday
    expectPlainDateEquals(
      PlainDateFns.startOfWeek(pd),
      PlainDateFns.fromString('2024-07-15'), // this Monday
    )
  })
})

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

describe('endOfYear', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-27')
    const pd1 = PlainDateFns.endOfYear(pd0)
    const pd2 = PlainDateFns.fromString('2025-01-01')
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

describe('endOfMonth', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-27')
    const pd1 = PlainDateFns.endOfMonth(pd0)
    const pd2 = PlainDateFns.fromString('2024-08-01')
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

describe('endOfWeek', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20') // Saturday
    const pd1 = PlainDateFns.endOfWeek(pd0)
    const pd2 = PlainDateFns.fromString('2024-07-22') // next Monday
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

// Non-standard: Diffing
// -----------------------------------------------------------------------------

describe('diffYears', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20')
    const pd1 = PlainDateFns.fromString('2026-04-20')
    const years = PlainDateFns.diffYears(pd0, pd1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20')
    const pd1 = PlainDateFns.fromString('2026-04-20')
    const years = PlainDateFns.diffYears(pd0, pd1, 'floor')
    expect(years).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20')
    const pd1 = PlainDateFns.fromString('2026-04-20')
    const years = PlainDateFns.diffYears(pd0, pd1, {
      roundingMode: 'floor',
    })
    const yearsInc = PlainDateFns.diffYears(pd0, pd1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(years).toBe(1)
    expect(yearsInc).toBe(3)
  })
})

describe('diffMonths', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pd0 = PlainDateFns.fromString('2024-02-20')
    const pd1 = PlainDateFns.fromString('2024-04-10')
    const months = PlainDateFns.diffMonths(pd0, pd1)
    expect(months).toBeCloseTo(1.677)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-02-20')
    const pd1 = PlainDateFns.fromString('2024-04-10')
    const months = PlainDateFns.diffMonths(pd0, pd1, 'floor')
    expect(months).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-02-20')
    const pd1 = PlainDateFns.fromString('2024-04-10')
    const months = PlainDateFns.diffMonths(pd0, pd1, {
      roundingMode: 'floor',
    })
    const monthsInc = PlainDateFns.diffMonths(pd0, pd1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(months).toBe(1)
    expect(monthsInc).toBe(3)
  })
})

describe('diffWeeks', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-16')
    const weeks = PlainDateFns.diffWeeks(pd0, pd1)
    expect(weeks).toBeCloseTo(1.571)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-16')
    const weeks = PlainDateFns.diffWeeks(pd0, pd1, 'floor')
    expect(weeks).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-16')
    const weeks = PlainDateFns.diffWeeks(pd0, pd1, {
      roundingMode: 'floor',
    })
    const weeksInc = PlainDateFns.diffWeeks(pd0, pd1, {
      roundingMode: 'ceil',
      roundingIncrement: 3,
    })
    expect(weeks).toBe(1)
    expect(weeksInc).toBe(3)
  })
})

describe('diffDays', () => {
  it('gives integer result when no options/roundingMode specified', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-15')
    const days = PlainDateFns.diffDays(pd0, pd1)
    expect(days).toBe(10)
  })

  it('gives integer result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-15')
    const days = PlainDateFns.diffDays(pd0, pd1, 'floor')
    expect(days).toBe(10)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05')
    const pd1 = PlainDateFns.fromString('2024-03-15')
    const days = PlainDateFns.diffDays(pd0, pd1, {
      roundingMode: 'floor',
    })
    const daysInc = PlainDateFns.diffDays(pd0, pd1, {
      roundingMode: 'ceil',
      roundingIncrement: 7,
    })
    expect(days).toBe(10)
    expect(daysInc).toBe(14)
  })
})
