import { describe, expect, it, vi } from 'vitest'
import { FixedTimeZone } from '../../internal/timeZone'
import { Temporal as TemporalFull } from './implementation'

describe('full entrypoint', () => {
  it('supports Intl calendars without the side-effect addon', () => {
    const date = TemporalFull.PlainDate.from({
      calendar: 'hebrew',
      year: 5784,
      month: 7,
      day: 1,
    })

    expect(date.calendarId).toBe('hebrew')
  })
})

describe('Temporal.PlainMonthDay', () => {
  it('does not expose a numeric month field', () => {
    const pmd = new TemporalFull.PlainMonthDay(6, 18)

    expect('month' in pmd).toBe(false)
    expect((pmd as any).month).toBeUndefined()
  })
})

describe('integration recreations', () => {
  // test262 mostly covers this through broad Buddhist calendar conversion
  // tests, but not this exact 1582 withCalendar repro. Consider telling the
  // test262 maintainers or contributing this focused edge case upstream.
  describe('issue #74: calendar conversion month changes incorrectly', () => {
    it('keeps the ISO date on the same Buddhist calendar month', () => {
      const date = TemporalFull.PlainDate.from({
        year: 1582,
        month: 1,
        day: 1,
      }).withCalendar('buddhist')

      expect(date.month).toBe(1)
    })
  })
})

describe('Temporal.ZonedDateTime transition result boundaries', () => {
  it.each(['next', 'previous'] as const)(
    'returns null when there is no %s transition',
    (direction) => {
      const value = new TemporalFull.ZonedDateTime(1n, 'UTC')
      expect(value.getTimeZoneTransition(direction)).toBeNull()
    },
  )

  it.each(['next', 'previous'] as const)(
    'keeps a %s transition at epoch zero',
    (direction) => {
      // Inject the internal result so this regression is independent of whether
      // the host time-zone database contains a transition exactly at the epoch.
      const transition = vi
        .spyOn(FixedTimeZone.prototype, 'getTransition')
        .mockReturnValue(0n)
      try {
        const value = new TemporalFull.ZonedDateTime(
          direction === 'next' ? -1n : 1n,
          'UTC',
          'gregory',
        )
        const result = value.getTimeZoneTransition(direction)
        expect(result).not.toBeNull()
        expect(result!.epochNanoseconds).toBe(0n)
        expect(result!.timeZoneId).toBe('UTC')
        expect(result!.calendarId).toBe('gregory')
      } finally {
        transition.mockRestore()
      }
    },
  )
})

describe('year moves from a leap month the target year lacks', () => {
  const fromLeapMonth = (year: number, monthCode: string, calendar: string) =>
    TemporalFull.PlainDate.from({ year, monthCode, day: 1, calendar })

  it('constrains to the common month when an earlier leap month shifts ordinals', () => {
    // 2004 leaps after M02, so M10 is ordinal month 11 there
    const moved = fromLeapMonth(1984, 'M10L', 'chinese').add({ years: 20 })
    expect(moved.monthCode).toBe('M10')
    expect(moved.month).toBe(11)
  })

  it('constrains to the common month when the leap month comes later', () => {
    // 2033 leaps after M11, so M10 is still ordinal month 10 there
    const moved = fromLeapMonth(1984, 'M10L', 'chinese').add({ years: 49 })
    expect(moved.monthCode).toBe('M10')
    expect(moved.month).toBe(10)
  })

  it('keeps the leap month when the target year has it', () => {
    const moved = fromLeapMonth(2009, 'M05L', 'chinese').add({ years: 19 })
    expect(moved.monthCode).toBe('M05L')
    expect(moved.month).toBe(6)
  })

  it('applies to PlainYearMonth#add', () => {
    expect(
      TemporalFull.PlainYearMonth.from({
        year: 1984,
        monthCode: 'M10L',
        calendar: 'chinese',
      }).add({ years: 20 }).monthCode,
    ).toBe('M10')
  })

  it('still rejects with overflow reject', () => {
    expect(() =>
      fromLeapMonth(1984, 'M10L', 'chinese').add(
        { years: 20 },
        { overflow: 'reject' },
      ),
    ).toThrow(RangeError)
  })

  it('until no longer throws or miscounts months', () => {
    const inChinese = (isoString: string, calendar = 'chinese') =>
      TemporalFull.PlainDate.from(isoString).withCalendar(calendar)

    expect(
      inChinese('1976-10-08')
        .until(inChinese('1968-10-05'), { largestUnit: 'year' })
        .toString(),
    ).toBe('-P8Y1D')
    expect(
      inChinese('1984-11-23', 'dangi')
        .until(inChinese('2005-06-08', 'dangi'), { largestUnit: 'year' })
        .toString(),
    ).toBe('P20Y7M1D')
  })

  it('leaves Hebrew Adar I constraining to Adar', () => {
    // 5784 is a leap year and 5785 isn't
    const moved = fromLeapMonth(5784, 'M05L', 'hebrew').add({ years: 1 })
    expect(moved.monthCode).toBe('M06')
    expect(moved.month).toBe(6)
  })
})
