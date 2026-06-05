import { describe, expect, it } from 'vitest'
import {
  getCoreCalendar,
  getExoticCalendar,
  getGregoryCalendar,
} from './calendar'
import * as PlainMonthDayFns from './plainMonthDay'
import {
  expectPlainDateEquals,
  expectPlainMonthDayEquals,
  itSkipNative,
  testHotCache,
} from './testUtils'

const gregoryCalendar = getGregoryCalendar()
const islamicCivilCalendar = getExoticCalendar('islamic-civil')
const localeFormatOptions = {
  month: 'long',
  day: 'numeric',
  calendar: 'iso8601',
} satisfies Intl.DateTimeFormatOptions

function createExpectedFormat(locales?: Intl.LocalesArgument) {
  return new Intl.DateTimeFormat(locales, localeFormatOptions)
}

function createExpectedDate(month: number, day: number) {
  // PlainMonthDay defaults to ISO leap year 1972. Compare to raw Intl output
  // for that synthetic date so host-specific month/day patterns can vary.
  return new Date(1972, month - 1, day)
}

describe('create', () => {
  it('works with a referenceYear', () => {
    const pmd = PlainMonthDayFns.create(6, 18, gregoryCalendar, 2024)
    expectPlainMonthDayEquals(pmd, {
      calendarId: 'gregory',
      monthCode: 'M06',
      day: 18,
    })
  })

  it('works without a referenceYear', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    expectPlainMonthDayEquals(pmd, {
      calendarId: 'iso8601',
      monthCode: 'M06',
      day: 18,
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.fromString(
      '2024-06-18[u-ca=gregory]',
      getCoreCalendar,
    )
    expectPlainMonthDayEquals(pmd, {
      calendarId: 'gregory',
      monthCode: 'M06',
      day: 18,
    })
  })
})

describe('fromFields', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.fromFields({
      calendar: gregoryCalendar,
      monthCode: 'M06',
      day: 18,
    })
    expectPlainMonthDayEquals(pmd, {
      calendarId: 'gregory',
      monthCode: 'M06',
      day: 18,
    })
  })

  // Node 26 native PlainMonthDay.from accepts conflicting non-ISO month fields
  // without a reference year. The shim requires the year before reconciliation,
  // so keep that validation contract covered by the forced-shim project.
  itSkipNative(
    'requires a year before reconciling non-iso month fields',
    () => {
      expect(() =>
        PlainMonthDayFns.fromFields({
          calendar: islamicCivilCalendar,
          monthCode: 'M04',
          month: 5,
          day: 1,
        }),
      ).toThrow(TypeError)
    },
  )
})

describe('calendar field getters', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    expect({
      monthCode: pmd.monthCode,
      day: pmd.day,
    }).toEqual({
      monthCode: 'M06',
      day: 18,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.withFields(pmd0, {
      day: 11,
    })
    expectPlainMonthDayEquals(pmd1, {
      monthCode: 'M06',
      day: 11,
    })
  })
})

describe('equals', () => {
  it('works', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.create(7, 20)
    expect(PlainMonthDayFns.equals(pmd0, pmd1)).toBe(false)
    expect(PlainMonthDayFns.equals(pmd0, pmd0)).toBe(true)
  })
})

describe('toPlainDate', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const pd = PlainMonthDayFns.toPlainDate(pmd, { year: 2023 })
    expectPlainDateEquals(pd, {
      year: 2023,
      month: 6,
      day: 18,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const s = PlainMonthDayFns.toString(pmd)
    expect(s).toBe('06-18')
  })

  it('has a simple no-options variant', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    expect(PlainMonthDayFns.toSimpleString(pmd)).toBe('06-18')
  })

  it('works with options', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const s = PlainMonthDayFns.toString(pmd, { calendarName: 'always' })
    expect(s).toBe('1972-06-18[u-ca=iso8601]')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const locale = 'en'
    const options = localeFormatOptions
    const s = testHotCache(() =>
      PlainMonthDayFns.toLocaleString(pmd, locale, options),
    )
    expect(s).toBe(
      createExpectedFormat(locale).format(createExpectedDate(6, 18)),
    )
  })
})

describe('createFormat', () => {
  it('formats records', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const format = PlainMonthDayFns.createFormat('en', localeFormatOptions)

    expect(format).toBeInstanceOf(Intl.DateTimeFormat)
    expect(format.format(pmd)).toBe(
      createExpectedFormat('en').format(createExpectedDate(6, 18)),
    )
  })

  it('snapshots options at construction', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      calendar: 'iso8601',
    }
    const format = PlainMonthDayFns.createFormat('en', options)

    options.month = 'numeric'
    expect(format.format(pmd)).toBe(
      new Intl.DateTimeFormat('en', {
        month: 'long',
        calendar: 'iso8601',
      }).format(createExpectedDate(6, 18)),
    )
  })

  it('formats parts', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const format = PlainMonthDayFns.createFormat('en', localeFormatOptions)

    expect(format.formatToParts(pmd)).toEqual(
      createExpectedFormat('en').formatToParts(createExpectedDate(6, 18)),
    )
  })

  it('formats ranges', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.create(10, 3)
    const format = PlainMonthDayFns.createFormat('en', localeFormatOptions)

    expect(format.formatRange(pmd0, pmd1)).toBe(
      createExpectedFormat('en').formatRange(
        createExpectedDate(6, 18),
        createExpectedDate(10, 3),
      ),
    )
  })

  it('formats range parts', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.create(10, 3)
    const format = PlainMonthDayFns.createFormat('en', localeFormatOptions)

    expect(format.formatRangeToParts(pmd0, pmd1)).toEqual(
      createExpectedFormat('en').formatRangeToParts(
        createExpectedDate(6, 18),
        createExpectedDate(10, 3),
      ),
    )
  })
})
