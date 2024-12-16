import { describe, expect, it } from 'vitest'
import { Intl, Temporal, toTemporalInstant } from './impl'

describe('Temporal.Duration', () => {
  it('most likely falls back to toString', () => {
    const d = Temporal.Duration.from({ days: 2 })
    const s = d.toLocaleString(d)
    expect(s).toBeTruthy()
  })

  it('gives readable error message when no valid field', () => {
    let error: TypeError | undefined

    try {
      const d = Temporal.Duration.from({ day: 5 })
      expect(d).toBeTruthy() // won't reach
    } catch (e: any) {
      error = e
    }

    expect(error).toBeInstanceOf(TypeError)
    expect(error!.toString()).toMatch(
      [
        'days',
        'hours',
        'microseconds',
        'milliseconds',
        'minutes',
        'months',
        'nanoseconds',
        'seconds',
        'weeks',
        'years',
      ].join(','),
    )
  })
})

describe('Temporal.ZonedDateTime', () => {
  describe('round', () => {
    it('only accepts day/time smallestUnit', () => {
      const zdt0 = new Temporal.ZonedDateTime(
        1709254884041880537n,
        'America/New_York',
      )
      let error: RangeError | undefined

      try {
        const zdt1 = zdt0.round({ smallestUnit: 'year' })
        expect(zdt1).toBeTruthy() // won't reach
      } catch (e: any) {
        error = e
      }

      expect(error).toBeInstanceOf(RangeError)
      expect(error!.toString()).toMatch('year') // provided
      expect(error!.toString()).toMatch('day') // max
      expect(error!.toString()).toMatch('nanosecond') // min
    })
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

  it('throws when called with invalid date', () => {
    const invalidDate = new Date(NaN)
    const t = () => {
      toTemporalInstant.call(invalidDate)
    }
    expect(t).toThrow(RangeError)
  })
})
