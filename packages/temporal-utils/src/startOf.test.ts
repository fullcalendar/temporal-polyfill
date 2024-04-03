import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import {
  startOfDay,
  startOfHour,
  startOfMicrosecond,
  startOfMillisecond,
  startOfMinute,
  startOfMonth,
  startOfSecond,
  startOfWeek,
  startOfYear,
} from '.'

describe('startOfYear', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      expect(
        startOfYear(zdt).equals(
          Temporal.ZonedDateTime.from('2024-01-01T00:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      expect(
        startOfYear(pdt).equals(
          Temporal.PlainDateTime.from('2024-01-01T00:00:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd = Temporal.PlainDate.from('2024-07-27')
      expect(
        startOfYear(pd).equals(Temporal.PlainDate.from('2024-01-01')),
      ).toBe(true)
    })
  })
})

describe('startOfMonth', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-27T12:30:00[America/New_York]',
      )
      expect(
        startOfMonth(zdt).equals(
          Temporal.ZonedDateTime.from('2024-07-01T00:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-27T12:30:00')
      expect(
        startOfMonth(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-01T00:00:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd = Temporal.PlainDate.from('2024-07-27')
      expect(
        startOfMonth(pd).equals(Temporal.PlainDate.from('2024-07-01')),
      ).toBe(true)
    })
  })
})

describe('startOfWeek', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // Saturday
      )
      expect(
        startOfWeek(zdt).equals(
          Temporal.ZonedDateTime.from(
            '2024-07-15T00:00:00[America/New_York]', // this Monday
          ),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:00') // Saturday
      expect(
        startOfWeek(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-15T00:00:00'), // this Monday
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('works', () => {
      const pd = Temporal.PlainDate.from('2024-07-20') // Saturday
      expect(
        startOfWeek(pd).equals(
          Temporal.PlainDate.from('2024-07-15'), // this Monday
        ),
      ).toBe(true)
    })
  })
})

describe('startOfDay', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      expect(
        startOfDay(zdt).equals(
          Temporal.ZonedDateTime.from('2024-07-20T00:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      expect(
        startOfDay(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T00:00:00'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDate', () => {
    it('is a noop', () => {
      const pd = Temporal.PlainDate.from('2024-07-20') // Saturday
      expect(startOfDay(pd as any).equals(pd)).toBe(true)
    })
  })
})

describe('startOfHour', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]',
      )
      expect(
        startOfHour(zdt).equals(
          Temporal.ZonedDateTime.from('2024-07-20T12:00:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      expect(
        startOfHour(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T12:00:00'),
        ),
      ).toBe(true)
    })
  })
})

describe('startOfMinute', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:30[America/New_York]',
      )
      expect(
        startOfMinute(zdt).equals(
          Temporal.ZonedDateTime.from('2024-07-20T12:30:00[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:30')
      expect(
        startOfMinute(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T12:30:00'),
        ),
      ).toBe(true)
    })
  })
})

describe('startOfSecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.5[America/New_York]',
      )
      expect(
        startOfSecond(zdt).equals(
          Temporal.ZonedDateTime.from('2024-07-20T12:30:44[America/New_York]'),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:44.5')
      expect(
        startOfSecond(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T12:30:44'),
        ),
      ).toBe(true)
    })
  })
})

describe('startOfMillisecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4023[America/New_York]',
      )
      expect(
        startOfMillisecond(zdt).equals(
          Temporal.ZonedDateTime.from(
            '2024-07-20T12:30:44.402[America/New_York]',
          ),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4023')
      expect(
        startOfMillisecond(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T12:30:44.402'),
        ),
      ).toBe(true)
    })
  })
})

describe('startOfMicrosecond', () => {
  describe('ZonedDateTime', () => {
    it('works', () => {
      const zdt = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:44.4000023[America/New_York]',
      )
      expect(
        startOfMicrosecond(zdt).equals(
          Temporal.ZonedDateTime.from(
            '2024-07-20T12:30:44.400002[America/New_York]',
          ),
        ),
      ).toBe(true)
    })
  })

  describe('PlainDateTime', () => {
    it('works', () => {
      const pdt = Temporal.PlainDateTime.from('2024-07-20T12:30:44.4000023')
      expect(
        startOfMicrosecond(pdt).equals(
          Temporal.PlainDateTime.from('2024-07-20T12:30:44.400002'),
        ),
      ).toBe(true)
    })
  })
})
