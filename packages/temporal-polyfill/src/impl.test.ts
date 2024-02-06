import { describe, expect, it } from 'vitest'
import { DateTimeFormat, Temporal } from './impl'

describe('Intl.DateTimeFormat', () => {
  // https://github.com/fullcalendar/temporal-polyfill/issues/25
  it('Can be called without new', () => {
    const format = DateTimeFormat('en-US', { year: 'numeric' })!
    const pd = Temporal.PlainDate.from('2024-01-01')
    const s = format.format(pd)
    expect(s).toBe('2024')
  })
})
