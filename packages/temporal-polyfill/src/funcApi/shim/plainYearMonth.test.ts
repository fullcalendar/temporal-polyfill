import { describe, expect, it } from 'vitest'
import { getGregoryCalendar } from './calendar'
import * as DurationFns from './duration'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  expectDurationEquals,
  expectPlainDateEquals,
  expectPlainYearMonthEquals,
  testHotCache,
} from './testUtils'

const gregoryCalendar = getGregoryCalendar()

describe('create', () => {
  it('works with a referenceDay', () => {
    const pym = PlainYearMonthFns.create(2024, 6, gregoryCalendar, 5)
    expectPlainYearMonthEquals(pym, {
      calendarId: 'gregory',
      year: 2024,
      month: 6,
      monthCode: 'M06',
    })
  })

  it('works without a referenceDay', () => {
    const pym = PlainYearMonthFns.create(2024, 6, gregoryCalendar)
    expectPlainYearMonthEquals(pym, {
      calendarId: 'gregory',
      year: 2024,
      month: 6,
      monthCode: 'M06',
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.fromString('2024-06-01[u-ca=gregory]')
    expectPlainYearMonthEquals(pym, {
      calendarId: 'gregory',
      year: 2024,
      month: 6,
      monthCode: 'M06',
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pym = PlainYearMonthFns.fromFields({
      calendar: gregoryCalendar,
      year: 2024,
      month: 6,
    })
    expectPlainYearMonthEquals(pym, {
      calendarId: 'gregory',
      year: 2024,
      month: 6,
      monthCode: 'M06',
    })
  })
})

describe('calendar field getters', () => {
  it('works', () => {
    const pym = PlainYearMonthFns.create(2024, 6, gregoryCalendar)
    expect({
      era: pym.era,
      eraYear: pym.eraYear,
      year: pym.year,
      monthCode: pym.monthCode,
      month: pym.month,
    }).toEqual({
      era: 'ce',
      eraYear: 2024,
      year: 2024,
      monthCode: 'M06',
      month: 6,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 6, gregoryCalendar)
    const pym1 = PlainYearMonthFns.withFields(pym0, {
      year: 2009,
    })
    expectPlainYearMonthEquals(pym1, {
      calendarId: 'gregory',
      year: 2009,
      month: 6,
      monthCode: 'M06',
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
      year: 2025,
      month: 3,
    })
  })

  it('ignores overflow for ISO month arithmetic', () => {
    const pym = PlainYearMonthFns.create(2023, 3)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(pym, DurationFns.create(0, -1), {
        overflow: 'reject',
      }),
      {
        year: 2023,
        month: 2,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(pym, DurationFns.create(0, -1), {
        overflow: 'constrain',
      }),
      {
        year: 2023,
        month: 2,
      },
    )
  })

  it('supports moving backward from the last representable month', () => {
    const last = PlainYearMonthFns.create(275760, 9)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(last, DurationFns.create(-1)),
      {
        year: 275759,
        month: 9,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.add(last, DurationFns.create(0, -1)),
      {
        year: 275760,
        month: 8,
      },
    )
  })
})

describe('subtract', () => {
  it('works', () => {
    const pym0 = PlainYearMonthFns.create(2024, 2)
    const pym1 = PlainYearMonthFns.subtract(pym0, DurationFns.create(1, 1))
    expectPlainYearMonthEquals(pym1, {
      year: 2023,
      month: 1,
    })
  })

  it('ignores overflow for ISO month arithmetic', () => {
    const pym = PlainYearMonthFns.create(2023, 3)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(pym, DurationFns.create(0, 1), {
        overflow: 'reject',
      }),
      {
        year: 2023,
        month: 2,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(pym, DurationFns.create(0, 1), {
        overflow: 'constrain',
      }),
      {
        year: 2023,
        month: 2,
      },
    )
  })

  it('supports moving backward from the last representable month', () => {
    const last = PlainYearMonthFns.create(275760, 9)

    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(last, DurationFns.create(1)),
      {
        year: 275759,
        month: 9,
      },
    )
    expectPlainYearMonthEquals(
      PlainYearMonthFns.subtract(last, DurationFns.create(0, 1)),
      {
        year: 275760,
        month: 8,
      },
    )
  })
})

describe('diff', () => {
  it('works without options', () => {
    const pym0 = PlainYearMonthFns.create(2024, 4)
    const pym1 = PlainYearMonthFns.create(2028, 2)
    const d = PlainYearMonthFns.diff(pym0, pym1)
    expectDurationEquals(d, {
      years: 3,
      months: 10,
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
      year: 2024,
      month: 2,
      day: 10,
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

describe('createFormat', () => {
  it('formats records', () => {
    const pym = PlainYearMonthFns.create(2023, 12)
    const format = PlainYearMonthFns.createFormat('en', {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601',
    })

    expect(format.format(pym)).toBe('2023 December')
  })

  it('snapshots options at construction', () => {
    const pym = PlainYearMonthFns.create(2023, 12)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      calendar: 'iso8601',
    }
    const format = PlainYearMonthFns.createFormat('en', options)

    options.year = '2-digit'
    expect(format.format(pym)).toBe('2023')
  })

  it('formats parts', () => {
    const pym = PlainYearMonthFns.create(2023, 12)
    const format = PlainYearMonthFns.createFormat('en', {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601',
    })

    expect(format.formatToParts(pym)).toEqual([
      { type: 'year', value: '2023' },
      { type: 'literal', value: ' ' },
      { type: 'month', value: 'December' },
    ])
  })

  it('formats ranges', () => {
    const pym0 = PlainYearMonthFns.create(2023, 10)
    const pym1 = PlainYearMonthFns.create(2023, 12)
    const format = PlainYearMonthFns.createFormat('en', {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601',
    })

    expect(format.formatRange(pym0, pym1)).toBe('2023 October–December')
  })

  it('formats range parts', () => {
    const pym0 = PlainYearMonthFns.create(2023, 10)
    const pym1 = PlainYearMonthFns.create(2023, 12)
    const format = PlainYearMonthFns.createFormat('en', {
      year: 'numeric',
      month: 'long',
      calendar: 'iso8601',
    })

    expect(format.formatRangeToParts(pym0, pym1)).toEqual([
      { source: 'shared', type: 'year', value: '2023' },
      { source: 'shared', type: 'literal', value: ' ' },
      { source: 'startRange', type: 'month', value: 'October' },
      { source: 'shared', type: 'literal', value: '–' },
      { source: 'endRange', type: 'month', value: 'December' },
    ])
  })
})
