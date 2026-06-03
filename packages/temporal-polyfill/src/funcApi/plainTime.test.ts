import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainTimeFns from './plainTime'
import {
  expectDurationEquals,
  expectPlainTimeEquals,
  testHotCache,
} from './testUtils'

const timeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
} satisfies Intl.DateTimeFormatOptions

const timeRangeFormatOptions = {
  timeStyle: 'medium',
  timeZone: 'UTC',
} satisfies Intl.DateTimeFormatOptions

function createExpectedDate(hour: number, minute: number) {
  // PlainTime formatting converts wall-clock fields to a neutral UTC epoch.
  return new Date(Date.UTC(1970, 0, 1, hour, minute))
}

function createExpectedFormat(
  options: Intl.DateTimeFormatOptions = timeFormatOptions,
) {
  return new Intl.DateTimeFormat('en', options)
}

describe('create', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    expectPlainTimeEquals(pt, {
      hour: 12,
      minute: 30,
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pt = PlainTimeFns.fromString('12:30')
    expectPlainTimeEquals(pt, {
      hour: 12,
      minute: 30,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pt = PlainTimeFns.fromFields({
      hour: 12,
    })
    expectPlainTimeEquals(pt, {
      hour: 12,
    })
  })
})

describe('time field getters', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30)
    expect({
      hour: pt.hour,
      minute: pt.minute,
      second: pt.second,
      millisecond: pt.millisecond,
      microsecond: pt.microsecond,
      nanosecond: pt.nanosecond,
    }).toEqual({
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
      hour: 12,
      minute: 45,
      second: 1,
    })
  })
})

describe('add', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.add(pt0, d)
    expectPlainTimeEquals(pt1, {
      hour: 2,
      minute: 45,
    })
  })
})

describe('add*', () => {
  it('advances by one time unit', () => {
    const pt = PlainTimeFns.create()

    expectPlainTimeEquals(PlainTimeFns.addHours(pt, 1), { hour: 1 })
    expectPlainTimeEquals(PlainTimeFns.addMinutes(pt, 1), { minute: 1 })
    expectPlainTimeEquals(PlainTimeFns.addSeconds(pt, 1), { second: 1 })
    expectPlainTimeEquals(PlainTimeFns.addMilliseconds(pt, 1), {
      millisecond: 1,
    })
    expectPlainTimeEquals(PlainTimeFns.addMicroseconds(pt, 1), {
      microsecond: 1,
    })
    expectPlainTimeEquals(PlainTimeFns.addNanoseconds(pt, 1), {
      nanosecond: 1,
    })
  })

  it('wraps around midnight', () => {
    const pt = PlainTimeFns.create(23, 30)

    expectPlainTimeEquals(PlainTimeFns.addHours(pt, 1), {
      hour: 0,
      minute: 30,
    })
  })

  it('rejects non-integer units', () => {
    const pt = PlainTimeFns.create()

    expect(() => PlainTimeFns.addHours(pt, 1.5)).toThrow(RangeError)
  })
})

describe('subtract', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const d = DurationFns.create(0, 0, 0, 0, 14, 15) // +14:15
    const pt1 = PlainTimeFns.subtract(pt0, d)
    expectPlainTimeEquals(pt1, {
      hour: 22,
      minute: 15,
    })
  })
})

describe('subtract*', () => {
  it('rewinds by one time unit', () => {
    const pt = PlainTimeFns.create(1)

    expectPlainTimeEquals(PlainTimeFns.subtractHours(pt, 1), {})
    expectPlainTimeEquals(PlainTimeFns.subtractMinutes(pt, 1), {
      hour: 0,
      minute: 59,
    })
    expectPlainTimeEquals(PlainTimeFns.subtractSeconds(pt, 1), {
      hour: 0,
      minute: 59,
      second: 59,
    })
    expectPlainTimeEquals(PlainTimeFns.subtractMilliseconds(pt, 1), {
      hour: 0,
      minute: 59,
      second: 59,
      millisecond: 999,
    })
    expectPlainTimeEquals(PlainTimeFns.subtractMicroseconds(pt, 1), {
      hour: 0,
      minute: 59,
      second: 59,
      millisecond: 999,
      microsecond: 999,
    })
    expectPlainTimeEquals(PlainTimeFns.subtractNanoseconds(pt, 1), {
      hour: 0,
      minute: 59,
      second: 59,
      millisecond: 999,
      microsecond: 999,
      nanosecond: 999,
    })
  })

  it('wraps around midnight', () => {
    const pt = PlainTimeFns.create(0, 30)

    expectPlainTimeEquals(PlainTimeFns.subtractHours(pt, 1), {
      hour: 23,
      minute: 30,
    })
  })

  it('rejects non-integer units', () => {
    const pt = PlainTimeFns.create()

    expect(() => PlainTimeFns.subtractHours(pt, 1.5)).toThrow(RangeError)
  })
})

describe('diff', () => {
  it('works', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(22, 45)
    const d = PlainTimeFns.diff(pt0, pt1)
    expectDurationEquals(d, {
      hours: 10,
      minutes: 15,
    })
  })
})

describe('diff*', () => {
  it('gives exact totals when no rounding mode is provided', () => {
    const pt0 = PlainTimeFns.create(12)
    const pt1 = PlainTimeFns.create(13, 30)

    expect(PlainTimeFns.diffHours(pt0, pt1)).toBe(1.5)
    expect(PlainTimeFns.diffMinutes(pt0, pt1)).toBe(90)
    expect(PlainTimeFns.diffSeconds(pt0, pt1)).toBe(5400)
    expect(PlainTimeFns.diffMilliseconds(pt0, pt1)).toBe(5400000)
    expect(PlainTimeFns.diffMicroseconds(pt0, pt1)).toBe(5400000000)
    expect(PlainTimeFns.diffNanoseconds(pt0, pt1)).toBe(5400000000000)
  })

  it('does not wrap across midnight', () => {
    const pt0 = PlainTimeFns.create(23)
    const pt1 = PlainTimeFns.create(1)

    expect(PlainTimeFns.diffHours(pt0, pt1)).toBe(-22)
  })

  it('rounds to the requested unit increment', () => {
    const pt0 = PlainTimeFns.create(12)
    const pt1 = PlainTimeFns.create(13, 31)

    expect(PlainTimeFns.diffHours(pt0, pt1, 'floor')).toBe(1)
    expect(
      PlainTimeFns.diffMinutes(pt0, pt1, {
        roundingMode: 'floor',
        roundingIncrement: 30,
      }),
    ).toBe(90)
  })

  it('validates rounding mode names', () => {
    const pt0 = PlainTimeFns.create(12)
    const pt1 = PlainTimeFns.create(13)

    expect(() =>
      PlainTimeFns.diffNanoseconds(pt0, pt1, 'halfExpanddd' as any),
    ).toThrow(RangeError)
  })
})

describe('roundToHour', () => {
  it('works without options', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.roundToHour(pt0)
    expectPlainTimeEquals(pt1, {
      hour: 13,
    })
  })

  it('rounds to each named time unit', () => {
    const pt = PlainTimeFns.create(12, 34, 56, 789, 123, 456)

    const cases: [
      typeof PlainTimeFns.roundToHour,
      Partial<PlainTimeFns.Record>,
      Partial<PlainTimeFns.Record>,
    ][] = [
      [PlainTimeFns.roundToHour, { hour: 12 }, { hour: 13 }],
      [
        PlainTimeFns.roundToMinute,
        { hour: 12, minute: 34 },
        { hour: 12, minute: 35 },
      ],
      [
        PlainTimeFns.roundToSecond,
        { hour: 12, minute: 34, second: 56 },
        { hour: 12, minute: 34, second: 57 },
      ],
      [
        PlainTimeFns.roundToMillisecond,
        { hour: 12, minute: 34, second: 56, millisecond: 789 },
        { hour: 12, minute: 34, second: 56, millisecond: 789 },
      ],
      [
        PlainTimeFns.roundToMicrosecond,
        {
          hour: 12,
          minute: 34,
          second: 56,
          millisecond: 789,
          microsecond: 123,
        },
        {
          hour: 12,
          minute: 34,
          second: 56,
          millisecond: 789,
          microsecond: 123,
        },
      ],
    ]

    for (const [roundTo, floorExpected, halfExpandExpected] of cases) {
      expectPlainTimeEquals(roundTo(pt), halfExpandExpected)
      expectPlainTimeEquals(roundTo(pt, 'floor'), floorExpected)
      expectPlainTimeEquals(
        roundTo(pt, { roundingMode: 'floor' }),
        floorExpected,
      )
    }
  })
})

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

describe('startOfHour', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.startOfHour(pt), { hour: 12 })
  })
})

describe('startOfMinute', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.startOfMinute(pt), {
      hour: 12,
      minute: 30,
    })
  })
})

describe('startOfSecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.startOfSecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
    })
  })
})

describe('startOfMillisecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.startOfMillisecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
      millisecond: 400,
    })
  })
})

describe('startOfMicrosecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.startOfMicrosecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
      millisecond: 400,
      microsecond: 2,
    })
  })
})

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

describe('endOfHour', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.endOfHour(pt), {
      hour: 12,
      minute: 59,
      second: 59,
      millisecond: 999,
      microsecond: 999,
      nanosecond: 999,
    })
  })
})

describe('endOfMinute', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.endOfMinute(pt), {
      hour: 12,
      minute: 30,
      second: 59,
      millisecond: 999,
      microsecond: 999,
      nanosecond: 999,
    })
  })
})

describe('endOfSecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.endOfSecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
      millisecond: 999,
      microsecond: 999,
      nanosecond: 999,
    })
  })
})

describe('endOfMillisecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.endOfMillisecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
      millisecond: 400,
      microsecond: 999,
      nanosecond: 999,
    })
  })
})

describe('endOfMicrosecond', () => {
  it('works', () => {
    const pt = PlainTimeFns.create(12, 30, 44, 400, 2, 3)
    expectPlainTimeEquals(PlainTimeFns.endOfMicrosecond(pt), {
      hour: 12,
      minute: 30,
      second: 44,
      millisecond: 400,
      microsecond: 2,
      nanosecond: 999,
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

describe('toSimpleString', () => {
  it('uses automatic fractional-second formatting', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(12, 30, 0, 123)
    expect(PlainTimeFns.toSimpleString(pt0)).toBe('12:30:00')
    expect(PlainTimeFns.toSimpleString(pt1)).toBe('12:30:00.123')
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

describe('createFormat', () => {
  it('formats records', () => {
    const pt = PlainTimeFns.create(12, 30)
    const format = PlainTimeFns.createFormat('en', timeFormatOptions)
    const expectedFormat = createExpectedFormat()
    const expectedDate = createExpectedDate(12, 30)

    expect(format).toBeInstanceOf(Intl.DateTimeFormat)
    expect(format.format(pt)).toBe(expectedFormat.format(expectedDate))
  })

  it('snapshots options at construction', () => {
    const pt = PlainTimeFns.create(12, 30)
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit' }
    const format = PlainTimeFns.createFormat('en', options)
    const expectedFormat = createExpectedFormat({
      hour: '2-digit',
      timeZone: 'UTC',
    })
    const expectedDate = createExpectedDate(12, 30)

    options.hour = 'numeric'
    expect(format.format(pt)).toBe(expectedFormat.format(expectedDate))
  })

  it('formats parts', () => {
    const pt = PlainTimeFns.create(12, 30)
    const format = PlainTimeFns.createFormat('en', timeFormatOptions)
    const expectedFormat = createExpectedFormat()
    const expectedDate = createExpectedDate(12, 30)

    expect(format.formatToParts(pt)).toEqual(
      expectedFormat.formatToParts(expectedDate),
    )
  })

  it('formats ranges', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(14, 45)
    const format = PlainTimeFns.createFormat('en', { timeStyle: 'long' })
    const expectedFormat = createExpectedFormat(timeRangeFormatOptions)
    const expectedDate0 = createExpectedDate(12, 30)
    const expectedDate1 = createExpectedDate(14, 45)

    expect(format.formatRange(pt0, pt1)).toBe(
      expectedFormat.formatRange(expectedDate0, expectedDate1),
    )
  })

  it('formats range parts', () => {
    const pt0 = PlainTimeFns.create(12, 30)
    const pt1 = PlainTimeFns.create(14, 45)
    const format = PlainTimeFns.createFormat('en', { timeStyle: 'long' })
    const expectedFormat = createExpectedFormat(timeRangeFormatOptions)
    const expectedDate0 = createExpectedDate(12, 30)
    const expectedDate1 = createExpectedDate(14, 45)

    expect(format.formatRangeToParts(pt0, pt1)).toEqual(
      expectedFormat.formatRangeToParts(expectedDate0, expectedDate1),
    )
  })
})
