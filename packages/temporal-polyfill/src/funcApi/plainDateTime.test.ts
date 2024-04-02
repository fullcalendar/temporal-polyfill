import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainTimeFns from './plainTime'
import {
  expectDurationEquals,
  expectPlainDateEquals,
  expectPlainDateTimeEquals,
  expectPlainMonthDayEquals,
  expectPlainTimeEquals,
  expectPlainYearMonthEquals,
  expectZonedDateTimeEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.create(
      2024,
      1,
      1,
      12,
      30,
      0,
      0,
      0,
      1,
      'hebrew',
    )
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
      isoNanosecond: 1,
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const pdt = PlainDateTimeFns.create(2024, 1, 1)
    expect(PlainDateTimeFns.isInstance(pdt)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(PlainDateTimeFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(PlainDateTimeFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('works', () => {
    const pd = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=hebrew]')
    expectPlainDateTimeEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
      hour: 12,
      minute: 30,
    })
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('getFields', () => {
  it('works with calendar with eras', () => {
    const pdt = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.getFields(pdt)).toEqual({
      era: 'ce',
      eraYear: 2024,
      year: 2024,
      month: 1,
      monthCode: 'M01',
      day: 1,
      hour: 12,
      minute: 30,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
      hour: 11,
    })
    const pdt1 = PlainDateTimeFns.withFields(pdt0, {
      year: 5600,
      month: 3,
      hour: 12,
      nanosecond: 5,
    })
    const fields1 = PlainDateTimeFns.getFields(pdt1)
    expect(fields1).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 5600,
      month: 3,
      monthCode: 'M03',
      day: 20,
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 5,
    })
  })
})

describe('withPlainDate', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-01-01T12:30:00')
    const pd = PlainDateFns.create(2009, 6, 1)
    const pdt1 = PlainDateTimeFns.withPlainDate(pdt0, pd)
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2009,
      isoMonth: 6,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('withPlainTime', () => {
  it('works with a time argument', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-01-01T12:30:00')
    const pt = PlainTimeFns.create(3) // 3:00
    const pdt1 = PlainDateTimeFns.withPlainTime(pdt0, pt)
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 3,
    })
  })

  it('works without an argument', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-01-01T12:30:00')
    const pdt1 = PlainDateTimeFns.withPlainTime(pdt0)
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
    })
  })
})

describe('withCalendar', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=hebrew]')
    const pdt1 = PlainDateTimeFns.withCalendar(pdt0, 'gregory')
    expectPlainDateTimeEquals(pdt1, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('dayOfWeek', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.dayOfWeek(pdt)).toBe(2)
  })
})

describe('daysInWeek', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.daysInWeek(pdt)).toBe(7)
  })
})

describe('weekOfYear', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(1)
  })

  it('returns correct iso8601 results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(52)
  })
})

describe('yearOfWeek', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(2023)
  })

  it('returns correct iso8601 results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(2022)
  })
})

describe('dayOfYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.dayOfYear(pdt)).toBe(58)
  })
})

describe('daysInMonth', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.daysInMonth(pdt)).toBe(29)
  })
})

describe('daysInYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.daysInYear(pdt)).toBe(366)
  })
})

describe('monthsInYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.monthsInYear(pdt)).toBe(13)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.inLeapYear(pdt)).toBe(true)
  })
})

describe('add', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const pdt1 = PlainDateTimeFns.add(
      pdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2025,
      isoMonth: 3,
      isoDay: 27,
      isoHour: 16,
      isoMinute: 35,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const pdt1 = PlainDateTimeFns.subtract(
      pdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 27,
      isoHour: 8,
      isoMinute: 25,
    })
  })
})

describe('until', () => {
  it('works without options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.until(pdt0, pdt1)
    expectDurationEquals(d, {
      days: 398,
      hours: 2,
    })
  })

  it('works with options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.until(pdt0, pdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: 1,
      months: 1,
      days: 2,
      hours: 2,
    })
  })
})

describe('since', () => {
  it('works without options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.since(pdt0, pdt1)
    expectDurationEquals(d, {
      days: -398,
      hours: -2,
    })
  })

  it('works with options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.since(pdt0, pdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: -1,
      months: -1,
      days: -2,
      hours: -2,
    })
  })
})

describe('round', () => {
  it('works with single unit arg', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 12)
    const pdt1 = PlainDateTimeFns.round(pdt0, 'day')
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 26,
    })
  })

  it('works with options arg', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 12)
    const pdt1 = PlainDateTimeFns.round(pdt0, {
      smallestUnit: 'day',
    })
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 26,
    })
  })
})

describe('equals', () => {
  it('works affirmatively', () => {
    const pdt = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    expect(PlainDateTimeFns.equals(pdt, pdt)).toBe(true)
  })

  it('works negatively', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12, 45)
    expect(PlainDateTimeFns.equals(pdt0, pdt1)).toBe(false)
  })
})

describe('compare', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12, 45)
    expect(PlainDateTimeFns.compare(pdt0, pdt1)).toBe(-1)
    expect(PlainDateTimeFns.compare(pdt1, pdt0)).toBe(1)
    expect(PlainDateTimeFns.compare(pdt0, pdt0)).toBe(0)
  })
})

describe('toZonedDateTime', () => {
  it('works without disambiguation options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const zdt = PlainDateTimeFns.toZonedDateTime(pdt, 'America/New_York')
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })

  it('works with disambiguation options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const zdt = PlainDateTimeFns.toZonedDateTime(pdt, 'America/New_York', {
      disambiguation: 'later',
    })
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })
})

describe('toPlainDate', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const pd = PlainDateTimeFns.toPlainDate(pdt)
    expectPlainDateEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toPlainYearMonth', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pym = PlainDateTimeFns.toPlainYearMonth(pdt)
    expectPlainYearMonthEquals(pym, {
      isoYear: 2024,
      isoMonth: 2,
    })
  })
})

describe('toPlainMonthDay', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pmd = PlainDateTimeFns.toPlainMonthDay(pdt)
    expectPlainMonthDayEquals(pmd, {
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toPlainTime', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pt = PlainDateTimeFns.toPlainTime(pdt)
    expectPlainTimeEquals(pt, {
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const s = PlainDateTimeFns.toString(pdt)
    expect(s).toBe('2024-02-27T12:30:00')
  })

  it('works with options', () => {
    const pdt = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const s = PlainDateTimeFns.toString(pdt, {
      calendarName: 'always',
      fractionalSecondDigits: 2,
    })
    expect(s).toBe('2024-02-27T12:30:00.00[u-ca=iso8601]')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.create(2023, 12, 31, 12, 30)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
      timeZone: 'America/New_York',
    }
    const s = testHotCache(() =>
      PlainDateTimeFns.toLocaleString(pdt, locale, options),
    )
    expect(s).toBe('Sunday, December 31, 2023 at 12:30:00 PM')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.create(2023, 12, 31, 12, 30)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
      timeZone: 'America/New_York',
    }
    const parts = testHotCache(() =>
      PlainDateTimeFns.toLocaleStringParts(pdt, locale, options),
    )
    expect(parts).toEqual([
      { type: 'weekday', value: 'Sunday' },
      { type: 'literal', value: ', ' },
      { type: 'month', value: 'December' },
      { type: 'literal', value: ' ' },
      { type: 'day', value: '31' },
      { type: 'literal', value: ', ' },
      { type: 'year', value: '2023' },
      { type: 'literal', value: ' at ' },
      { type: 'hour', value: '12' },
      { type: 'literal', value: ':' },
      { type: 'minute', value: '30' },
      { type: 'literal', value: ':' },
      { type: 'second', value: '00' },
      { type: 'literal', value: ' ' },
      { type: 'dayPeriod', value: 'PM' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 12, 31, 12, 30)
    const pdt1 = PlainDateTimeFns.create(2023, 12, 31, 14, 59)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
      timeZone: 'America/New_York',
    }
    const s = testHotCache(() =>
      PlainDateTimeFns.rangeToLocaleString(pdt0, pdt1, locale, options),
    )
    expect(s).toBe('Sunday, December 31, 2023, 12:30:00 PM – 2:59:00 PM')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 12, 31, 12, 30)
    const pdt1 = PlainDateTimeFns.create(2023, 12, 31, 14, 59)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
      timeZone: 'America/New_York',
    }
    const parts = testHotCache(() =>
      PlainDateTimeFns.rangeToLocaleStringParts(pdt0, pdt1, locale, options),
    )
    expect(parts).toEqual([
      { source: 'shared', type: 'weekday', value: 'Sunday' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'shared', type: 'month', value: 'December' },
      { source: 'shared', type: 'literal', value: ' ' },
      { source: 'shared', type: 'day', value: '31' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'shared', type: 'year', value: '2023' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'startRange', type: 'hour', value: '12' },
      { source: 'startRange', type: 'literal', value: ':' },
      { source: 'startRange', type: 'minute', value: '30' },
      { source: 'startRange', type: 'literal', value: ':' },
      { source: 'startRange', type: 'second', value: '00' },
      { source: 'startRange', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'dayPeriod', value: 'PM' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'hour', value: '2' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'minute', value: '59' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'second', value: '00' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'dayPeriod', value: 'PM' },
    ])
  })
})

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
      PlainDateTimeFns.subtractYears(pdt, 5, { overflow: 'constrain' }),
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
      PlainDateTimeFns.subtractMonths(pdt, 1, { overflow: 'constrain' }),
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
  it('gives exact result when no options/roundingMode specified, no offset change', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2026-04-20T12:30:00')
    const years = PlainDateTimeFns.diffYears(pdt0, pdt1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives exact result when no options/roundingMode specified, offset change', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-07-20T12:30:00')
    const pdt1 = PlainDateTimeFns.fromString('2026-01-20T12:30:00')
    const years = PlainDateTimeFns.diffYears(pdt0, pdt1)
    expect(years).toBeCloseTo(1.504, 3)
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
      roundingIncrement: 1,
    })
    expect(years).toBe(1)
    expect(() => {
      PlainDateTimeFns.diffYears(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(months).toBe(1)
    expect(() => {
      PlainDateTimeFns.diffMonths(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(weeks).toBe(1)
    expect(() => {
      PlainDateTimeFns.diffWeeks(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(days).toBe(10)
    expect(() => {
      PlainDateTimeFns.diffDays(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
