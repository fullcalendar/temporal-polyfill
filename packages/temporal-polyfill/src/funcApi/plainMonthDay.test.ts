import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainMonthDayFns from './plainMonthDay'
import {
  expectPlainDateEquals,
  expectPlainMonthDayEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works with a referenceYear', () => {
    const pmd = PlainMonthDayFns.create(6, 18, 'gregory', 2024)
    expectPlainMonthDayEquals(pmd, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 6,
      isoDay: 18,
    })
  })

  it('works without a referenceYear', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    expectPlainMonthDayEquals(pmd, {
      calendar: 'iso8601',
      isoMonth: 6,
      isoDay: 18,
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    expect(PlainMonthDayFns.isInstance(pmd)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(PlainMonthDayFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(PlainMonthDayFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.fromString('2024-06-18[u-ca=gregory]')
    expectPlainMonthDayEquals(pmd, {
      calendar: 'gregory',
      isoMonth: 6,
      isoDay: 18,
    })
  })
})

describe('fromFields', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.fromFields({
      calendar: 'gregory',
      monthCode: 'M06',
      day: 18,
    })
    expectPlainMonthDayEquals(pmd, {
      calendar: 'gregory',
      isoMonth: 6,
      isoDay: 18,
    })
  })
})

describe('getFields', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const fields = PlainMonthDayFns.getFields(pmd)
    expect(fields).toEqual({
      monthCode: 'M06',
      month: 6,
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
      isoMonth: 6,
      isoDay: 11,
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
      isoYear: 2023,
      isoMonth: 6,
      isoDay: 18,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const s = PlainMonthDayFns.toString(pmd)
    expect(s).toBe('06-18')
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
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      calendar: 'iso8601', // required unfortunately
    }
    const s = testHotCache(() =>
      PlainMonthDayFns.toLocaleString(pmd, locale, options),
    )
    expect(s).toBe('June 18')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const pmd = PlainMonthDayFns.create(6, 18)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      calendar: 'iso8601', // required unfortunately
    }
    const parts = testHotCache(() =>
      PlainMonthDayFns.toLocaleStringParts(pmd, locale, options),
    )
    expect(parts).toEqual([
      { type: 'month', value: 'June' },
      { type: 'literal', value: ' ' },
      { type: 'day', value: '18' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.create(10, 3)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      calendar: 'iso8601', // required unfortunately
    }
    const s = testHotCache(() =>
      PlainMonthDayFns.rangeToLocaleString(pmd0, pmd1, locale, options),
    )
    expect(s).toBe('June 18 – October 3')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const pmd0 = PlainMonthDayFns.create(6, 18)
    const pmd1 = PlainMonthDayFns.create(10, 3)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      calendar: 'iso8601', // required unfortunately
    }
    const parts = testHotCache(() =>
      PlainMonthDayFns.rangeToLocaleStringParts(pmd0, pmd1, locale, options),
    )
    expect(parts).toEqual([
      { source: 'startRange', type: 'month', value: 'June' },
      { source: 'startRange', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'day', value: '18' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'month', value: 'October' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'day', value: '3' },
    ])
  })
})
