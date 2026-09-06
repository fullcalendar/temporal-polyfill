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
