import { describe, expect, it } from 'vitest'
import { Temporal as TemporalFull } from './impl'

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
