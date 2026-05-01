import { describe, expect, it } from 'vitest'
import * as DurationFns from '../../dist/fns/duration'
import * as PlainDateFns from '../../dist/fns/plaindate'
import * as PlainTimeFns from '../../dist/fns/plaintime'
import {
  expectDurationEquals,
  expectPlainDateTimeEquals,
  expectPlainTimeEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    expectPlainTimeEquals(pt, {
      time: {
        hour: 12,
        minute: 30,
      },
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const pt = PlainTimeFns.create(12, 30)
    expect(PlainTimeFns.isInstance(pt)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(PlainTimeFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(PlainTimeFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('works', () => {
    const pt = PlainTimeFns.fromString('12:30')
    expectPlainTimeEquals(pt, {
      time: {
        hour: 12,
        minute: 30,
      },
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pt = PlainTimeFns.fromFields({
      hour: 12,
    })
    expectPlainTimeEquals(pt, {
      time: {
        hour: 12,
      },
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
      time: {
        hour: 12,
        minute: 45,
        second: 1,
      },
    })
  })
})

describe('add', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.add(pt0, d)
    expectPlainTimeEquals(pt1, {
      time: {
        hour: 2,
        minute: 45,
      },
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.subtract(pt0, d)
    expectPlainTimeEquals(pt1, {
      time: {
        hour: 22,
        minute: 15,
      },
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
      time: {
        hour: 13,
      },
    })
  })

  it('works with options arg', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.round(pt0, { smallestUnit: 'hour' })
    expectPlainTimeEquals(pt1, {
      time: {
        hour: 13,
      },
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
      isoDate: {
        year: 2024,
        month: 6,
        day: 3,
      },
      time: {
        hour: 12,
        minute: 30,
      },
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
    expect(s).toBe('12:30:00 PM UTC – 2:45:00 PM UTC')
  })
})

// TODO: revive
describe.only('rangeToLocaleStringParts', () => {
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
      { source: 'startRange', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'timeZoneName', value: 'UTC' },
      { source: 'shared', type: 'literal', value: ' – ' },
      { source: 'endRange', type: 'hour', value: '2' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'minute', value: '45' },
      { source: 'endRange', type: 'literal', value: ':' },
      { source: 'endRange', type: 'second', value: '00' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'dayPeriod', value: 'PM' },
      { source: 'endRange', type: 'literal', value: ' ' },
      { source: 'endRange', type: 'timeZoneName', value: 'UTC' },
    ])
  })
})
