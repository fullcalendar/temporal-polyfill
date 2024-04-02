import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
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
import * as ZonedDateTimeFns from './zonedDateTime'

describe('create', () => {
  it('works without specifying a calendar', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expectZonedDateTimeEquals(zdt, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })

  it('works with specifying a calendar', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
      'hebrew',
    )
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(ZonedDateTimeFns.isInstance(zdt)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(ZonedDateTimeFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(ZonedDateTimeFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('can parse with a timeZone', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(zdt, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })

  it('can parse with a timeZone and calendar', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })
})

describe('fromFields', () => {
  it('fromFields', () => {
    const zdt = ZonedDateTimeFns.fromFields({
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      year: 5784,
      month: 4,
      day: 20,
      hour: 12,
      minute: 30,
    })
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1704130200000000000n,
    })
  })
})

describe('epochSeconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(ZonedDateTimeFns.epochSeconds(zdt)).toBe(1709055000)
  })
})

describe('epochMilliseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(ZonedDateTimeFns.epochMilliseconds(zdt)).toBe(1709055000000)
  })
})

describe('epochMicroseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(ZonedDateTimeFns.epochMicroseconds(zdt)).toBe(1709055000000000n)
  })
})

describe('epochNanoseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(ZonedDateTimeFns.epochNanoseconds(zdt)).toBe(1709055000000000000n)
  })
})

describe('offsetNanoseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const offsetNanoseconds = ZonedDateTimeFns.offsetNanoseconds(zdt)
    expect(offsetNanoseconds).toBe(-18000000000000)
  })
})

describe('offset', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const offsetString = ZonedDateTimeFns.offset(zdt)
    expect(offsetString).toBe('-05:00')
  })
})

describe('getISOFields', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const isoFields = ZonedDateTimeFns.getISOFields(zdt)
    expect(isoFields).toEqual({
      calendar: 'iso8601',
      isoDay: 27,
      isoHour: 12,
      isoMicrosecond: 0,
      isoMillisecond: 0,
      isoMinute: 30,
      isoMonth: 2,
      isoNanosecond: 0,
      isoSecond: 0,
      isoYear: 2024,
      offset: '-05:00',
      timeZone: 'America/New_York',
    })
  })
})

describe('getFields', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const fields = ZonedDateTimeFns.getFields(zdt)
    expect(fields).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 2024,
      monthCode: 'M02',
      month: 2,
      day: 27,
      hour: 12,
      minute: 30,
      second: 0,
      microsecond: 0,
      millisecond: 0,
      nanosecond: 0,
      offset: '-05:00',
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const zdt1 = ZonedDateTimeFns.withFields(zdt0, {
      day: 5,
    })
    const combinedFields = ZonedDateTimeFns.getFields(zdt1)
    expect(combinedFields).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 2024,
      monthCode: 'M02',
      month: 2,
      day: 5,
      hour: 12,
      minute: 30,
      second: 0,
      microsecond: 0,
      millisecond: 0,
      nanosecond: 0,
      offset: '-05:00',
    })
  })
})

describe('withPlainDate', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const pd = PlainDateFns.create(2009, 6, 1)
    const zdt1 = ZonedDateTimeFns.withPlainDate(zdt0, pd)
    const combinedFields = ZonedDateTimeFns.getFields(zdt1)
    expect(combinedFields).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 2009,
      monthCode: 'M06',
      month: 6,
      day: 1,
      hour: 12,
      minute: 30,
      second: 0,
      microsecond: 0,
      millisecond: 0,
      nanosecond: 0,
      offset: '-04:00',
    })
  })
})

describe('withPlainTime', () => {
  it('works with a time argument', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const pt = PlainTimeFns.create(3) // 3:00
    const zdt1 = ZonedDateTimeFns.withPlainTime(zdt0, pt)
    const combinedFields = ZonedDateTimeFns.getFields(zdt1)
    expect(combinedFields).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 2024,
      monthCode: 'M02',
      month: 2,
      day: 27,
      hour: 3,
      minute: 0,
      second: 0,
      microsecond: 0,
      millisecond: 0,
      nanosecond: 0,
      offset: '-05:00',
    })
  })

  it('works with a time argument', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const zdt1 = ZonedDateTimeFns.withPlainTime(zdt0)
    const combinedFields = ZonedDateTimeFns.getFields(zdt1)
    expect(combinedFields).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 2024,
      monthCode: 'M02',
      month: 2,
      day: 27,
      hour: 0,
      minute: 0,
      second: 0,
      microsecond: 0,
      millisecond: 0,
      nanosecond: 0,
      offset: '-05:00',
    })
  })
})

describe('dayOfWeek', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.dayOfWeek(zdt)).toBe(2)
  })
})

describe('daysInWeek', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.daysInWeek(zdt)).toBe(7)
  })
})

describe('weekOfYear', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expect(ZonedDateTimeFns.weekOfYear(zdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=gregory]',
    )
    expect(ZonedDateTimeFns.weekOfYear(zdt)).toBe(1)
  })

  it('returns correct iso8601 results', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.weekOfYear(zdt)).toBe(52)
  })
})

describe('yearOfWeek', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expect(ZonedDateTimeFns.yearOfWeek(zdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=gregory]',
    )
    expect(ZonedDateTimeFns.yearOfWeek(zdt)).toBe(2023)
  })

  it('returns correct iso8601 results', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.yearOfWeek(zdt)).toBe(2022)
  })
})

describe('dayOfYear', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.dayOfYear(zdt)).toBe(58)
  })
})

describe('daysInMonth', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.daysInMonth(zdt)).toBe(29)
  })
})

describe('daysInYear', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.daysInYear(zdt)).toBe(366)
  })
})

describe('monthsInYear', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expect(ZonedDateTimeFns.monthsInYear(zdt)).toBe(13)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expect(ZonedDateTimeFns.inLeapYear(zdt)).toBe(true)
  })
})

describe('startOfDay', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.startOfDay(zdt0)
    expectZonedDateTimeEquals(zdt1, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })
})

describe('hoursInDay', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const hours = ZonedDateTimeFns.hoursInDay(zdt0)
    expect(hours).toBe(24)
  })
})

describe('add', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.add(
      zdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectZonedDateTimeEquals(zdt1, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1743107700000000000n,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.subtract(
      zdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectZonedDateTimeEquals(zdt1, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1674825900000000000n,
    })
  })
})

describe('until', () => {
  it('works without options', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    const d = ZonedDateTimeFns.until(zdt0, zdt1)
    expectDurationEquals(d, {
      hours: 9459,
      minutes: 5,
    })
  })

  it('works with options', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    const d = ZonedDateTimeFns.until(zdt0, zdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: 1,
      months: 1,
      hours: 4,
      minutes: 5,
    })
  })
})

describe('since', () => {
  it('works without options', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    const d = ZonedDateTimeFns.since(zdt0, zdt1)
    expectDurationEquals(d, {
      hours: -9459,
      minutes: -5,
    })
  })

  it('works with options', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    const d = ZonedDateTimeFns.since(zdt0, zdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: -1,
      months: -1,
      hours: -4,
      minutes: -5,
    })
  })
})

describe('round', () => {
  it('works with single unit arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.round(zdt0, 'day')
    expectZonedDateTimeEquals(zdt1, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1709096400000000000n,
    })
  })

  it('works with options arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.round(zdt0, { smallestUnit: 'day' })
    expectZonedDateTimeEquals(zdt1, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1709096400000000000n,
    })
  })
})

describe('equals', () => {
  it('works affirmatively', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.equals(zdt, zdt)).toBe(true)
  })

  it('works negatively', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.equals(zdt0, zdt1)).toBe(false)
  })
})

describe('compare', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.fromString(
      '2025-03-27T16:35:00[America/New_York]',
    )
    expect(ZonedDateTimeFns.compare(zdt0, zdt1)).toBe(-1)
    expect(ZonedDateTimeFns.compare(zdt1, zdt0)).toBe(1)
    expect(ZonedDateTimeFns.compare(zdt0, zdt0)).toBe(0)
  })
})

describe('toPlainDateTime', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const pdt = ZonedDateTimeFns.toPlainDateTime(zdt)
    expectPlainDateTimeEquals(pdt, {
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toPlainDate', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const pd = ZonedDateTimeFns.toPlainDate(zdt)
    expectPlainDateEquals(pd, {
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toPlainTime', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const pt = ZonedDateTimeFns.toPlainTime(zdt)
    expectPlainTimeEquals(pt, {
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toPlainYearMonth', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const pym = ZonedDateTimeFns.toPlainYearMonth(zdt)
    expectPlainYearMonthEquals(pym, {
      isoYear: 2024,
      isoMonth: 2,
    })
  })
})

describe('toPlainMonthDay', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const pmd = ZonedDateTimeFns.toPlainMonthDay(zdt)
    expectPlainMonthDayEquals(pmd, {
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const s = ZonedDateTimeFns.toString(zdt)
    expect(s).toBe('2024-02-27T12:30:00-05:00[America/New_York]')
  })

  it('works with options', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    const s = ZonedDateTimeFns.toString(zdt, {
      calendarName: 'always',
      fractionalSecondDigits: 2,
    })
    expect(s).toBe(
      '2024-02-27T12:30:00.00-05:00[America/New_York][u-ca=iso8601]',
    )
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 12,
      minute: 30,
      timeZone: 'America/New_York',
    })
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
    }
    const s = testHotCache(() =>
      ZonedDateTimeFns.toLocaleString(zdt, locale, options),
    )
    expect(s).toBe(
      'Sunday, December 31, 2023 at 12:30:00 PM Eastern Standard Time',
    )
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 12,
      minute: 30,
      timeZone: 'America/New_York',
    })
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
    }
    const parts = testHotCache(() =>
      ZonedDateTimeFns.toLocaleStringParts(zdt, locale, options),
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
      { type: 'literal', value: ' ' },
      { type: 'timeZoneName', value: 'Eastern Standard Time' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 12,
      minute: 30,
      timeZone: 'America/New_York',
    })
    const zdt1 = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 14,
      minute: 59,
      timeZone: 'America/New_York',
    })
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
    }
    const s = testHotCache(() =>
      ZonedDateTimeFns.rangeToLocaleString(zdt0, zdt1, locale, options),
    )
    expect(s).toBe(
      'Sunday, December 31, 2023, 12:30:00 PM EST – 2:59:00 PM EST',
    )
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const zdt0 = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 12,
      minute: 30,
      timeZone: 'America/New_York',
    })
    const zdt1 = ZonedDateTimeFns.fromFields({
      year: 2023,
      month: 12,
      day: 31,
      hour: 14,
      minute: 59,
      timeZone: 'America/New_York',
    })
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
    }
    const parts = testHotCache(() =>
      ZonedDateTimeFns.rangeToLocaleStringParts(zdt0, zdt1, locale, options),
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
      { source: 'startRange', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'timeZoneName', value: 'EST' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'hour', value: '2' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'minute', value: '59' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'second', value: '00' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'dayPeriod', value: 'PM' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'timeZoneName', value: 'EST' },
    ])
  })
})

// Non-standard: With
// -----------------------------------------------------------------------------

describe('withDayOfYear', () => {
  it('works with ISO calendar (and coerces to integer)', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdtExp = {
      // 2024-01-05T12:30:00[America/New_York]
      epochNanoseconds: 1704475800000000000n,
      timeZone: 'America/New_York',
    }

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
    const zdtExp = {
      // 2023-09-20T12:30:00-04:00[America/New_York][u-ca=hebrew]
      epochNanoseconds: 1695227400000000000n,
      timeZone: 'America/New_York',
      calendar: 'hebrew',
    }

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
    const zdtExp = {
      // 2024-02-29T12:30:00[America/New_York]
      epochNanoseconds: 1709227800000000000n,
      timeZone: 'America/New_York',
    }

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
      timeZone: 'America/New_York',
      calendar: 'hebrew',
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
    const zdtExp = {
      // 2024-07-02T12:30:00-04:00[America/New_York]
      epochNanoseconds: 1719937800000000000n,
      timeZone: 'America/New_York',
    }
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
      roundingIncrement: 1,
    })
    expect(years).toBe(1)
    expect(() => {
      ZonedDateTimeFns.diffYears(zdt0, zdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(months).toBe(1)
    expect(() => {
      ZonedDateTimeFns.diffMonths(zdt0, zdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
    expect(weeks).toBe(1)
    expect(() => {
      ZonedDateTimeFns.diffWeeks(zdt0, zdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
      roundingIncrement: 1,
    })
    expect(days).toBe(10)
    expect(() => {
      ZonedDateTimeFns.diffDays(zdt0, zdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
    }).toThrowError(RangeError)
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
