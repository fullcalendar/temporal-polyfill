import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import {
  diffDays,
  diffHours,
  diffMicroseconds,
  diffMilliseconds,
  diffMinutes,
  diffMonths,
  diffNanoseconds,
  diffSeconds,
  diffWeeks,
  diffYears,
} from '.'

describe('diffYears', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified, no offset change', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // -04:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2026-04-20T12:30:00[America/New_York]', // -04:00
      )
      const years = diffYears(zdt0, zdt1)
      expect(years).toBeCloseTo(1.75) // b/c nanosecond arithmetics, not month-based
    })

    it('gives exact result when no options/roundingMode specified, offset change', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-07-20T12:30:00[America/New_York]', // -04:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2026-01-20T12:30:00[America/New_York]', // -05:00
      )
      const years = diffYears(zdt0, zdt1)
      expect(years).toBeCloseTo(1.504, 3)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with roundingMode single arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-07-20T12:30:00')
      const pdt1 = Temporal.PlainDateTime.from('2026-04-20T12:30:00')
      const years = diffYears(pdt0, pdt1, 'floor')
      expect(years).toBe(1)
    })
  })

  describe('PlainDate', () => {
    it('gives rounded result with options object', () => {
      const pd0 = Temporal.PlainDate.from('2024-07-20')
      const pd1 = Temporal.PlainDate.from('2026-04-20')
      const years = diffYears(pd0, pd1, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      })
      const yearsInc = diffYears(pd0, pd1, {
        roundingMode: 'ceil',
        roundingIncrement: 2,
      })
      expect(years).toBe(1)
      expect(yearsInc).toBe(2)
    })
  })
})

describe('diffMonths', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-02-20T12:30:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-04-10T12:30:00[America/New_York]', // -04:00
      )
      const months = diffMonths(zdt0, zdt1)
      expect(months).toBeCloseTo(1.677)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with roundingMode single arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-02-20T12:30:00')
      const pdt1 = Temporal.PlainDateTime.from('2024-04-10T12:30:00')
      const months = diffMonths(pdt0, pdt1, 'floor')
      expect(months).toBe(1)
    })
  })

  describe('PlainDate', () => {
    it('gives rounded result with options object', () => {
      const pd0 = Temporal.PlainDate.from('2024-02-20')
      const pd1 = Temporal.PlainDate.from('2024-04-10')
      const months = diffMonths(pd0, pd1, {
        roundingMode: 'floor',
      })
      const monthsInc = diffMonths(pd0, pd1, {
        roundingMode: 'ceil',
        roundingIncrement: 3,
      })
      expect(months).toBe(1)
      expect(monthsInc).toBe(3)
    })
  })
})

describe('diffWeeks', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-05T00:30:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-16T15:30:00[America/New_York]', // -04:00 (not affected!)
      )
      const weeks = diffWeeks(zdt0, zdt1)
      expect(weeks).toBeCloseTo(1.66)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with roundingMode single arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-05T00:30:00')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-16T15:30:00')
      const weeks = diffWeeks(pdt0, pdt1, 'floor')
      expect(weeks).toBe(1)
    })
  })

  describe('PlainDate', () => {
    it('gives rounded result with options object', () => {
      const pd0 = Temporal.PlainDate.from('2024-03-05')
      const pd1 = Temporal.PlainDate.from('2024-03-16')
      const weeks = diffWeeks(pd0, pd1, {
        roundingMode: 'floor',
      })
      const weeksInc = diffWeeks(pd0, pd1, {
        roundingMode: 'ceil',
        roundingIncrement: 3,
      })
      expect(weeks).toBe(1)
      expect(weeksInc).toBe(3)
    })
  })
})

describe('diffDays', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-05T00:30:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-15T15:30:00[America/New_York]', // -04:00 (not affected!)
      )
      const days = diffDays(zdt0, zdt1)
      expect(days).toBe(10.625)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-05T00:30:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-15T15:30:00[America/New_York]', // -04:00 (not affected!)
      )
      const days = diffDays(zdt0, zdt1, 'floor')
      expect(days).toBe(10)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with options object', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-05T00:30:00')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-15T15:30:00')
      const days = diffDays(pdt0, pdt1, {
        roundingMode: 'floor',
      })
      const daysInc = diffDays(pdt0, pdt1, {
        roundingMode: 'ceil',
        roundingIncrement: 7,
      })
      expect(days).toBe(10)
      expect(daysInc).toBe(14)
    })
  })

  describe('PlainDate', () => {
    it('gives rounded result with options object', () => {
      const pd0 = Temporal.PlainDate.from('2024-03-05')
      const pd1 = Temporal.PlainDate.from('2024-03-15')
      const days = diffDays(pd0, pd1, {
        roundingMode: 'floor',
      })
      const daysInc = diffDays(pd0, pd1, {
        roundingMode: 'ceil',
        roundingIncrement: 7,
      })
      expect(days).toBe(10)
      expect(daysInc).toBe(14)
    })
  })
})

describe('diffHours', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-09T22:00:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-10T04:30:00[America/New_York]', // -04:00 (looses one hour)
      )
      const hours = diffHours(zdt0, zdt1)
      expect(hours).toBe(5.5)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-09T22:00:00[America/New_York]', // -05:00
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-10T04:30:00[America/New_York]', // -04:00 (looses one hour)
      )
      const hours = diffHours(zdt0, zdt1, 'floor')
      expect(hours).toBe(5)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with options object', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-09T22:00:00')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-10T03:30:00')
      const hours = diffHours(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      })
      const hoursEven = diffHours(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
      expect(hours).toBe(5)
      expect(hoursEven).toBe(4)
    })
  })
})

describe('diffMinutes', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:00:00[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:31:30[America/New_York]',
      )
      const minutes = diffMinutes(zdt0, zdt1)
      expect(minutes).toBe(31.5)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:00:00[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:31:30[America/New_York]',
      )
      const minutes = diffMinutes(zdt0, zdt1, 'floor')
      expect(minutes).toBe(31)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with options object', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:00:00')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:31:30')
      const minutes = diffMinutes(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      })
      const minutesEven = diffMinutes(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
      expect(minutes).toBe(31)
      expect(minutesEven).toBe(30)
    })
  })
})

describe('diffSeconds', () => {
  describe('ZonedDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:31.5[America/New_York]',
      )
      const seconds = diffSeconds(zdt0, zdt1)
      expect(seconds).toBe(11.5)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:31.1[America/New_York]',
      )
      const seconds = diffSeconds(zdt0, zdt1, 'floor')
      expect(seconds).toBe(11)
    })
  })

  describe('PlainDateTime', () => {
    it('gives rounded result with options object', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:31.1')
      const seconds = diffSeconds(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 1,
      })
      const secondsEven = diffSeconds(pdt0, pdt1, {
        roundingMode: 'floor',
        roundingIncrement: 2,
      })
      expect(seconds).toBe(11)
      expect(secondsEven).toBe(10)
    })
  })
})

describe('diffMilliseconds', () => {
  describe('PlainDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:21.6668')
      const milli = diffMilliseconds(pdt0, pdt1)
      expect(milli).toBe(1666.8)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:21.6667')
      const milli = diffMilliseconds(pdt0, pdt1, 'halfExpand')
      expect(milli).toBe(1667)
    })
  })

  describe('ZonedDateTime', () => {
    it('gives rounded result with options object', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:21.6667[America/New_York]',
      )
      const milli = diffMilliseconds(zdt0, zdt1, {
        roundingMode: 'halfExpand',
        roundingIncrement: 1,
      })
      const milliEven = diffMilliseconds(zdt0, zdt1, {
        roundingMode: 'halfExpand',
        roundingIncrement: 2,
      })
      expect(milli).toBe(1667)
      expect(milliEven).toBe(1666)
    })
  })
})

describe('diffMicroseconds', () => {
  describe('PlainDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:20.0006668')
      const micro = diffMicroseconds(pdt0, pdt1)
      expect(micro).toBe(666.8)
    })

    it('gives rounded result with roundingMode single arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:20.0006668')
      const micro = diffMicroseconds(pdt0, pdt1, 'halfExpand')
      expect(micro).toBe(667)
    })
  })

  describe('ZonedDateTime', () => {
    it('gives rounded result with options object', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20.0006668[America/New_York]',
      )
      const micro = diffMicroseconds(zdt0, zdt1, {
        roundingMode: 'halfExpand',
        roundingIncrement: 1,
      })
      const microEven = diffMicroseconds(zdt0, zdt1, {
        roundingMode: 'halfExpand',
        roundingIncrement: 2,
      })
      expect(micro).toBe(667)
      expect(microEven).toBe(666)
    })
  })
})

describe('diffNanoseconds', () => {
  describe('PlainDateTime', () => {
    it('gives exact result when no options/roundingMode specified', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:20.000000666')
      const nano = diffNanoseconds(pdt0, pdt1)
      expect(nano).toBe(666)
    })

    it('parses but ignores single roundingMode arg', () => {
      const pdt0 = Temporal.PlainDateTime.from('2024-03-20T12:30:20')
      const pdt1 = Temporal.PlainDateTime.from('2024-03-20T12:30:20.000000666')
      const nano = diffNanoseconds(pdt0, pdt1, 'halfExpand')
      expect(nano).toBe(666)
      expect(() => {
        diffNanoseconds(pdt0, pdt1, 'halfExpanddd' as any)
      }).toThrowError(RangeError)
    })
  })

  describe('ZonedDateTime', () => {
    it('gives increment-aligned result with options object', () => {
      const zdt0 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20[America/New_York]',
      )
      const zdt1 = Temporal.ZonedDateTime.from(
        '2024-03-20T12:30:20.000000666[America/New_York]',
      )
      const nano = diffNanoseconds(zdt0, zdt1, {
        roundingMode: 'halfExpand',
        roundingIncrement: 10,
      })
      expect(nano).toBe(670)
    })
  })
})
