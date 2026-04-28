import { describe, expect, it } from 'vitest'
import * as DurationFns from '../../dist/fns/duration'
import * as PlainYearMonthFns from '../../dist/fns/plainyearmonth'
import {
  expectDurationEquals,
  expectPlainDateEquals,
  expectPlainYearMonthEquals,
  testHotCache,
} from './testUtils'

describe('create', () => {
  it('works with a referenceDay', () => {
    const pym = PlainYearMonthFns.create(2024, 6, 'gregory', 5)
    expectPlainYearMonthEquals(pym, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 6,
      isoDay: 5,
    })
  })

  it('works without a referenceDay', () => {
    const pym = PlainYearMonthFns.create(2024, 6, 'gregory')
    expectPlainYearMonthEquals(pym, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 6,
    })
  })
})

describe('isInstance', () => {
  it('returns true for actual instance', () => {
    const pym = PlainYearMonthFns.create(2024, 6, 'gregory')
    expect(PlainYearMonthFns.isInstance(pym)).toBe(true)
  })

  it('returns false for other type of instance', () => {
    const dur = DurationFns.create()
    expect(PlainYearMonthFns.isInstance(dur)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(PlainYearMonthFns.isInstance(undefined)).toBe(false)
  })
})

describe('fromString', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.fromString('2024-06-01[u-ca=gregory]')
    expectPlainYearMonthEquals(pym, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 6,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pym = PlainYearMonthFns.fromFields({
      calendar: 'gregory',
      year: 2024,
      month: 6,
    })
    expectPlainYearMonthEquals(pym, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 6,
    })
  })
})

describe('getFields', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 6, 'gregory')
    const fields = PlainYearMonthFns.getFields(pym)
    expect(fields).toEqual({
      era: 'gregory',
      eraYear: 2024,
      year: 2024,
      monthCode: 'M06',
      month: 6,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 6, 'gregory')
    const pym1 = PlainYearMonthFns.withFields(pym0, {
      year: 2009,
    })
    expectPlainYearMonthEquals(pym1, {
      calendar: 'gregory',
      isoYear: 2009,
      isoMonth: 6,
    })
  })
})

describe('daysInMonth', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    expect(PlainYearMonthFns.daysInMonth(pym)).toBe(29)
  })
})

describe('daysInYear', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    expect(PlainYearMonthFns.daysInYear(pym)).toBe(366)
  })
})

describe('monthsInYear', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    expect(PlainYearMonthFns.monthsInYear(pym)).toBe(12)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    expect(PlainYearMonthFns.inLeapYear(pym)).toBe(true)
  })
})

describe('add', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 2)
    const pym1 = PlainYearMonthFns.add(pym0, DurationFns.create(1, 1))
    expectPlainYearMonthEquals(pym1, {
      isoYear: 2025,
      isoMonth: 3,
    })
  })

  it('ignores overflow for ISO month arithmetic', () => {
    const pym = PlainYearMonthFns.create(2023, 3)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(pym, DurationFns.create(0, -1), {
        overflow: 'reject',
      }),
      {
        isoYear: 2023,
        isoMonth: 2,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(pym, DurationFns.create(0, -1), {
        overflow: 'constrain',
      }),
      {
        isoYear: 2023,
        isoMonth: 2,
      },
    )
  })

  it('supports moving backward from the last representable month', () => {
    const last = PlainYearMonthFns.create(275760, 9)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(last, DurationFns.create(-1)),
      {
        isoYear: 275759,
        isoMonth: 9,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(last, DurationFns.create(0, -1)),
      {
        isoYear: 275760,
        isoMonth: 8,
      },
    )
  })
})

describe('subtract', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 2)
    const pym1 = PlainYearMonthFns.subtract(pym0, DurationFns.create(1, 1))
    expectPlainYearMonthEquals(pym1, {
      isoYear: 2023,
      isoMonth: 1,
    })
  })

  it('ignores overflow for ISO month arithmetic', () => {
    const pym = PlainYearMonthFns.create(2023, 3)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(pym, DurationFns.create(0, 1), {
        overflow: 'reject',
      }),
      {
        isoYear: 2023,
        isoMonth: 2,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(pym, DurationFns.create(0, 1), {
        overflow: 'constrain',
      }),
      {
        isoYear: 2023,
        isoMonth: 2,
      },
    )
  })

  it('supports moving backward from the last representable month', () => {
    const last = PlainYearMonthFns.create(275760, 9)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(last, DurationFns.create(1)),
      {
        isoYear: 275759,
        isoMonth: 9,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(last, DurationFns.create(0, 1)),
      {
        isoYear: 275760,
        isoMonth: 8,
      },
    )
  })
})

describe('until', () => {
  it('works without options', () => {
    const pym0 = PlainYearMonthFns.create(2024, 4)
    const pym1 = PlainYearMonthFns.create(2028, 2)
    const d = PlainYearMonthFns.until(pym0, pym1)
    expectDurationEquals(d, {
      years: 3,
      months: 10,
    })
  })
})

describe('since', () => {
  it('works without options', () => {
    const pym0 = PlainYearMonthFns.create(2024, 4)
    const pym1 = PlainYearMonthFns.create(2028, 2)
    const d = PlainYearMonthFns.since(pym0, pym1)
    expectDurationEquals(d, {
      years: -3,
      months: -10,
    })
  })
})

describe('equals', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 4)
    const pym1 = PlainYearMonthFns.create(2028, 2)
    expect(PlainYearMonthFns.equals(pym0, pym1)).toBe(false)
    expect(PlainYearMonthFns.equals(pym0, pym0)).toBe(true)
  })
})

describe('compare', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 4)
    const pym1 = PlainYearMonthFns.create(2028, 2)
    expect(PlainYearMonthFns.compare(pym0, pym1)).toBe(-1)
    expect(PlainYearMonthFns.compare(pym1, pym0)).toBe(1)
    expect(PlainYearMonthFns.compare(pym0, pym0)).toBe(0)
  })
})

describe('toPlainDate', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    const pd = PlainYearMonthFns.toPlainDate(pym, { day: 10 })
    expectPlainDateEquals(pd, {
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 10,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    const s = PlainYearMonthFns.toString(pym)
    expect(s).toBe('2024-02')
  })

  it('works with options', () => {
    const pym = PlainYearMonthFns.create(2024, 2)
    const s = PlainYearMonthFns.toString(pym, { calendarName: 'always' })
    expect(s).toBe('2024-02-01[u-ca=iso8601]')
  })
})

describe('toLocaleString', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2023, 12)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601', // required unfortunately
    }
    const s = testHotCache(() =>
      PlainYearMonthFns.toLocaleString(pym, locale, options),
    )
    expect(s).toBe('2023 December')
  })
})

describe('toLocaleStringParts', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2023, 12)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601', // required unfortunately
    }
    const parts = testHotCache(() =>
      PlainYearMonthFns.toLocaleStringParts(pym, locale, options),
    )
    expect(parts).toEqual([
      { type: 'year', value: '2023' },
      { type: 'literal', value: ' ' },
      { type: 'month', value: 'December' },
    ])
  })
})

describe('rangeToLocaleString', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2023, 10)
    const pym1 = PlainYearMonthFns.create(2023, 12)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601', // required unfortunately
    }
    const s = testHotCache(() =>
      PlainYearMonthFns.rangeToLocaleString(pym0, pym1, locale, options),
    )
    expect(s).toBe('2023 October–December')
  })
})

describe('rangeToLocaleStringParts', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2023, 10)
    const pym1 = PlainYearMonthFns.create(2023, 12)
    const locale = 'en'
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601', // required unfortunately
    }
    const parts = testHotCache(() =>
      PlainYearMonthFns.rangeToLocaleStringParts(pym0, pym1, locale, options),
    )
    expect(parts).toEqual([
      { source: 'shared', type: 'year', value: '2023' },
      { source: 'shared', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'month', value: 'October' },
      { source: 'shared', type: 'literal', value: '–' },
      { source: 'endRange', type: 'month', value: 'December' },
    ])
  })
})
