import { describe, expect, it } from 'vitest'
import { DateTimeFormat, Temporal } from './impl'

describe('Temporal.Duration', () => {
  it('most likely falls back to toString', () => {
    const d = Temporal.Duration.from({ days: 2 })
    const s = d.toLocaleString(d)
    expect(s).toBeTruthy()
  })
})

describe('Intl.DateTimeFormat', () => {
  describe('constructor', () => {
    // https://github.com/fullcalendar/temporal-polyfill/issues/25
    it('can be called without new', () => {
      const format = DateTimeFormat('en-US', { year: 'numeric' })
      const pd = Temporal.PlainDate.from('2024-01-01')
      const s = format.format(pd)
      expect(s).toBe('2024')
    })
  })

  describe('format', () => {
    it('is always bound', () => {
      const format = new DateTimeFormat('en-US', { year: 'numeric' })
      const pd = Temporal.PlainDate.from('2024-01-01')
      const formatMethod = format.format
      const s = formatMethod(pd)
      expect(s).toBe('2024')
    })
  })

  describe('supportedLocalesOf', () => {
    it('works', () => {
      const locales = DateTimeFormat.supportedLocalesOf(['en', 'es'])
      expect(locales.length).toBe(2)
    })
  })
})
