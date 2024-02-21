import { describe, expect, it } from 'vitest'
import { Intl, Temporal, toTemporalInstant } from './impl'

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
      const format = Intl.DateTimeFormat('en-US', { year: 'numeric' })
      const pd = Temporal.PlainDate.from('2024-01-01')
      const s = format.format(pd)
      expect(s).toBe('2024')
    })
  })

  describe('format', () => {
    it('is always bound', () => {
      const format = new Intl.DateTimeFormat('en-US', { year: 'numeric' })
      const pd = Temporal.PlainDate.from('2024-01-01')
      const formatMethod = format.format
      const s = formatMethod(pd)
      expect(s).toBe('2024')
    })
  })

  describe('supportedLocalesOf', () => {
    it('works', () => {
      const locales = Intl.DateTimeFormat.supportedLocalesOf(['en', 'es'])
      expect(locales.length).toBe(2)
    })
  })
})

describe('Intl', () => {
  it('Has members aside from DateTimeFormat', () => {
    expect(Intl.NumberFormat).toBeTruthy()
  })
})

describe('toTemporalInstant', () => {
  it('works when call with Date as this-context', () => {
    const legacyDate = new Date(1708485414855)
    const inst = toTemporalInstant.call(legacyDate)
    expect(inst.epochNanoseconds).toBe(1708485414855000000n)
  })
})
