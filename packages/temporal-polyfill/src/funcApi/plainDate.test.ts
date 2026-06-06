import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
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
  itSkipNative,
  testHotCache,
} from './testUtils'

const gregoryCalendar = CalendarFns.getGregory()
const hebrewCalendar = CalendarFns.getExotic('hebrew')

function expectRoundToYearEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToYear(
      PlainDateFns.fromString(isoString, CalendarFns.getCore),
    ),
    PlainDateFns.fromString(expected, CalendarFns.getCore),
  )
}

function expectRoundToMonthEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToMonth(
      PlainDateFns.fromString(isoString, CalendarFns.getCore),
    ),
    PlainDateFns.fromString(expected, CalendarFns.getCore),
  )
}

function expectRoundToWeekEquals(isoString: string, expected: string) {
  expectPlainDateEquals(
    PlainDateFns.roundToWeek(
      PlainDateFns.fromString(isoString, CalendarFns.getCore),
    ),
    PlainDateFns.fromString(expected, CalendarFns.getCore),
  )
}

describe('create', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 1, 1, hebrewCalendar)
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
    const pd = PlainDateFns.fromString(
      '2024-01-01[u-ca=hebrew]',
      CalendarFns.getExotic,
    )
    expectPlainDateEquals(pd, {
      calendarId: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
    })
  })

  it('requires an explicit resolver for intl calendar strings', () => {
    expect(() =>
      PlainDateFns.fromString('2024-01-01[u-ca=hebrew]', CalendarFns.getCore),
    ).toThrow(RangeError)
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromFields({
      calendar: hebrewCalendar,
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

  // Node 26 native Temporal accepts broad Intl fallback calendar IDs like
  // `islamic`. The shim rejects them because they are not concrete Temporal
  // calendar IDs, so keep this assertion covered by the forced-shim project.
  itSkipNative('rejects fallback-only islamic calendar IDs', () => {
    expect(() => CalendarFns.getExotic('islamic')).toThrow(RangeError)
  })
})

describe('calendar field getters', () => {
  it('works with calendar without eras', () => {
    const pd = PlainDateFns.create(2024, 1, 1, hebrewCalendar)
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
    const pd = PlainDateFns.create(2024, 1, 1, gregoryCalendar)
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
      calendar: hebrewCalendar,
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
    const pd0 = PlainDateFns.create(2024, 1, 1, hebrewCalendar)
    const pd1 = PlainDateFns.withCalendar(pd0, gregoryCalendar)
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
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
    expect(PlainDateFns.dayOfWeek(pd)).toBe(2)
  })
})

describe('daysInWeek', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
    expect(PlainDateFns.daysInWeek(pd)).toBe(7)
  })
})

describe('weekOfYear', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pd = PlainDateFns.create(2023, 1, 1, hebrewCalendar)
    expect(PlainDateFns.weekOfYear(pd)).toBe(undefined)
  })

  it('returns undefined for gregory calendar dates', () => {
    const pd = PlainDateFns.create(2023, 1, 1, gregoryCalendar)
    expect(PlainDateFns.weekOfYear(pd)).toBe(undefined)
  })

  it('returns correct iso8601 results', () => {
    const pd = PlainDateFns.create(2023, 1, 1)
    expect(PlainDateFns.weekOfYear(pd)).toBe(52)
  })
})

describe('yearOfWeek', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pd = PlainDateFns.create(2023, 1, 1, hebrewCalendar)
    expect(PlainDateFns.yearOfWeek(pd)).toBe(undefined)
  })

  it('returns undefined for gregory calendar dates', () => {
    const pd = PlainDateFns.create(2023, 1, 1, gregoryCalendar)
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
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
    expect(PlainDateFns.monthsInYear(pd)).toBe(13)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
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

describe('diff', () => {
  it('works without options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.diff(pd0, pd1)
    expectDurationEquals(d, {
      days: 398,
    })
  })

  it('works with options', () => {
    const pd0 = PlainDateFns.create(2023, 1, 25)
    const pd1 = PlainDateFns.create(2024, 2, 27)
    const d = PlainDateFns.diff(pd0, pd1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: 1,
      months: 1,
      days: 2,
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
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
    const zdt = PlainDateFns.toZonedDateTime(pd, 'America/New_York')
    expectZonedDateTimeEquals(zdt, {
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })

  it('works with options object without time', () => {
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
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
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
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
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
    const pdt = PlainDateFns.toPlainDateTime(pd)
    expectPlainDateTimeEquals(pdt, {
      calendarId: 'hebrew',
      year: 5784,
      month: 6,
      day: 18,
    })
  })

  it('works with plainTime arg', () => {
    const pd = PlainDateFns.create(2024, 2, 27, hebrewCalendar)
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

  it('has a simple no-options variant', () => {
    const pd = PlainDateFns.create(2024, 2, 27)
    expect(PlainDateFns.toSimpleString(pd)).toBe('2024-02-27')
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

    expect(format).toBeInstanceOf(Intl.DateTimeFormat)
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

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, 5),
      PlainDateFns.fromString('2024-01-05', CalendarFns.getCore),
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, '5.5' as any),
      PlainDateFns.fromString('2024-01-05', CalendarFns.getCore),
    )
  })

  // temporal-utils implements this by reading non-ISO fields, then calling
  // native PlainDate#add({ days }). Node 26 throws "Not yet implemented" for
  // that non-ISO add path; forced-shim still verifies the intended behavior.
  itSkipNative('works with non-ISO calendar', () => {
    const pd = PlainDateFns.fromString(
      '2024-02-27[u-ca=hebrew]',
      CalendarFns.getExotic,
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, 5),
      PlainDateFns.fromString('2023-09-20[u-ca=hebrew]', CalendarFns.getExotic),
    )
  })

  it('matches canonical coercion and error types', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)

    expectPlainDateEquals(
      PlainDateFns.withDayOfYear(pd, -5),
      PlainDateFns.fromString('2024-01-01', CalendarFns.getCore),
    )
    expect(() => {
      PlainDateFns.withDayOfYear(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withDayOfYear(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })
})

describe('withDayOfMonth', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, 4),
      PlainDateFns.fromString('2024-02-29', CalendarFns.getCore),
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, '4.5' as any),
      PlainDateFns.fromString('2024-02-29', CalendarFns.getCore),
    )
  })

  // temporal-utils implements this by reading non-ISO fields, then calling
  // native PlainDate#add({ days }). Node 26 throws "Not yet implemented" for
  // that non-ISO add path; forced-shim still verifies the intended behavior.
  itSkipNative('works with non-ISO calendar', () => {
    const pd = PlainDateFns.fromString(
      '2024-02-27[u-ca=hebrew]',
      CalendarFns.getExotic,
    )
    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, 4),
      PlainDateFns.fromString('2024-02-29[u-ca=hebrew]', CalendarFns.getExotic),
    )
  })

  it('matches canonical coercion and error types', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)

    expectPlainDateEquals(
      PlainDateFns.withDayOfWeek(pd, -5),
      PlainDateFns.fromString('2024-02-26', CalendarFns.getCore),
    )
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withDayOfWeek(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })
})

describe('withWeekOfYear', () => {
  it('works with ISO calendar (and coercing to integer)', () => {
    // weekOfYear:9, yearOfWeek:2024
    const pd0 = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    const pdExp = PlainDateFns.fromString('2024-07-02', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString(
      '2024-02-27[u-ca=hebrew]',
      CalendarFns.getExotic,
    )
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 27)
    }).toThrowError(RangeError)
  })

  it('matches canonical coercion and error types', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)

    expectPlainDateEquals(
      PlainDateFns.withWeekOfYear(pd, -5),
      PlainDateFns.fromString('2024-01-02', CalendarFns.getCore),
    )
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, -Infinity as any)
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, Infinity as any, { overflow: 'reject' })
    }).toThrowError(RangeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 5n as any)
    }).toThrowError(TypeError)
    expect(() => {
      PlainDateFns.withWeekOfYear(pd, 5, 'reject' as any)
    }).toThrowError(TypeError)
  })
})

// Non-standard: Add
// -----------------------------------------------------------------------------

describe('addYears', () => {
  it('works without options (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.addYears(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateFns.addYears(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29', CalendarFns.getCore) // leap day
    expectPlainDateEquals(
      PlainDateFns.addYears(pd, 5, { overflow: 'constrain' }),
      PlainDateFns.add(pd, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29', CalendarFns.getCore) // leap day
    expect(() => {
      PlainDateFns.addYears(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addMonths', () => {
  it('works without options (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.addMonths(pd, 5),
      PlainDateFns.add(pd, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateFns.addMonths(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-01-31', CalendarFns.getCore) // 31 days
    expectPlainDateEquals(
      PlainDateFns.addMonths(pd, 1, { overflow: 'constrain' }),
      PlainDateFns.add(pd, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-01-31', CalendarFns.getCore) // 31 days
    expect(() => {
      PlainDateFns.addMonths(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('addWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.subtractYears(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ years: 5 })),
    )
    expect(() => {
      PlainDateFns.subtractYears(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-02-29', CalendarFns.getCore) // leap day
    expectPlainDateEquals(
      PlainDateFns.subtractYears(pd, 5, { overflow: 'constrain' }),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ years: 5 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString(
      '2024-02-29',
      CalendarFns.getCore, // leap day
    )
    expect(() => {
      PlainDateFns.subtractYears(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractMonths', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.subtractMonths(pd, 5),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ months: 5 })),
    )
    expect(() => {
      PlainDateFns.subtractMonths(pd, 5.5)
    }).toThrowError(RangeError)
  })

  it('works with explicit constrain overflow option', () => {
    const pd = PlainDateFns.fromString('2024-03-31', CalendarFns.getCore) // 31 days
    expectPlainDateEquals(
      PlainDateFns.subtractMonths(pd, 1, { overflow: 'constrain' }),
      PlainDateFns.subtract(pd, DurationFns.fromFields({ months: 1 })),
    )
  })

  it('can throw error with reject overflow option', () => {
    const pd = PlainDateFns.fromString('2024-03-31', CalendarFns.getCore) // 31 days
    expect(() => {
      PlainDateFns.subtractMonths(pd, 1, { overflow: 'reject' })
    }).toThrowError(RangeError)
  })
})

describe('subtractWeeks', () => {
  it('works (and throws on non-integers)', () => {
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString('2024-02-27', CalendarFns.getCore)
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
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd),
      PlainDateFns.fromString('2025-01-01', CalendarFns.getCore),
    )
  })

  it('works with roundingMode option', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd, { roundingMode: 'floor' }),
      PlainDateFns.fromString('2024-01-01', CalendarFns.getCore),
    )
  })

  it('works with roundingMode string', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd, 'floor'),
      PlainDateFns.fromString('2024-01-01', CalendarFns.getCore),
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToYear(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-01-01', CalendarFns.getCore),
    )
    expect(() => {
      PlainDateFns.roundToYear(pd, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })

  it('matches canonical exact and midpoint-adjacent boundaries', () => {
    expectRoundToYearEquals('2024-01-01', '2024-01-01')
    expectRoundToYearEquals('2024-07-01', '2024-01-01')
    expectRoundToYearEquals('2024-07-02', '2025-01-01')
    expectRoundToYearEquals('2024-07-03', '2025-01-01')
  })
})

describe('roundToMonth', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd),
      PlainDateFns.fromString('2024-08-01', CalendarFns.getCore),
    )
  })

  it('works with roundingMode option', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd, { roundingMode: 'floor' }),
      PlainDateFns.fromString('2024-07-01', CalendarFns.getCore),
    )
  })

  it('works with roundingMode string', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd, 'floor'),
      PlainDateFns.fromString('2024-07-01', CalendarFns.getCore),
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.roundToMonth(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-07-01', CalendarFns.getCore),
    )
    expect(() => {
      PlainDateFns.roundToMonth(pd, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })

  it('matches canonical exact and midpoint-adjacent boundaries', () => {
    expectRoundToMonthEquals('2024-04-01', '2024-04-01')
    expectRoundToMonthEquals('2024-04-15', '2024-04-01')
    expectRoundToMonthEquals('2024-04-16', '2024-05-01')
    expectRoundToMonthEquals('2024-04-17', '2024-05-01')
  })
})

describe('roundToWeek', () => {
  it('works without options', () => {
    const pd = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd),
      PlainDateFns.fromString('2024-07-22', CalendarFns.getCore), // next Monday
    )
  })

  it('works with roundingMode option', () => {
    const pd = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd, { roundingMode: 'floor' }),
      PlainDateFns.fromString('2024-07-15', CalendarFns.getCore), // this Monday
    )
  })

  it('works with roundingMode string', () => {
    const pd = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd, 'floor'),
      PlainDateFns.fromString('2024-07-15', CalendarFns.getCore), // this Monday
    )
  })

  it('works with options', () => {
    const pd = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    expectPlainDateEquals(
      PlainDateFns.roundToWeek(pd, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      }),
      PlainDateFns.fromString('2024-07-15', CalendarFns.getCore), // this Monday
    )
    expect(() => {
      PlainDateFns.roundToWeek(pd, {
        roundingMode: 'floor',
        roundingIncrement: 2, // not allowed
      })
    }).toThrowError(RangeError)
  })

  it('matches canonical exact and midpoint-adjacent boundaries', () => {
    expectRoundToWeekEquals('2024-03-04', '2024-03-04')
    expectRoundToWeekEquals('2024-03-07', '2024-03-04')
    expectRoundToWeekEquals('2024-03-08', '2024-03-11')
    expectRoundToWeekEquals('2024-03-11', '2024-03-11')
  })
})

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

describe('startOfYear', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.startOfYear(pd),
      PlainDateFns.fromString('2024-01-01', CalendarFns.getCore),
    )
  })
})

describe('startOfMonth', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    expectPlainDateEquals(
      PlainDateFns.startOfMonth(pd),
      PlainDateFns.fromString('2024-07-01', CalendarFns.getCore),
    )
  })
})

describe('startOfWeek', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    expectPlainDateEquals(
      PlainDateFns.startOfWeek(pd),
      PlainDateFns.fromString('2024-07-15', CalendarFns.getCore), // this Monday
    )
  })
})

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

describe('endOfYear', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    const pd1 = PlainDateFns.endOfYear(pd0)
    const pd2 = PlainDateFns.fromString('2025-01-01', CalendarFns.getCore)
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

describe('endOfMonth', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-27', CalendarFns.getCore)
    const pd1 = PlainDateFns.endOfMonth(pd0)
    const pd2 = PlainDateFns.fromString('2024-08-01', CalendarFns.getCore)
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

describe('endOfWeek', () => {
  it('works', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore) // Saturday
    const pd1 = PlainDateFns.endOfWeek(pd0)
    const pd2 = PlainDateFns.fromString('2024-07-22', CalendarFns.getCore) // next Monday
    expectPlainDateEquals(pd1, PlainDateFns.subtractDays(pd2, 1))
  })
})

// Non-standard: Diffing
// -----------------------------------------------------------------------------

describe('diffYears', () => {
  it('gives exact result when no options/roundingMode specified', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2026-04-20', CalendarFns.getCore)
    const years = PlainDateFns.diffYears(pd0, pd1)
    expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2026-04-20', CalendarFns.getCore)
    const years = PlainDateFns.diffYears(pd0, pd1, 'floor')
    expect(years).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-07-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2026-04-20', CalendarFns.getCore)
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
    const pd0 = PlainDateFns.fromString('2024-02-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-04-10', CalendarFns.getCore)
    const months = PlainDateFns.diffMonths(pd0, pd1)
    expect(months).toBeCloseTo(1.677)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-02-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-04-10', CalendarFns.getCore)
    const months = PlainDateFns.diffMonths(pd0, pd1, 'floor')
    expect(months).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-02-20', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-04-10', CalendarFns.getCore)
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
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-16', CalendarFns.getCore)
    const weeks = PlainDateFns.diffWeeks(pd0, pd1)
    expect(weeks).toBeCloseTo(1.571)
  })

  it('gives rounded result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-16', CalendarFns.getCore)
    const weeks = PlainDateFns.diffWeeks(pd0, pd1, 'floor')
    expect(weeks).toBe(1)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-16', CalendarFns.getCore)
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
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-15', CalendarFns.getCore)
    const days = PlainDateFns.diffDays(pd0, pd1)
    expect(days).toBe(10)
  })

  it('gives integer result with roundingMode single arg', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-15', CalendarFns.getCore)
    const days = PlainDateFns.diffDays(pd0, pd1, 'floor')
    expect(days).toBe(10)
  })

  it('gives rounded result with options object', () => {
    const pd0 = PlainDateFns.fromString('2024-03-05', CalendarFns.getCore)
    const pd1 = PlainDateFns.fromString('2024-03-15', CalendarFns.getCore)
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
