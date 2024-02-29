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
  it('works', () => {
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
    expect(s).toBe(
      'Sunday, December 31, 2023 at 12:30:00 PM Eastern Standard Time',
    )
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
    expect(
      // Hard to compare some weird whitespace characters
      // Filter away whitespace-only parts
      parts.filter((part) => part.value.trim()),
    ).toEqual([
      { type: 'weekday', value: 'Sunday' },
      { type: 'literal', value: ', ' },
      { type: 'month', value: 'December' },
      { type: 'day', value: '31' },
      { type: 'literal', value: ', ' },
      { type: 'year', value: '2023' },
      { type: 'literal', value: ' at ' },
      { type: 'hour', value: '12' },
      { type: 'literal', value: ':' },
      { type: 'minute', value: '30' },
      { type: 'literal', value: ':' },
      { type: 'second', value: '00' },
      { type: 'dayPeriod', value: 'PM' },
      { type: 'timeZoneName', value: 'Eastern Standard Time' },
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
    expect(s).toBe(
      'Sunday, December 31, 2023, 12:30:00 PM EST – 2:59:00 PM EST',
    )
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
    expect(
      // Hard to compare some weird whitespace characters
      // Filter away whitespace-only parts
      parts.filter((part) => part.value.trim()),
    ).toEqual([
      { source: 'shared', type: 'weekday', value: 'Sunday' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'shared', type: 'month', value: 'December' },
      { source: 'shared', type: 'day', value: '31' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'shared', type: 'year', value: '2023' },
      { source: 'shared', type: 'literal', value: ', ' },
      { source: 'startRange', type: 'hour', value: '12' },
      { source: 'startRange', type: 'literal', value: ':' },
      { source: 'startRange', type: 'minute', value: '30' },
      { source: 'startRange', type: 'literal', value: ':' },
      { source: 'startRange', type: 'second', value: '00' },
      { source: 'startRange', type: 'dayPeriod', value: 'PM' },
      { source: 'startRange', type: 'timeZoneName', value: 'EST' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'hour', value: '2' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'minute', value: '59' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'second', value: '00' },
      { source: 'endRange', type: 'dayPeriod', value: 'PM' },
      { source: 'endRange', type: 'timeZoneName', value: 'EST' },
    ])
  })
})
