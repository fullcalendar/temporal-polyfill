import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
import * as PlainTimeFns from './plainTime'
import {
  expectDurationEquals,
  expectPlainDateTimeEquals,
  expectPlainTimeEquals,
  expectZonedDateTimeEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    expectPlainTimeEquals(pt, {
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pt = PlainTimeFns.fromString('12:30')
    expectPlainTimeEquals(pt, {
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pt = PlainTimeFns.fromFields({
      hour: 12,
    })
    expectPlainTimeEquals(pt, {
      isoHour: 12,
    })
  })
})

describe('getFields', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    const fields = PlainTimeFns.getFields(pt)
    expect(fields).toEqual({
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
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.withFields(pt0, {
      minute: 45,
      second: 1,
    })
    expectPlainTimeEquals(pt1, {
      isoHour: 12,
      isoMinute: 45,
      isoSecond: 1,
    })
  })
})

describe('add', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.add(pt0, d)
    expectPlainTimeEquals(pt1, {
      isoHour: 2,
      isoMinute: 45,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.subtract(pt0, d)
    expectPlainTimeEquals(pt1, {
      isoHour: 22,
      isoMinute: 15,
    })
  })
})

describe('until', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(22, 45)
    const d = PlainTimeFns.until(pt0, pt1)
    expectDurationEquals(d, {
      hours: 10,
      minutes: 15,
    })
  })
})

describe('since', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(22, 45)
    const d = PlainTimeFns.since(pt0, pt1)
    expectDurationEquals(d, {
      hours: -10,
      minutes: -15,
    })
  })
})

describe('round', () => {
  it('works with single unit arg', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.round(pt0, 'hour')
    expectPlainTimeEquals(pt1, {
      isoHour: 13,
    })
  })

  it('works with options arg', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.round(pt0, { smallestUnit: 'hour' })
    expectPlainTimeEquals(pt1, {
      isoHour: 13,
    })
  })
})

describe('equals', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(22, 45)
    expect(PlainTimeFns.equals(pt0, pt1)).toBe(false)
    expect(PlainTimeFns.equals(pt0, pt0)).toBe(true)
  })
})

describe('compare', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(22, 45)
    expect(PlainTimeFns.compare(pt0, pt1)).toBe(-1)
    expect(PlainTimeFns.compare(pt1, pt0)).toBe(1)
    expect(PlainTimeFns.compare(pt0, pt0)).toBe(0)
  })
})

describe('toPlainDateTime', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    const pd = PlainDateFns.create(2024, 6, 3)
    const pdt = PlainTimeFns.toPlainDateTime(pt, pd)
    expectPlainDateTimeEquals(pdt, {
      isoYear: 2024,
      isoMonth: 6,
      isoDay: 3,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toZonedDateTime', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    const pd = PlainDateFns.create(2024, 6, 3)
    const zdt = PlainTimeFns.toZonedDateTime(pt, {
      timeZone: 'America/New_York',
      plainDate: pd,
    })
    expectZonedDateTimeEquals(zdt, {
      timeZone: 'America/New_York',
      epochNanoseconds: 1717432200000000000n,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pt = PlainTimeFns.create(12, 30)
    const s = PlainTimeFns.toString(pt)
    expect(s).toBe('12:30:00')
  })

  it('works with options', () => {
    const pt = PlainTimeFns.create(12, 30)
    const s = PlainTimeFns.toString(pt, {
      fractionalSecondDigits: 2,
    })
    expect(s).toBe('12:30:00.00')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
    const s = testHotCache(() =>
      PlainTimeFns.toLocaleString(pt, locale, options),
    )
    expect(s).toBe('12:30:00 PM')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
    const parts = testHotCache(() =>
      PlainTimeFns.toLocaleStringParts(pt, locale, options),
    )
    expect(parts).toEqual([
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
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(14, 45)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { timeStyle: 'long' }
    const s = testHotCache(() =>
      PlainTimeFns.rangeToLocaleString(pt0, pt1, locale, options),
    )
    expect(s).toBe('12:30:00 PM – 2:45:00 PM')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(14, 45)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = { timeStyle: 'long' }
    const parts = testHotCache(() =>
      PlainTimeFns.rangeToLocaleStringParts(pt0, pt1, locale, options),
    )
    expect(parts).toEqual([
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
      { source: 'endRange', type: 'minute', value: '45' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'second', value: '00' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'dayPeriod', value: 'PM' },
    ])
  })
})
