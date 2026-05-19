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
  expectPlainTimeEquals,
  expectPlainYearMonthEquals,
  expectZonedDateTimeEquals,
  testHotCache,
} from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

function getPublicFields(zdt: ZonedDateTimeFns.ZonedDateTimeShimRecord) {
  return {
    era: zdt.era,
    eraYear: zdt.eraYear,
    year: zdt.year,
    monthCode: zdt.monthCode,
    month: zdt.month,
    day: zdt.day,
    hour: zdt.hour,
    minute: zdt.minute,
    second: zdt.second,
    microsecond: zdt.microsecond,
    millisecond: zdt.millisecond,
    nanosecond: zdt.nanosecond,
    offset: ZonedDateTimeFns.offset(zdt),
  }
}

describe('create', () => {
  it('works without specifying a calendar', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expectZonedDateTimeEquals(zdt, {
      timeZoneId: 'America/New_York',
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
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })
})

describe('fromString', () => {
  it('can parse with a timeZone', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    expectZonedDateTimeEquals(zdt, {
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })

  it('can parse with a timeZone and calendar', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York][u-ca=hebrew]',
    )
    expectZonedDateTimeEquals(zdt, {
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
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
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1704130200000000000n,
    })
  })
})

describe('epochMilliseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(zdt.epochMilliseconds).toBe(1709055000000)
  })
})

describe('epochNanoseconds', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(zdt.epochNanoseconds).toBe(1709055000000000000n)
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

describe('date-time field getters', () => {
  it('works', () => {
    const zdt = ZonedDateTimeFns.create(
      1709055000000000000n,
      'America/New_York',
    )
    expect(getPublicFields(zdt)).toEqual({
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
    expect(getPublicFields(zdt1)).toEqual({
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
    expect(getPublicFields(zdt1)).toEqual({
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
    expect(getPublicFields(zdt1)).toEqual({
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
    expect(getPublicFields(zdt1)).toEqual({
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

  it('returns undefined for gregory calendar dates', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=gregory]',
    )
    expect(ZonedDateTimeFns.weekOfYear(zdt)).toBe(undefined)
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

  it('returns undefined for gregory calendar dates', () => {
    const zdt = ZonedDateTimeFns.fromString(
      '2023-01-01T12:30:00[America/New_York][u-ca=gregory]',
    )
    expect(ZonedDateTimeFns.yearOfWeek(zdt)).toBe(undefined)
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
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709010000000000000n,
    })
  })
})

describe('getTimeZoneTransition', () => {
  it('can return the next transition', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1711962000000000000n,
      'America/New_York',
    )
    const zdt1 = ZonedDateTimeFns.getTimeZoneTransition(zdt0, 'next')
    expectZonedDateTimeEquals(zdt1!, {
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1730613600000000000n,
    })
  })

  it('can return the previous transition', () => {
    const zdt0 = ZonedDateTimeFns.create(
      1711962000000000000n,
      'America/New_York',
      'hebrew',
    )
    const zdt1 = ZonedDateTimeFns.getTimeZoneTransition(zdt0, {
      direction: 'previous',
    })
    expectZonedDateTimeEquals(zdt1!, {
      calendarId: 'hebrew',
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1710054000000000000n,
    })
  })

  it('can return null for a fixed-offset time zone', () => {
    const zdt0 = ZonedDateTimeFns.create(1711962000000000000n, 'UTC')
    const zdt1 = ZonedDateTimeFns.getTimeZoneTransition(zdt0, 'next')
    expect(zdt1).toBe(null)
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
      timeZoneId: 'America/New_York',
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
      timeZoneId: 'America/New_York',
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
      timeZoneId: 'America/New_York',
      epochNanoseconds: 1709096400000000000n,
    })
  })

  it('works with options arg', () => {
    const zdt0 = ZonedDateTimeFns.fromString(
      '2024-02-27T12:30:00[America/New_York]',
    )
    const zdt1 = ZonedDateTimeFns.round(zdt0, { smallestUnit: 'day' })
    expectZonedDateTimeEquals(zdt1, {
      timeZoneId: 'America/New_York',
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
      year: 2024,
      month: 2,
      day: 27,
      hour: 12,
      minute: 30,
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
      year: 2024,
      month: 2,
      day: 27,
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
      hour: 12,
      minute: 30,
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
      year: 2024,
      month: 2,
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
      monthCode: 'M02',
      day: 27,
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

  it('does not write the forced time zone into caller options', () => {
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
      hour: 12,
      minute: 30,
      timeZone: 'America/Los_Angeles',
    })
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'full',
    }

    ZonedDateTimeFns.toLocaleString(zdt0, 'en', options)

    expect(options.timeZone).toBe(undefined)
    expect(() =>
      ZonedDateTimeFns.toLocaleString(zdt1, 'en', options),
    ).not.toThrow()
  })
})
