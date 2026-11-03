import { Temporal } from '@js-temporal/polyfill'
import { describe, expect, it } from 'vitest'
import {
  endOfDay,
  endOfHour,
  endOfMicrosecond,
  endOfMillisecond,
  endOfMinute,
  endOfMonth,
  endOfSecond,
  endOfWeek,
  endOfYear,
} from '.'

describe('endOfYear', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      const zdt1 = endOfYear(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2025-01-01T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })

    it('ends before the first real instant when the next year skips midnight', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '1995-07-27T12:30:00[America/Danmarkshavn]',
      )
      const zdt1 = endOfYear(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '1996-01-01T03:00:00[America/Danmarkshavn]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      const pdt1 = endOfYear(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2025-01-01T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-27')
      const pd1 = endOfYear(pd0)
      const pd2 = Temporal.PlainDate.from('2025-01-01')
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })

  describe('PlainYearMonth', () => {
    it('works', () => {
      const pym = Temporal.PlainYearMonth.from('2024-07')
      expect(
        endOfYear(pym).equals(Temporal.PlainYearMonth.from('2024-12')),
      ).toBe(true)
    })
  })
})

describe('endOfMonth', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      const zdt1 = endOfMonth(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-08-01T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })

    it('ends before the first real instant when the next month skips midnight', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2009-05-15T12:30:00[Africa/Casablanca]',
      )
      const zdt1 = endOfMonth(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2009-06-01T01:00:00[Africa/Casablanca]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      const pdt1 = endOfMonth(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-08-01T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-27')
      const pd1 = endOfMonth(pd0)
      const pd2 = Temporal.PlainDate.from('2024-08-01')
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })
})

describe('endOfWeek', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // Saturday
      )
      const zdt1 = endOfWeek(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-22T00:00:00[America/New_York]', // next Monday
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })

    it('ends before the first real instant when the next week skips midnight', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2009-05-30T12:30:00[Africa/Casablanca]', // Saturday
      )
      const zdt1 = endOfWeek(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2009-06-01T01:00:00[Africa/Casablanca]', // next Monday
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00') // Saturday
      const pdt1 = endOfWeek(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-22T00:00:00') // next Monday
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-20') // Saturday
      const pd1 = endOfWeek(pd0)
      const pd2 = Temporal.PlainDate.from('2024-07-22') // next Monday
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })
})

describe('endOfDay', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      const zdt1 = endOfDay(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-21T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      const pdt1 = endOfDay(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-21T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('is a noop', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-20') // Saturday
      const pd1 = endOfDay(pd0 as any)
      expect(pd1.equals(pd0)).toBe(true)
    })
  })
})

describe('endOfHour', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      const zdt1 = endOfHour(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T13:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      const pdt1 = endOfHour(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T13:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainTime', () => {
    it('works', () => {
      const pt = Temporal.PlainTime.from('12:30:44.400002003')
      expect(
        endOfHour(pt).equals(Temporal.PlainTime.from('12:59:59.999999999')),
      ).toBe(true)
    })
  })
})

describe('endOfMinute', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:30[America/New_York]',
      )
      const zdt1 = endOfMinute(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:31:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:30')
      const pdt1 = endOfMinute(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:31:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainTime', () => {
    it('works', () => {
      const pt = Temporal.PlainTime.from('12:30:44.400002003')
      expect(
        endOfMinute(pt).equals(Temporal.PlainTime.from('12:30:59.999999999')),
      ).toBe(true)
    })
  })
})

describe('endOfSecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.5[America/New_York]',
      )
      const zdt1 = endOfSecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:45[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.5')
      const pdt1 = endOfSecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:45')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainTime', () => {
    it('works', () => {
      const pt = Temporal.PlainTime.from('12:30:44.400002003')
      expect(
        endOfSecond(pt).equals(Temporal.PlainTime.from('12:30:44.999999999')),
      ).toBe(true)
    })
  })
})

describe('endOfMillisecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4023[America/New_York]',
      )
      const zdt1 = endOfMillisecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.403[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4023')
      const pdt1 = endOfMillisecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.403')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainTime', () => {
    it('works', () => {
      const pt = Temporal.PlainTime.from('12:30:44.400002003')
      expect(
        endOfMillisecond(pt).equals(
          Temporal.PlainTime.from('12:30:44.400999999'),
        ),
      ).toBe(true)
    })
  })
})

describe('endOfMicrosecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4000023[America/New_York]',
      )
      const zdt1 = endOfMicrosecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.400003[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4000023')
      const pdt1 = endOfMicrosecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.400003')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainTime', () => {
    it('works', () => {
      const pt = Temporal.PlainTime.from('12:30:44.400002003')
      expect(
        endOfMicrosecond(pt).equals(
          Temporal.PlainTime.from('12:30:44.400002999'),
        ),
      ).toBe(true)
    })
  })
})

describe('a day that does not start at midnight', () => {
  // Midnight is skipped on 2018-11-04 in Sao Paulo, so the day starts at 01:00
  const zone = '[America/Sao_Paulo]'
  const end = `2018-11-04T23:59:59.999999999-02:00${zone}`

  it('endOfDay stops at the next midnight', () => {
    const zdt = Temporal.ZonedDateTime.from(`2018-11-04T12:00:00-02:00${zone}`)
    expect(endOfDay(zdt).toString()).toBe(end)
  })

  it('endOfWeek ends on the transition day', () => {
    const zdt = Temporal.ZonedDateTime.from(`2018-11-01T12:00:00-03:00${zone}`)
    expect(endOfWeek(zdt).toString()).toBe(end)
  })
})

describe('a period whose first day does not start at midnight', () => {
  // Each of these days starts at 01:00. Adding a period to that start keeps the 01:00.
  it('endOfMonth stops at the next midnight', () => {
    const zdt = Temporal.ZonedDateTime.from('2014-08-15T12:00[Africa/Cairo]')
    expect(endOfMonth(zdt).toString()).toBe(
      '2014-08-31T23:59:59.999999999+03:00[Africa/Cairo]',
    )
  })

  it('endOfYear stops at the next midnight', () => {
    const zdt = Temporal.ZonedDateTime.from('1975-01-15T12:00[Africa/Bissau]')
    expect(endOfYear(zdt).toString()).toBe(
      '1975-12-31T23:59:59.999999999+00:00[Africa/Bissau]',
    )
  })
})

describe('a period whose last day does not exist', () => {
  // 1994-12-31 was skipped in Kiritimati, going from -10:00 to +14:00
  const end = '1994-12-30T23:59:59.999999999-10:00[Pacific/Kiritimati]'

  it.each([
    ['endOfMonth', endOfMonth],
    ['endOfYear', endOfYear],
    ['endOfDay', endOfDay],
  ])('%s stops before the first instant of the next day', (_name, fn) => {
    const zdt = Temporal.ZonedDateTime.from(
      '1994-12-30T12:00[Pacific/Kiritimati]',
    )
    expect(fn(zdt).toString()).toBe(end)
  })

  it('endOfMonth gets there from earlier in the month', () => {
    const zdt = Temporal.ZonedDateTime.from(
      '1994-12-15T12:00[Pacific/Kiritimati]',
    )
    expect(endOfMonth(zdt).toString()).toBe(end)
  })
})

describe('non-ISO calendars', () => {
  it('endOfYear finds the last month of a leap year', () => {
    const date = Temporal.PlainDate.from('2024-03-11[u-ca=hebrew]')
    const end = endOfYear(date)
    expect(end.toString()).toBe('2024-10-02[u-ca=hebrew]')
    expect(end.monthCode).toBe('M12')
    expect(end.add({ days: 1 }).year).toBe(date.year + 1)
  })

  it('endOfMonth finds the last day of a leap month', () => {
    const date = Temporal.PlainDate.from('2024-02-10[u-ca=hebrew]') // Adar I
    expect(date.monthCode).toBe('M05L')
    const end = endOfMonth(date)
    expect(end.monthCode).toBe('M05L')
    expect(end.add({ days: 1 }).monthCode).toBe('M06')
  })
})

describe('at the limits of the supported range', () => {
  it('a period that starts before the earliest date still has an end', () => {
    const zdt = Temporal.ZonedDateTime.from('-271821-04-20T00:00:00+00:00[UTC]')
    expect(endOfMonth(zdt).toString()).toBe(
      '-271821-04-30T23:59:59.999999999+00:00[UTC]',
    )
    expect(endOfYear(zdt).toString()).toBe(
      '-271821-12-31T23:59:59.999999999+00:00[UTC]',
    )
    expect(endOfWeek(zdt).toString()).toBe(
      '-271821-04-25T23:59:59.999999999+00:00[UTC]',
    )

    const date = Temporal.PlainDate.from('-271821-04-19')
    expect(endOfMonth(date).toString()).toBe('-271821-04-30')
    expect(endOfYear(date).toString()).toBe('-271821-12-31')

    const yearMonth = Temporal.PlainYearMonth.from('-271821-04')
    expect(endOfYear(yearMonth).toString()).toBe('-271821-12')
  })

  it('PlainDateTime has an end of every unit in its first moments', () => {
    const dateTime = Temporal.PlainDateTime.from(
      '-271821-04-19T00:00:00.000000001',
    )
    const day = '-271821-04-19T'
    expect(endOfDay(dateTime).toString()).toBe(`${day}23:59:59.999999999`)
    expect(endOfHour(dateTime).toString()).toBe(`${day}00:59:59.999999999`)
    expect(endOfMinute(dateTime).toString()).toBe(`${day}00:00:59.999999999`)
    expect(endOfSecond(dateTime).toString()).toBe(`${day}00:00:00.999999999`)
    expect(endOfMillisecond(dateTime).toString()).toBe(
      `${day}00:00:00.000999999`,
    )
    expect(endOfMicrosecond(dateTime).toString()).toBe(
      `${day}00:00:00.000000999`,
    )
  })

  it('PlainDateTime has an end of its last day', () => {
    const dateTime = Temporal.PlainDateTime.from('+275760-09-13T12:00')
    expect(endOfDay(dateTime).toString()).toBe(
      '+275760-09-13T23:59:59.999999999',
    )
  })

  it('a zoned end just before the latest instant is in range', () => {
    const zdt = Temporal.ZonedDateTime.from('+275760-09-12T23:30:00+00:00[UTC]')
    expect(endOfDay(zdt).toString()).toBe(
      '+275760-09-12T23:59:59.999999999+00:00[UTC]',
    )
  })

  it('an end past the limit still throws', () => {
    const zdt = Temporal.ZonedDateTime.from('+275760-09-13T00:00:00+00:00[UTC]')
    expect(() => endOfDay(zdt)).toThrow(RangeError)
    expect(() => endOfMonth(zdt)).toThrow(RangeError)
    const date = Temporal.PlainDate.from('+275760-09-13')
    expect(() => endOfMonth(date)).toThrow(RangeError)
  })
})
