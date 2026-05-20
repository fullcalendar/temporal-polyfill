import { describe, expect, it } from 'vitest'
import { Temporal as TemporalFull } from './full'
import { Temporal } from './impl'

describe('integration recreations', () => {
  // TODO: Contribute these double-rounding cases to the official test262
  // Temporal.Duration coverage.
  describe('issue #92: Duration double rounding', () => {
    it('accepts nanosecond durations whose exact day count is still in range', () => {
      // This value is just below the Duration day-limit boundary. It used to be
      // divided through a Number path, where double rounding pushed the
      // computed day count one day too high and caused a false RangeError.
      expect(() => {
        Temporal.Duration.from({ nanoseconds: 9007199254713599772327936 })
      }).not.toThrow()
    })

    it('preserves microsecond precision when stringifying large durations', () => {
      // The same double-rounding family affected microseconds by shifting the
      // seconds component even though the input microseconds are exactly known.
      const duration = Temporal.Duration.from({
        microseconds: 9007199254627199483904,
      })

      expect(duration.toString()).toBe('PT9007199254627199.483904S')
    })
  })

  // TODO: Report these large day-rounding precision cases to the test262
  // maintainers. Existing test262 coverage has similar Duration exactness
  // cases, but not this PlainDateTime difference repro.
  describe('issue #84: day rounding floating-point precision', () => {
    it('ceil-rounds a large duration with fractional seconds to the next day', () => {
      const rounded = Temporal.Duration.from('P100016DT0.0000001S').round({
        smallestUnit: 'day',
        roundingMode: 'ceil',
      })

      expect(rounded.toString()).toBe('P100017D')
    })

    it('ceil-rounds a large PlainDateTime difference to the next day', () => {
      const later = Temporal.PlainDateTime.from(
        '+200000-01-01T00:00:00.000000001',
      )
      const earlier = Temporal.PlainDateTime.from('-200000-01-01')

      const duration = later.since(earlier, {
        smallestUnit: 'day',
        roundingMode: 'ceil',
      })

      expect(duration.toString()).toBe('P146097001D')
    })
  })

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

  // test262 covers the same close-transition root cause through
  // getTimeZoneTransition/startOfDay tests for these zones, but not these
  // exact ZonedDateTime.from string inputs. Keep this focused regression
  // unless that API-specific coverage is contributed upstream.
  describe('issue #73: ZonedDateTime.from time-zone edge cases', () => {
    it('accepts an America/Noronha wall time near an offset transition', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2000-10-08T01:00:00-01:00[America/Noronha]',
      )

      expect(zdt.toString()).toBe('2000-10-08T01:00:00-01:00[America/Noronha]')
    })

    it('accepts an America/Boa_Vista wall time near an offset transition', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2000-10-08T03:00:00-03:00[America/Boa_Vista]',
      )

      expect(zdt.toString()).toBe(
        '2000-10-08T03:00:00-03:00[America/Boa_Vista]',
      )
    })
  })

  // No matching test262 coverage was found for future Europe/Berlin property
  // bag construction preserving the expected summer offset, so this remains
  // local regression coverage.
  describe('issue #49: future ZonedDateTime offsets are not clamped', () => {
    it('uses the expected summer offset for Europe/Berlin in the future', () => {
      const zdt = Temporal.ZonedDateTime.from({
        year: 2044,
        month: 6,
        day: 10,
        timeZone: 'Europe/Berlin',
      })

      expect(zdt.toString()).toBe('2044-06-10T00:00:00+02:00[Europe/Berlin]')
    })
  })
})
