import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { withDayOfWeek, withDayOfYear, withWeekOfYear } from '.'

describe('withDayOfYear', () => {
  describe('ZonedDateTime', () => {
    it('works with ISO calendar (and coerces to integer)', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-02-27T12:30:00[America/New_York]',
      )
      const zdtExp = Temporal.ZonedDateTime.from(
        '2024-01-05T12:30:00[America/New_York]',
      )

      const zdt1 = withDayOfYear(zdt0, 5)
      expect(zdt1.equals(zdtExp)).toBe(true)

      // coerce...
      const zdt2 = withDayOfYear(zdt0, '5.5' as any)
      expect(zdt2.equals(zdtExp)).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works with ISO calendar', () => {
      const pdt = Temporal.PlainDateTime.from('2024-02-27T12:30:00')
      expect(
        withDayOfYear(pdt, 5).equals(
          Temporal.PlainDateTime.from('2024-01-05T12:30:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works with non-ISO calendar', () => {
      const pd = Temporal.PlainDate.from('2024-02-27[u-ca=hebrew]')
      expect(
        withDayOfYear(pd, 5).equals(
          Temporal.PlainDate.from('2023-09-20[u-ca=hebrew]'),
        ),
      ).toBe(true)
    })
  })
})

describe('withDayOfWeek', () => {
  describe('ZonedDateTime', () => {
    it('works with ISO calendar (and coerces to integer)', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-02-27T12:30:00[America/New_York]',
      )
      const zdtExp = Temporal.ZonedDateTime.from(
        '2024-02-29T12:30:00[America/New_York]',
      )

      const zdt1 = withDayOfWeek(zdt0, 4)
      expect(zdt1.equals(zdtExp)).toBe(true)

      // coerce...
      const zdt2 = withDayOfWeek(zdt0, '4.5' as any)
      expect(zdt2.equals(zdtExp)).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works with ISO calendar (and coerces to integer)', () => {
      const pdt = Temporal.PlainDateTime.from('2024-02-27T12:30:00')
      expect(
        withDayOfWeek(pdt, 4).equals(
          Temporal.PlainDateTime.from('2024-02-29T12:30:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works with non-ISO calendar', () => {
      const pd = Temporal.PlainDate.from('2024-02-27[u-ca=hebrew]')
      expect(
        withDayOfWeek(pd, 4).equals(
          Temporal.PlainDate.from('2024-02-29[u-ca=hebrew]'),
        ),
      ).toBe(true)
    })
  })
})

describe('withWeekOfYear', () => {
  describe('ZonedDateTime', () => {
    it('works with ISO calendar (and coerces to integer)', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-02-27T12:30:00[America/New_York]', // weekOfYear:9, yearOfWeek:2024
      )
      const zdtExp = Temporal.ZonedDateTime.from(
        '2024-07-02T12:30:00-04:00[America/New_York]',
      )
      const yearExp = 2024

      const zdt1 = withWeekOfYear(zdt0, 27)
      expect(zdt1.equals(zdtExp)).toBe(true)
      expect(zdt1.yearOfWeek).toBe(yearExp)

      // coerce...
      const zdt2 = withWeekOfYear(zdt0, '27.5' as any)
      expect(zdt2.equals(zdtExp)).toBe(true)
      expect(zdt2.yearOfWeek).toBe(yearExp)
    })
  })

  describe('PlainDateTime', () => {
    it('works with ISO calendar', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-02-27T12:30:00') // weekOfYear:9, yearOfWeek:2024
      const pdExp = Temporal.PlainDateTime.from('2024-07-02T12:30:00')
      const yearExp = 2024

      const pdt1 = withWeekOfYear(pdt0, 27)
      expect(pdt1.equals(pdExp)).toBe(true)
      expect(pdt1.yearOfWeek).toBe(yearExp)
    })
  })

  describe('PlainDate', () => {
    it('works with ISO calendar', () => {
      const pd0 = Temporal.PlainDate.from('2024-02-27') // weekOfYear:9, yearOfWeek:2024
      const pdExp = Temporal.PlainDate.from('2024-07-02')
      const yearExp = 2024

      const pd1 = withWeekOfYear(pd0, 27)
      expect(withWeekOfYear(pd0, 27).equals(pdExp)).toBe(true)
      expect(pd1.yearOfWeek).toBe(yearExp)
    })

    it('errors on calendars that do not support week numbers', () => {
      const pd = Temporal.PlainDate.from('2024-02-27[u-ca=hebrew]')
      expect(() => {
        withWeekOfYear(pd, 27)
      }).toThrowError(RangeError)
    })
  })
})
