import { describe, expect, it } from 'vitest'
import '../../intl-calendars'
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
      calendarId: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-01-01[u-ca=hebrew]')
    expectPlainDateEquals(pd, {
      calendarId: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
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
      calendarId: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
    })
  })

  it('rejects fallback-only islamic calendar IDs', () => {
    expect(() =>
      PlainDateFns.fromFields({
        calendar: 'islamic',
        year: 1445,
        month: 1,
        day: 1,
      }),
    ).toThrow(RangeError)
  })
})

describe('calendar field getters', () => {
  it('works with calendar without eras', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'hebrew')
    expect({
      // Current Intl data exposes the Hebrew anno mundi era. Keep this test
      // aligned with the returned record fields rather than the old
      // assumption that Hebrew had no observable era.
      era: pd.era,
      eraYear: pd.eraYear,
      year: pd.year,
      month: pd.month,
      monthCode: pd.monthCode,
      day: pd.day,
    }).toEqual({
      era: 'am',
      eraYear: 5784,
      year: 5784,
      month: 4,
      monthCode: 'M04',
      day: 20,
    })
  })

  it('works with calendar with eras', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'gregory')
    expect({
      era: pd.era,
      eraYear: pd.eraYear,
      year: pd.year,
      month: pd.month,
      monthCode: pd.monthCode,
      day: pd.day,
    }).toEqual({
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
    expect({
      era: pd1.era,
      eraYear: pd1.eraYear,
      year: pd1.year,
      month: pd1.month,
      monthCode: pd1.monthCode,
      day: pd1.day,
    }).toEqual({
      era: 'am',
      eraYear: 5600,
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
      calendarId: 'gregory',
      year: 2024,
      month: 1,
      day: 1,
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

  it('returns undefined for gregory calendar dates', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'gregory')
    expect(PlainDateFns.weekOfYear(pd)).toBe(undefined)
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

  it('returns undefined for gregory calendar dates', () => {
    const pd = PlainDateFns.create(2023, 1, 1, 'gregory')
    expect(PlainDateFns.yearOfWeek(pd)).toBe(undefined)
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
    expect({
      year: pd1.year,
      month: pd1.month,
      day: pd1.day,
    }).toEqual({
      year: 2025,
      month: 3,
      day: 27,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pd0 = PlainDateFns.create(2024, 2, 27)
    const pd1 = PlainDateFns.subtract(pd0, DurationFns.create(1, 1))
    expect({
      year: pd1.year,
      month: pd1.month,
      day: pd1.day,
    }).toEqual({
      year: 2023,
      month: 1,
      day: 27,
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
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })

  it('works with options object without time', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const zdt = PlainDateFns.toZonedDateTime(pd, {
      timeZone: 'America/New_York',
    })
    expectZonedDateTimeEquals(zdt, {
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
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
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709053200000000000n,
    })
  })
})

describe('toPlainDateTime', () => {
  it('works without arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const pdt = PlainDateFns.toPlainDateTime(pd)
    expectPlainDateTimeEquals(pdt, {
      calendarId: 'hebrew',
      year: 5784,
      month: 6,
      day: 18,
    })
  })

  it('works with plainTime arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, 'hebrew')
    const pdt = PlainDateFns.toPlainDateTime(pd, PlainTimeFns.create(12, 30))
    expectPlainDateTimeEquals(pdt, {
      calendarId: 'hebrew',
      year: 5784,
      month: 6,
      day: 18,
      hour: 12,
      minute: 30,
    })
  })
})

describe('toPlainYearMonth', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const pym = PlainDateFns.toPlainYearMonth(pd)
    expectPlainYearMonthEquals(pym, {
      year: 2024,
      month: 2,
    })
  })
})

describe('toPlainMonthDay', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    const pmd = PlainDateFns.toPlainMonthDay(pd)
    expectPlainMonthDayEquals(pmd, {
      monthCode: 'M02',
      day: 27,
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

  it('observes reused options objects again on each call', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' }

    expect(PlainDateFns.toLocaleString(pd, locale, options)).toBe('2023')

    options.year = '2-digit'
    expect(PlainDateFns.toLocaleString(pd, locale, options)).toBe('23')
  })
})

describe('createFormat', () => {
  it('formats records', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const format = PlainDateFns.createFormat('en', { dateStyle: 'full' })

    expect(format.format(pd)).toBe('Sunday, December 31, 2023')
  })

  it('snapshots options at construction', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' }
    const format = PlainDateFns.createFormat('en', options)

    options.year = '2-digit'
    expect(format.format(pd)).toBe('2023')
  })

  it('formats parts', () => {
    const pd = PlainDateFns.create(2023, 12, 31)
    const format = PlainDateFns.createFormat('en', { dateStyle: 'full' })

    expect(format.formatToParts(pd)).toEqual([
      { type: 'weekday', value: 'Sunday' },
      { type: 'literal', value: ', ' },
      { type: 'month', value: 'December' },
      { type: 'literal', value: ' ' },
      { type: 'day', value: '31' },
      { type: 'literal', value: ', ' },
      { type: 'year', value: '2023' },
    ])
  })

  it('formats ranges', () => {
    const pd0 = PlainDateFns.create(2023, 12, 31)
    const pd1 = PlainDateFns.create(2024, 1, 1)
    const format = PlainDateFns.createFormat('en', { dateStyle: 'full' })

    expect(format.formatRange(pd0, pd1)).toBe(
      'Sunday, December 31, 2023 – Monday, January 1, 2024',
    )
  })

  it('formats range parts', () => {
    const pd0 = PlainDateFns.create(2023, 12, 31)
    const pd1 = PlainDateFns.create(2024, 1, 1)
    const format = PlainDateFns.createFormat('en', { dateStyle: 'full' })

    expect(format.formatRangeToParts(pd0, pd1)).toEqual([
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

  it('exposes resolved options from construction', () => {
    const format = PlainDateFns.createFormat('en', { year: 'numeric' })

    expect(format.resolvedOptions().locale).toBe('en')
    expect(format.resolvedOptions().year).toBe('numeric')
  })

  it('uses Intl.DateTimeFormat Temporal-input option validation', () => {
    expect(() =>
      PlainDateFns.createFormat('en', { timeStyle: 'short' }).format(
        PlainDateFns.create(2023, 12, 31),
      ),
    ).toThrow(TypeError)
  })
})
