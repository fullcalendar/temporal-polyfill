import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as PlainDateFns from './plainDate'
import { itSkipNative } from './testUtils'

describe('function calendar records', () => {
  it('returns stable calendar handles', () => {
    expect(CalendarFns.getIso()).toBe(CalendarFns.getIso())
    expect(CalendarFns.getGregory()).toBe(CalendarFns.getGregory())
    expect(CalendarFns.getExotic('buddhist')).toBe(
      CalendarFns.getExotic('buddhist'),
    )
    expect(CalendarFns.getExotic('BUDDHIST')).toBe(
      CalendarFns.getExotic('buddhist'),
    )
  })

  it('creates core calendar handles for function APIs', () => {
    const isoDate = PlainDateFns.create(2024, 1, 1, CalendarFns.getIso())
    const gregoryDate = PlainDateFns.create(
      2024,
      1,
      1,
      CalendarFns.getGregory(),
    )

    expect(isoDate.calendarId).toBe('iso8601')
    expect(gregoryDate.calendarId).toBe('gregory')
  })

  it('creates Intl calendar handles for function APIs', () => {
    const date = PlainDateFns.create(
      2024,
      1,
      1,
      CalendarFns.getExotic('buddhist'),
    )

    expect(date.calendarId).toBe('buddhist')
    expect(date.year).toBe(2567)
  })

  it('returns the calendar id from valueOf', () => {
    expect(CalendarFns.getIso().valueOf()).toBe('iso8601')
    expect(CalendarFns.getGregory().valueOf()).toBe('gregory')
    expect(CalendarFns.getExotic('BUDDHIST').valueOf()).toBe('buddhist')
  })

  // Node 26 native Temporal accepts broad Intl fallback calendar IDs like
  // `islamic`. The shim rejects them because they are not concrete Temporal
  // calendar IDs, so keep this assertion covered by the forced-shim project.
  itSkipNative('rejects fallback-only Intl calendar IDs', () => {
    expect(() => CalendarFns.getExotic('islamic')).toThrow(RangeError)
  })
})
