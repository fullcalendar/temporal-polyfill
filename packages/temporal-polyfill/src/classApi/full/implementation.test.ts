import { describe, expect, it } from 'vitest'
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
