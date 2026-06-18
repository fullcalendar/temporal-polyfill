import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as PlainDateFns from './plainDate'
import { itSkipNative } from './testUtils'

const exoticCalendarGetters = [
  ['buddhist', CalendarFns.getBuddhist],
  ['chinese', CalendarFns.getChinese],
  ['dangi', CalendarFns.getDangi],
  ['coptic', CalendarFns.getCoptic],
  ['ethiopic', CalendarFns.getEthiopic],
  ['ethioaa', CalendarFns.getEthiopicAmeteAlem],
  ['hebrew', CalendarFns.getHebrew],
  ['indian', CalendarFns.getIndian],
  ['japanese', CalendarFns.getJapanese],
  ['islamic-civil', CalendarFns.getIslamicCivil],
  ['islamic-tbla', CalendarFns.getIslamicTabular],
  ['islamic-umalqura', CalendarFns.getIslamicUmmAlQura],
  ['persian', CalendarFns.getPersian],
  ['roc', CalendarFns.getROC],
] as const

describe('function calendar records', () => {
  it('returns stable calendar handles', () => {
    expect(CalendarFns.getISO()).toBe(CalendarFns.getISO())
    expect(CalendarFns.getGregory()).toBe(CalendarFns.getGregory())
    expect(CalendarFns.getExotic('buddhist')).toBe(
      CalendarFns.getExotic('buddhist'),
    )
    expect(CalendarFns.getExotic('BUDDHIST')).not.toBe(
      CalendarFns.getExotic('buddhist'),
    )
    // Basic-only and exotic-capable resolver APIs intentionally return
    // different records, even for the same raw ID, so their validation
    // policies cannot leak into each other through the record cache.
    expect(CalendarFns.getBasic('buddhist')).not.toBe(
      CalendarFns.getExotic('buddhist'),
    )

    for (const [calendarId, getCalendar] of exoticCalendarGetters) {
      expect(getCalendar()).toBe(getCalendar())
      expect(getCalendar()).toBe(CalendarFns.getExotic(calendarId))
    }
  })

  it('creates basic calendar handles for function APIs', () => {
    const isoDate = PlainDateFns.create(2024, 1, 1, CalendarFns.getISO())
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

  it('defers unknown calendar errors until function API operations use them', () => {
    const basicCalendar = CalendarFns.getBasic('something-crazy')
    const exoticCalendar = CalendarFns.getExotic('something-crazy')

    expect(basicCalendar.valueOf()).toBe('something-crazy')
    expect(exoticCalendar.valueOf()).toBe('something-crazy')
    expect(() => PlainDateFns.create(2024, 1, 1, basicCalendar)).toThrow(
      RangeError,
    )
    expect(() => PlainDateFns.create(2024, 1, 1, exoticCalendar)).toThrow(
      RangeError,
    )
  })

  it('returns the calendar id from valueOf', () => {
    expect(CalendarFns.getISO().valueOf()).toBe('iso8601')
    expect(CalendarFns.getGregory().valueOf()).toBe('gregory')
    expect(CalendarFns.getExotic('BUDDHIST').valueOf()).toBe('BUDDHIST')
    expect(CalendarFns.getExotic('BUDDHIST').toJSON()).toBe('BUDDHIST')

    for (const [calendarId, getCalendar] of exoticCalendarGetters) {
      expect(getCalendar().valueOf()).toBe(calendarId)
      expect(getCalendar().toJSON()).toBe(calendarId)
    }
  })

  // Node 26 native Temporal accepts broad Intl fallback calendar IDs like
  // `islamic`. The shim rejects them because they are not concrete Temporal
  // calendar IDs, so keep this assertion covered by the forced-shim project.
  itSkipNative('rejects fallback-only Intl calendar IDs', () => {
    expect(() => CalendarFns.getExotic('islamic')).toThrow(RangeError)
  })
})
