import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { roundToMonth, roundToWeek, roundToYear } from '.'

describe('roundToYear', () => {
  describe('ZonedDateTime', () => {
    it('works without options', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      expect(
        roundToYear(zdt).equals(
          Temporal.ZonedDateTime.from('2025-01-01T00:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works with single roundingMode arg', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      expect(
        roundToYear(pdt, 'floor').equals(
          Temporal.PlainDateTime.from('2024-01-01T00:00:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works with options', () => {
      const pd = Temporal.PlainDate.from('2024-07-27')
      expect(
        roundToYear(pd, {
          roundingMode: 'floor',
          roundingIncrement: 1,
        }).equals(Temporal.PlainDate.from('2024-01-01')),
      ).toBe(true)
      expect(() => {
        roundToYear(pd, {
          roundingMode: 'floor',
          roundingIncrement: 2 as any, // not allowed
        })
      }).toThrowError(RangeError)
    })
  })
})

describe('roundToMonth', () => {
  describe('ZonedDateTime', () => {
    it('works without options', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      expect(
        roundToMonth(zdt).equals(
          Temporal.ZonedDateTime.from('2024-08-01T00:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works with single roundingMode arg', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      expect(
        roundToMonth(pdt, 'floor').equals(
          Temporal.PlainDateTime.from('2024-07-01T00:00:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works with options', () => {
      const pd = Temporal.PlainDate.from('2024-07-27')
      expect(
        roundToMonth(pd, {
          roundingMode: 'floor',
          roundingIncrement: 1,
        }).equals(Temporal.PlainDate.from('2024-07-01')),
      ).toBe(true)
      expect(() => {
        roundToMonth(pd, {
          roundingMode: 'floor',
          roundingIncrement: 2 as any, // not allowed
        })
      }).toThrowError(RangeError)
    })
  })
})

describe('roundToWeek', () => {
  describe('ZonedDateTime', () => {
    it('works without options', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // Saturday
      )
      expect(
        roundToWeek(zdt).equals(
          Temporal.ZonedDateTime.from(
            '2024-07-22T00:00:00[America/New_York]', // next Monday
          ),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works with single roundingMode arg', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:00') // Saturday
      expect(
        roundToWeek(pdt, 'floor').equals(
          Temporal.PlainDateTime.from('2024-07-15T00:00:00'), // this Monday
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works with options', () => {
      const pd = Temporal.PlainDate.from('2024-07-20') // Saturday
      expect(
        roundToWeek(pd, {
          roundingMode: 'floor',
          roundingIncrement: 1,
        }).equals(
          Temporal.PlainDate.from('2024-07-15'), // this Monday
        ),
      ).toBe(true)
      expect(() => {
        roundToWeek(pd, {
          roundingMode: 'floor',
          roundingIncrement: 2 as any, // not allowed
        })
      }).toThrowError(RangeError)
    })
  })
})
