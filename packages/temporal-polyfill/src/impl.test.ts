import { describe, expect, it } from 'vitest'
import { DateTimeFormat, Temporal } from './impl'

describe('Intl.DateTimeFormat', () => {
  // https://github.com/fullcalendar/temporal-polyfill/issues/25
  it('can be called without new', () => {
    const format = DateTimeFormat('en-US', { year: 'numeric' })
    const pd = Temporal.PlainDate.from('2024-01-01')
    const s = format.format(pd)
    expect(s).toBe('2024')
  })

  it('has a format method that is always bound', () => {
    const format = new DateTimeFormat('en-US', { year: 'numeric' })
    const pd = Temporal.PlainDate.from('2024-01-01')
    const formatMethod = format.format
    const s = formatMethod(pd)
    expect(s).toBe('2024')
  })
})
