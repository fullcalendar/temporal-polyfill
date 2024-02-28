import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import {
  expectDurationEquals,
  expectInstantEquals,
  testHotCache,
} from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

describe('create', () => {
  it('works', () => {
    const inst = InstantFns.create(1n)
    expectInstantEquals(inst, 1n)
  })
})

describe('fromString', () => {
  it('works', () => {
    const inst = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    expectInstantEquals(inst, 1704063600000000000n)
  })
})

describe('fromEpochNanoseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochNanoseconds(1n)
    expectInstantEquals(inst, 1n)
  })
})

describe('fromEpochMicroseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochMicroseconds(1n)
    expectInstantEquals(inst, 1000n)
  })
})

describe('fromEpochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochMilliseconds(1)
    expectInstantEquals(inst, 1000000n)
  })
})

describe('fromEpochSeconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochSeconds(1)
    expectInstantEquals(inst, 1000000000n)
  })
})

describe('epochNanoseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1n)
    expect(InstantFns.epochNanoseconds(inst)).toBe(1n)
  })
})

describe('epochMicroseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1000n)
    expect(InstantFns.epochMicroseconds(inst)).toBe(1n)
  })
})

describe('epochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1000000n)
    expect(InstantFns.epochMilliseconds(inst)).toBe(1)
  })
})

describe('add', () => {
  it('advances by time units', () => {
    const inst0 = InstantFns.create(0n)
    const d = DurationFns.fromFields({ hours: 2 })
    const inst1 = InstantFns.add(inst0, d)
    expectInstantEquals(inst1, 7200000000000n)
  })
})

describe('subtract', () => {
  it('advances by time units', () => {
    const inst0 = InstantFns.create(0n)
    const d = DurationFns.fromFields({ hours: -2 })
    const inst1 = InstantFns.subtract(inst0, d)
    expectInstantEquals(inst1, 7200000000000n)
  })
})

describe('until', () => {
  it('diffs two objects without options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.until(inst0, inst1)
    expectDurationEquals(d, { seconds: 86400 })
  })

  it('diffs two objects with options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.until(inst0, inst1, { largestUnit: 'hours' })
    expectDurationEquals(d, { hours: 24 })
  })
})

describe('since', () => {
  it('diffs two objects without options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.since(inst0, inst1)
    expectDurationEquals(d, { seconds: -86400 })
  })

  it('diffs two objects with options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.since(inst0, inst1, { largestUnit: 'hour' })
    expectDurationEquals(d, { hours: -24 })
  })
})

describe('round', () => {
  it('works with no simple string unit', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:30:00+01:00')
    const inst1 = InstantFns.round(inst0, 'hour')
    expectInstantEquals(inst1, 1704067200000000000n)
  })

  it('works with options object', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:30:00+01:00')
    const inst1 = InstantFns.round(inst0, { smallestUnit: 'hour' })
    expectInstantEquals(inst1, 1704067200000000000n)
  })
})

describe('equals', () => {
  it('works affirmatively', () => {
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704063600000000000n)
    expect(InstantFns.equals(inst0, inst1)).toBe(true)
  })

  it('works negatively', () => {
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704063600000000001n)
    expect(InstantFns.equals(inst0, inst1)).toBe(false)
  })
})

describe('compare', () => {
  it('produces -1/0/1', () => {
    const past = InstantFns.create(1704063600000000000n)
    const future = InstantFns.create(1704063600000000001n)
    expect(InstantFns.compare(past, future)).toBe(-1)
    expect(InstantFns.compare(future, past)).toBe(1)
    expect(InstantFns.compare(future, future)).toBe(0)
  })
})

describe('toString', () => {
  it('works without options', () => {
    const inst = InstantFns.create(1704063600000000001n)
    const s = InstantFns.toString(inst)
    expect(s).toBe('2023-12-31T23:00:00.000000001Z')
  })

  it('works with rounding options', () => {
    const inst = InstantFns.create(1704063600000000001n)
    const s = InstantFns.toString(inst, { smallestUnit: 'second' })
    expect(s).toBe('2023-12-31T23:00:00Z')
  })
})

describe('toZonedDateTimeISO', () => {
  it('converts an Instant', () => {
    const inst = InstantFns.create(1704063600000000001n)
    const zdt = InstantFns.toZonedDateTimeISO(inst, 'America/New_York')
    expect(ZonedDateTimeFns.epochNanoseconds(zdt)).toBe(1704063600000000001n)
    expect(zdt.branding).toBe('ZonedDateTime')
    expect(zdt.timeZone).toBe('America/New_York')
    expect(zdt.calendar).toBe('iso8601')
  })
})

describe('toZonedDateTime', () => {
  it('converts an Instant', () => {
    const inst = InstantFns.create(1704063600000000001n)
    const zdt = InstantFns.toZonedDateTime(inst, {
      timeZone: 'America/New_York',
      calendar: 'hebrew',
    })
    expect(ZonedDateTimeFns.epochNanoseconds(zdt)).toBe(1704063600000000001n)
    expect(zdt.branding).toBe('ZonedDateTime')
    expect(zdt.timeZone).toBe('America/New_York')
    expect(zdt.calendar).toBe('hebrew')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    }
    const inst = InstantFns.create(1704063600000000000n)
    const s = testHotCache(() =>
      InstantFns.toLocaleString(inst, locale, options),
    )
    expect(s).toEqual('Sunday, December 31, 2023')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    }
    const inst = InstantFns.create(1704063600000000000n)
    const parts = testHotCache(() =>
      InstantFns.toLocaleStringParts(inst, locale, options),
    )
    expect(parts).toEqual([
      { type: 'weekday', value: 'Sunday' },
      { type: 'literal', value: ', ' },
      { type: 'month', value: 'December' },
      { type: 'literal', value: ' ' },
      { type: 'day', value: '31' },
      { type: 'literal', value: ', ' },
      { type: 'year', value: '2023' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const formatLocale = 'en'
    const formatOptions = {
      dateStyle: 'full' as const,
      timeZone: 'America/New_York',
    }
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704150000000000000n) // +1 day
    const s = testHotCache(() =>
      InstantFns.rangeToLocaleString(inst0, inst1, formatLocale, formatOptions),
    )
    expect(s).toBe('Sunday, December 31, 2023 – Monday, January 1, 2024')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const formatLocale = 'en'
    const formatOptions = {
      dateStyle: 'full' as const,
      timeZone: 'America/New_York',
    }
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704150000000000000n) // +1 day
    const parts = testHotCache(() =>
      InstantFns.rangeToLocaleStringParts(
        inst0,
        inst1,
        formatLocale,
        formatOptions,
      ),
    )
    expect(parts).toEqual([
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
})
