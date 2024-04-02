import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
import * as PlainTimeFns from './plainTime'
import {
  expectDurationEquals,
  expectPlainDateEquals,
  expectPlainDateTimeEquals,
  expectPlainMonthDayEquals,
  expectPlainYearMonthEquals,
  expectZonedDateTimeEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'hebrew')
    expectPlainDateEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const pd = PlainDateFns.create(2024, 1, 1)
    expect(PlainDateFns.isInstance(pd)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(PlainDateFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(PlainDateFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-01-01[u-ca=hebrew]')
    expectPlainDateEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
    })
    expectPlainDateEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
    })
  })
})

describe('getFields', () => {
  it('works with calendar without eras', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'hebrew')
    expect(PlainDateFns.getFields(pd)).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 5784,
      month: 4,
      monthCode: 'M04',
      day: 20,
    })
  })

  it('works with calendar with eras', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'gregory')
    expect(PlainDateFns.getFields(pd)).toEqual({
      era: 'ce',
      eraYear: 2024,
      year: 2024,
      month: 1,
      monthCode: 'M01',
      day: 1,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
    })
    const pd1 = PlainDateFns.withFields(pd0, {
      year: 5600,
      month: 3,
    })
    const fields1 = PlainDateFns.getFields(pd1)
    expect(fields1).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 5600,
      month: 3,
      monthCode: 'M03',
      day: 20,
    })
  })
})

describe('withCalendar', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2024, 1, 1, 'hebrew')
    const pd1 = PlainDateFns.withCalendar(pd0, 'gregory')
    expectPlainDateEquals(pd1, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
    })
  })
})

describe('dayOfWeek', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    expect(PlainDateFns.dayOfWeek(pd)).toBe(2)
  })
})

describe('daysInWeek', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    expect(PlainDateFns.daysInWeek(pd)).toBe(7)
  })
})

describe('weekOfYear', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'hebrew')
    expect(PlainDateFns.weekOfYear(pd)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'gregory')
    expect(PlainDateFns.weekOfYear(pd)).toBe(1)
  })

  it('returns correct iso8601 results', () => {
    const pd = PlainDateFns.create(2023, 1, 1)
    expect(PlainDateFns.weekOfYear(pd)).toBe(52)
  })
})

describe('yearOfWeek', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'hebrew')
    expect(PlainDateFns.yearOfWeek(pd)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'gregory')
    expect(PlainDateFns.yearOfWeek(pd)).toBe(2023)
  })

  it('returns correct iso8601 results', () => {
    const pd = PlainDateFns.create(2023, 1, 1)
    expect(PlainDateFns.yearOfWeek(pd)).toBe(2022)
  })
})

describe('dayOfYear', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.dayOfYear(pd)).toBe(58)
  })
})

describe('daysInMonth', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.daysInMonth(pd)).toBe(29)
  })
})

describe('daysInYear', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.daysInYear(pd)).toBe(366)
  })
})

describe('monthsInYear', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    expect(PlainDateFns.monthsInYear(pd)).toBe(13)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    expect(PlainDateFns.inLeapYear(pd)).toBe(true)
  })
})

describe('add', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2024, 2, 27)
    const pd1 = PlainDateFns.add(pd0, DurationFns.create(1, 1))
    expectPlainDateEquals(pd1, {
      isoYear: 2025,
      isoMonth: 3,
      isoDay: 27,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2024, 2, 27)
    const pd1 = PlainDateFns.subtract(pd0, DurationFns.create(1, 1))
    expectPlainDateEquals(pd1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 27,
    })
  })
})

describe('until', () => {
  it('works without options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.until(pd0, pd1)
    expectDurationEquals(d, {
      days: 398,
    })
  })

  it('works with options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.until(pd0, pd1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: 1,
      months: 1,
      days: 2,
    })
  })
})

describe('since', () => {
  it('works without options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.since(pd0, pd1)
    expectDurationEquals(d, {
      days: -398,
    })
  })

  it('works with options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.since(pd0, pd1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: -1,
      months: -1,
      days: -2,
    })
  })
})

describe('equals', () => {
  it('works affirmatively', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 1, 25)
    expect(PlainDateFns.equals(pd0, pd1)).toBe(false)
  })

  it('works negatively', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.equals(pd0, pd1)).toBe(false)
  })
})

describe('compare', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.compare(pd0, pd1)).toBe(-1)
    expect(PlainDateFns.compare(pd1, pd0)).toBe(1)
    expect(PlainDateFns.compare(pd0, pd0)).toBe(0)
  })
})

describe('toZonedDateTime', () => {
  it('works with single timeZone arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const zdt = PlainDateFns.toZonedDateTime(pd, 'America/New_York')
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })

  it('works with options object without time', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const zdt = PlainDateFns.toZonedDateTime(pd, {
      timeZone: 'America/New_York',
    })
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })

  it('works with options object with time', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const zdt = PlainDateFns.toZonedDateTime(pd, {
      timeZone: 'America/New_York',
      plainTime: PlainTimeFns.create(12),
    })
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709053200000000000n,
    })
  })
})

describe('toPlainDateTime', () => {
  it('works without arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const pdt = PlainDateFns.toPlainDateTime(pd)
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
    })
  })

  it('works with plainTime arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const pdt = PlainDateFns.toPlainDateTime(pd, PlainTimeFns.create(12, 30))
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toPlainYearMonth', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const pym = PlainDateFns.toPlainYearMonth(pd)
    expectPlainYearMonthEquals(pym, {
      isoYear: 2024,
      isoMonth: 2,
    })
  })
})

describe('toPlainMonthDay', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const pmd = PlainDateFns.toPlainMonthDay(pd)
    expectPlainMonthDayEquals(pmd, {
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const s = PlainDateFns.toString(pd)
    expect(s).toBe('2024-02-27')
  })

  it('works with options', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const s = PlainDateFns.toString(pd, { calendarName: 'always' })
    expect(s).toBe('2024-02-27[u-ca=iso8601]')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }
    const s = testHotCache(() =>
      PlainDateFns.toLocaleString(pd, locale, options),
    )
    expect(s).toBe('Sunday, December 31, 2023')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }
    const parts = testHotCache(() =>
      PlainDateFns.toLocaleStringParts(pd, locale, options),
    )
    expect(parts).toEqual([
      { type: 'weekday', value: 'Sunday' },
      { type: 'literal', value: ', ' },
      { type: 'month', value: 'December' },
      { type: 'literal', value: ' ' },
      { type: 'day', value: '31' },
      { type: 'literal', value: ', ' },
      { type: 'year', value: '2023' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2023, 12, 31)
    const pd1 = PlainDateFns.create(2024, 1, 1)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }
    const s = testHotCache(() =>
      PlainDateFns.rangeToLocaleString(pd0, pd1, locale, options),
    )
    expect(s).toBe('Sunday, December 31, 2023 – Monday, January 1, 2024')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2023, 12, 31)
    const pd1 = PlainDateFns.create(2024, 1, 1)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }
    const parts = testHotCache(() =>
      PlainDateFns.rangeToLocaleStringParts(pd0, pd1, locale, options),
    )
    expect(parts).toEqual([
      { source: 'startRange', type: 'weekday', value: 'Sunday' },
      { source: 'startRange', type: 'literal', value: ', ' },
      { source: 'startRange', type: 'month', value: 'December' },
      { source: 'startRange', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'day', value: '31' },
      { source: 'startRange', type: 'literal', value: ', ' },
      { source: 'startRange', type: 'year', value: '2023' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'weekday', value: 'Monday' },
      { source: 'endRange', type: 'literal', value: ', ' },
      { source: 'endRange', type: 'month', value: 'January' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'day', value: '1' },
      { source: 'endRange', type: 'literal', value: ', ' },
      { source: 'endRange', type: 'year', value: '2024' },
    ])
  })
})

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, 5),
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
  it('works with ISO calendar', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfMonth(pd, 5),
      PlainDateFns.withFields(pd, { day: 5 }),
    )
  })
})

describe('withDayOfWeek', () => {
  it('works with ISO calendar', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, 4),
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
  it('works with ISO calendar', () => {
    const pd0 = PlainDateFns.fromString(
      '2024-02-27', // weekOfYear:9, yearOfWeek:2024
    )
    const pd1 = PlainDateFns.withWeekOfYear(pd0, 27)
    expectPlainDateEquals(pd1, PlainDateFns.fromString('2024-07-02'))
    expect(PlainDateFns.yearOfWeek(pd1)).toBe(2024)
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
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addYears(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ years: 5 })),
    )
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
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addMonths(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ months: 5 })),
    )
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
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addWeeks(pd, 300),
      PlainDateFns.add(pd, DurationFns.fromFields({ weeks: 300 })),
    )
  })
})

describe('addDays', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.addDays(pd, 300),
      PlainDateFns.add(pd, DurationFns.fromFields({ days: 300 })),
    )
  })
})

// Non-standard: Subtract
// -----------------------------------------------------------------------------

describe('subtractYears', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractYears(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ years: 5 })),
    )
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
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractMonths(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ months: 5 })),
    )
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
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractWeeks(pd, 300),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ weeks: 300 })),
    )
  })
})

describe('subtractDays', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-02-27')
    expectPlainDateEquals(
      PlainDateFns.subtractDays(pd, 300),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ days: 300 })),
    )
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
  it('gives exact result when no options/roundingMode specified, no offset change', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20')
    const pd1 = PlainDateFns.fromString('2026-04-20')
    const years = PlainDateFns.diffYears(pd0, pd1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives exact result when no options/roundingMode specified, offset change', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20')
    const pd1 = PlainDateFns.fromString('2026-01-20')
    const years = PlainDateFns.diffYears(pd0, pd1)
    expect(years).toBeCloseTo(1.504, 3)
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
      roundingIncrement: 1,
    })
    expect(years).toBe(1)
    expect(() => {
      PlainDateFns.diffYears(pd0, pd1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(months).toBe(1)
    expect(() => {
      PlainDateFns.diffMonths(pd0, pd1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(weeks).toBe(1)
    expect(() => {
      PlainDateFns.diffWeeks(pd0, pd1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
  })
})
