import { describe, expect, it } from 'vitest'
import {
  getExoticCalendar,
  getGregoryCalendar,
  getIsoCalendar,
} from './calendar'
import * as PlainDateFns from './plainDate'
import { itSkipNative } from './testUtils'

describe('function calendar records', () => {
  it('returns stable calendar handles', () => {
    expect(getIsoCalendar()).toBe(getIsoCalendar())
    expect(getGregoryCalendar()).toBe(getGregoryCalendar())
    expect(getExoticCalendar('buddhist')).toBe(getExoticCalendar('buddhist'))
    expect(getExoticCalendar('BUDDHIST')).toBe(getExoticCalendar('buddhist'))
  })

  it('creates core calendar handles for function APIs', () => {
    const isoDate = PlainDateFns.create(2024, 1, 1, getIsoCalendar())
    const gregoryDate = PlainDateFns.create(2024, 1, 1, getGregoryCalendar())

    expect(isoDate.calendarId).toBe('iso8601')
    expect(gregoryDate.calendarId).toBe('gregory')
  })

  it('creates Intl calendar handles for function APIs', () => {
    const date = PlainDateFns.create(2024, 1, 1, getExoticCalendar('buddhist'))

    expect(date.calendarId).toBe('buddhist')
    expect(date.year).toBe(2567)
  })

  // Node 26 native Temporal accepts broad Intl fallback calendar IDs like
  // `islamic`. The shim rejects them because they are not concrete Temporal
  // calendar IDs, so keep this assertion covered by the forced-shim project.
  itSkipNative('rejects fallback-only Intl calendar IDs', () => {
    expect(() => getExoticCalendar('islamic')).toThrow(RangeError)
  })
})
