import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import {
  endOfDay,
  endOfHour,
  endOfMicrosecond,
  endOfMillisecond,
  endOfMinute,
  endOfMonth,
  endOfSecond,
  endOfWeek,
  endOfYear,
} from '.'

describe('endOfYear', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      const zdt1 = endOfYear(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2025-01-01T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      const pdt1 = endOfYear(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2025-01-01T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-27')
      const pd1 = endOfYear(pd0)
      const pd2 = Temporal.PlainDate.from('2025-01-01')
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })
})

describe('endOfMonth', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      const zdt1 = endOfMonth(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-08-01T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      const pdt1 = endOfMonth(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-08-01T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-27')
      const pd1 = endOfMonth(pd0)
      const pd2 = Temporal.PlainDate.from('2024-08-01')
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })
})

describe('endOfWeek', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // Saturday
      )
      const zdt1 = endOfWeek(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-22T00:00:00[America/New_York]', // next Monday
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00') // Saturday
      const pdt1 = endOfWeek(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-22T00:00:00') // next Monday
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-20') // Saturday
      const pd1 = endOfWeek(pd0)
      const pd2 = Temporal.PlainDate.from('2024-07-22') // next Monday
      expect(pd1.equals(pd2.subtract({ days: 1 }))).toBe(true)
    })
  })
})

describe('endOfDay', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      const zdt1 = endOfDay(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-21T00:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      const pdt1 = endOfDay(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-21T00:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('is a noop', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-20') // Saturday
      const pd1 = endOfDay(pd0 as any)
      expect(pd1.equals(pd0)).toBe(true)
    })
  })
})

describe('endOfHour', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      const zdt1 = endOfHour(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T13:00:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      const pdt1 = endOfHour(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T13:00:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })
})

describe('endOfMinute', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:30[America/New_York]',
      )
      const zdt1 = endOfMinute(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:31:00[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:30')
      const pdt1 = endOfMinute(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:31:00')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })
})

describe('endOfSecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.5[America/New_York]',
      )
      const zdt1 = endOfSecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:45[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.5')
      const pdt1 = endOfSecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:45')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })
})

describe('endOfMillisecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4023[America/New_York]',
      )
      const zdt1 = endOfMillisecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.403[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4023')
      const pdt1 = endOfMillisecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.403')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })
})

describe('endOfMicrosecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4000023[America/New_York]',
      )
      const zdt1 = endOfMicrosecond(zdt0)
      const zdt2 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.400003[America/New_York]',
      )
      expect(zdt1.equals(zdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4000023')
      const pdt1 = endOfMicrosecond(pdt0)
      const pdt2 = Temporal.PlainDateTime.from('2024-07-20T12:30:44.400003')
      expect(pdt1.equals(pdt2.subtract({ nanoseconds: 1 }))).toBe(true)
    })
  })
})
