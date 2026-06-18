import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import {
  expectDurationEquals,
  expectInstantEquals,
  testHotCache,
} from './testUtils'

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

describe('fromEpochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochMilliseconds(1)
    expectInstantEquals(inst, 1000000n)
  })
})

describe('epochNanoseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1n)
    expect(inst.epochNanoseconds).toBe(1n)
  })
})

describe('epochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1000000n)
    expect(inst.epochMilliseconds).toBe(1)
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

describe('add*', () => {
  it('advances by one time unit', () => {
    const inst = InstantFns.create(0n)

    expectInstantEquals(InstantFns.addHours(inst, 1), 3600000000000n)
    expectInstantEquals(InstantFns.addMinutes(inst, 1), 60000000000n)
    expectInstantEquals(InstantFns.addSeconds(inst, 1), 1000000000n)
    expectInstantEquals(InstantFns.addMilliseconds(inst, 1), 1000000n)
    expectInstantEquals(InstantFns.addMicroseconds(inst, 1), 1000n)
    expectInstantEquals(InstantFns.addNanoseconds(inst, 1), 1n)
  })

  it('rejects non-integer units', () => {
    const inst = InstantFns.create(0n)

    expect(() => InstantFns.addHours(inst, 1.5)).toThrow(RangeError)
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

describe('subtract*', () => {
  it('rewinds by one time unit', () => {
    const inst = InstantFns.create(3600000000000n)

    expectInstantEquals(InstantFns.subtractHours(inst, 1), 0n)
    expectInstantEquals(InstantFns.subtractMinutes(inst, 1), 3540000000000n)
    expectInstantEquals(InstantFns.subtractSeconds(inst, 1), 3599000000000n)
    expectInstantEquals(
      InstantFns.subtractMilliseconds(inst, 1),
      3599999000000n,
    )
    expectInstantEquals(
      InstantFns.subtractMicroseconds(inst, 1),
      3599999999000n,
    )
    expectInstantEquals(InstantFns.subtractNanoseconds(inst, 1), 3599999999999n)
  })

  it('rejects non-integer units', () => {
    const inst = InstantFns.create(0n)

    expect(() => InstantFns.subtractHours(inst, 1.5)).toThrow(RangeError)
  })
})

describe('diff', () => {
  it('diffs two objects without options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.diff(inst0, inst1)
    expectDurationEquals(d, { seconds: 86400 })
  })

  it('diffs two objects with options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    const inst1 = InstantFns.fromString('2024-01-02T00:00:00+01:00')
    const d = InstantFns.diff(inst0, inst1, { largestUnit: 'hours' })
    expectDurationEquals(d, { hours: 24 })
  })
})

describe('diff*', () => {
  it('totals exact time units without options', () => {
    const inst0 = InstantFns.create(0n)
    const inst1 = InstantFns.create(5400000000000n)

    expect(InstantFns.diffHours(inst0, inst1)).toBe(1.5)
    expect(InstantFns.diffMinutes(inst0, inst1)).toBe(90)
    expect(InstantFns.diffSeconds(inst0, inst1)).toBe(5400)
    expect(InstantFns.diffMilliseconds(inst0, inst1)).toBe(5400000)
    expect(InstantFns.diffMicroseconds(inst0, inst1)).toBe(5400000000)
    expect(InstantFns.diffNanoseconds(inst0, inst1)).toBe(5400000000000)
  })

  it('preserves direction', () => {
    const inst0 = InstantFns.create(0n)
    const inst1 = InstantFns.create(5400000000000n)

    expect(InstantFns.diffHours(inst1, inst0)).toBe(-1.5)
    expect(InstantFns.diffSeconds(inst1, inst0)).toBe(-5400)
  })

  it('rounds with string and object options', () => {
    const inst0 = InstantFns.create(0n)
    const inst1 = InstantFns.create(5400000000000n)
    const inst2 = InstantFns.create(6000000000000n)

    expect(InstantFns.diffHours(inst0, inst1, 'floor')).toBe(1)
    expect(
      InstantFns.diffMinutes(inst0, inst2, {
        roundingIncrement: 30,
        roundingMode: 'floor',
      }),
    ).toBe(90)
  })

  it('rejects invalid rounding options', () => {
    const inst0 = InstantFns.create(0n)
    const inst1 = InstantFns.create(5400000000000n)

    expect(() =>
      InstantFns.diffNanoseconds(inst0, inst1, 'halfExpanddd' as any),
    ).toThrow(RangeError)
  })
})

describe('roundToHour', () => {
  it('works without options', () => {
    const inst0 = InstantFns.fromString('2024-01-01T00:30:00+01:00')
    const inst1 = InstantFns.roundToHour(inst0)
    expectInstantEquals(inst1, 1704067200000000000n)
  })

  it('rounds to each named time unit', () => {
    const inst = InstantFns.fromString('2024-01-01T12:34:56.789123456Z')

    const cases: [string, string, typeof InstantFns.roundToHour][] = [
      ['2024-01-01T12:00:00Z', '2024-01-01T13:00:00Z', InstantFns.roundToHour],
      [
        '2024-01-01T12:34:00Z',
        '2024-01-01T12:35:00Z',
        InstantFns.roundToMinute,
      ],
      [
        '2024-01-01T12:34:56Z',
        '2024-01-01T12:34:57Z',
        InstantFns.roundToSecond,
      ],
      [
        '2024-01-01T12:34:56.789Z',
        '2024-01-01T12:34:56.789Z',
        InstantFns.roundToMillisecond,
      ],
      [
        '2024-01-01T12:34:56.789123Z',
        '2024-01-01T12:34:56.789123Z',
        InstantFns.roundToMicrosecond,
      ],
    ]

    for (const [floorExpected, halfExpandExpected, roundTo] of cases) {
      expectInstantEquals(
        roundTo(inst),
        InstantFns.fromString(halfExpandExpected).epochNanoseconds,
      )
      expectInstantEquals(
        roundTo(inst, 'floor'),
        InstantFns.fromString(floorExpected).epochNanoseconds,
      )
      expectInstantEquals(
        roundTo(inst, { roundingMode: 'floor' }),
        InstantFns.fromString(floorExpected).epochNanoseconds,
      )
    }
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

  it('has a simple no-options variant', () => {
    const inst = InstantFns.create(1704063600000000001n)
    expect(InstantFns.toBasicString(inst)).toBe(
      '2023-12-31T23:00:00.000000001Z',
    )
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
    expect(zdt.epochNanoseconds).toBe(1704063600000000001n)
    expect(zdt.timeZoneId).toBe('America/New_York')
    expect(zdt.calendarId).toBe('iso8601')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const inst = InstantFns.create(1704063600000000000n)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    }
    const s = testHotCache(() =>
      InstantFns.toLocaleString(inst, locale, options),
    )
    expect(s).toEqual('Sunday, December 31, 2023')
  })
})

describe('createFormat', () => {
  it('formats records', () => {
    const inst = InstantFns.create(1704063600000000000n)
    const format = InstantFns.createFormat('en', {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    })

    expect(format).toBeInstanceOf(Intl.DateTimeFormat)
    expect(format.format(inst)).toBe('Sunday, December 31, 2023')
  })

  it('snapshots options at construction', () => {
    const inst = InstantFns.create(1704063600000000000n)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      timeZone: 'America/New_York',
    }
    const format = InstantFns.createFormat('en', options)

    options.year = '2-digit'
    expect(format.format(inst)).toBe('2023')
  })

  it('formats parts', () => {
    const inst = InstantFns.create(1704063600000000000n)
    const format = InstantFns.createFormat('en', {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    })

    expect(format.formatToParts(inst)).toEqual([
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
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704150000000000000n)
    const format = InstantFns.createFormat('en', {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    })

    expect(format.formatRange(inst0, inst1)).toBe(
      'Sunday, December 31, 2023 – Monday, January 1, 2024',
    )
  })

  it('formats range parts', () => {
    const inst0 = InstantFns.create(1704063600000000000n)
    const inst1 = InstantFns.create(1704150000000000000n)
    const format = InstantFns.createFormat('en', {
      dateStyle: 'full',
      timeZone: 'America/New_York',
    })

    expect(format.formatRangeToParts(inst0, inst1)).toEqual([
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
