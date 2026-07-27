import { describe, expect, it } from 'vitest'
import { Intl, Temporal } from './implementation'

describe('Temporal.Duration', () => {
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

describe('Temporal.PlainMonthDay', () => {
  it('does not expose a numeric month field', () => {
    const pmd = new Temporal.PlainMonthDay(6, 18)

    expect('month' in pmd).toBe(false)
    expect((pmd as any).month).toBeUndefined()
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

    it('uses a spec-shaped prototype chain', () => {
      const format = new Intl.DateTimeFormat('en-US', { year: 'numeric' })

      expect(format).toBeInstanceOf(Intl.DateTimeFormat)
      expect(format.format).toBe(format.format)
      expect(Object.getPrototypeOf(Intl.DateTimeFormat.prototype)).toBe(
        Object.prototype,
      )
    })
  })

  // The wrapper hands native Intl a stand-in that records which options native
  // actually read, then reuses that record to build the per-Temporal-type
  // formatters. Anything the record misses is silently dropped from those
  // formatters, so resolvedOptions() and format(<Temporal object>) disagree.
  //
  // TODO: Contribute these to test262. intl402/DateTimeFormat/ has no case
  // combining an exotic options bag with Temporal formatting: the only tests
  // building one use Object.create(null) or use it as a receiver rather than as
  // options.
  describe('option observation', () => {
    // A PlainDate carries no time zone, so the wrapper formats it through an
    // inner UTC formatter. Native needs an explicit UTC time zone to match.
    const isoDate = '2020-05-15'
    const nativeMonthDay = new globalThis.Intl.DateTimeFormat('en', {
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${isoDate}T00:00:00Z`))

    // Logs every trap native Intl could possibly trip, not just `get`, so an
    // extra enumeration pass shows up as a diff rather than going unnoticed.
    function recordOptionOps(options: Intl.DateTimeFormatOptions) {
      const ops: string[] = []
      const proxy = new Proxy(options, {
        get(target, key, receiver) {
          ops.push(`get ${String(key)}`)
          return Reflect.get(target, key, receiver)
        },
        has(target, key) {
          ops.push(`has ${String(key)}`)
          return Reflect.has(target, key)
        },
        ownKeys(target) {
          ops.push('ownKeys')
          return Reflect.ownKeys(target)
        },
        getOwnPropertyDescriptor(target, key) {
          ops.push(`getOwnPropertyDescriptor ${String(key)}`)
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
        getPrototypeOf(target) {
          ops.push('getPrototypeOf')
          return Reflect.getPrototypeOf(target)
        },
      })
      return { ops, proxy }
    }

    it('observes the caller options exactly like native Intl.DateTimeFormat', () => {
      const optionValues: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }

      const native = recordOptionOps({ ...optionValues })
      expect(
        new globalThis.Intl.DateTimeFormat('en', native.proxy),
      ).toBeTruthy()

      const shim = recordOptionOps({ ...optionValues })
      expect(new Intl.DateTimeFormat('en', shim.proxy)).toBeTruthy()

      // Comparing against native rather than a hardcoded list keeps this from
      // breaking when a future ECMA-402 adds an option name.
      expect(shim.ops).toEqual(native.ops)

      // The specific regression: the wrapper used to enumerate the bag after
      // construction to learn which options the caller supplied.
      expect(shim.ops.filter((op) => !op.startsWith('get '))).toEqual([])
    })

    it('applies inherited options when formatting Temporal objects', () => {
      // Own-key enumeration cannot see these, but native Intl reads them.
      const options = Object.create({ month: 'long', day: 'numeric' })
      const format = new Intl.DateTimeFormat('en', options)

      expect(format.resolvedOptions().month).toBe('long')
      expect(format.format(Temporal.PlainDate.from(isoDate))).toBe(
        nativeMonthDay,
      )
    })

    it('applies non-enumerable own options when formatting Temporal objects', () => {
      const options: Intl.DateTimeFormatOptions = {}
      Object.defineProperty(options, 'month', { value: 'long' })
      Object.defineProperty(options, 'day', { value: 'numeric' })
      const format = new Intl.DateTimeFormat('en', options)

      expect(format.resolvedOptions().month).toBe('long')
      expect(format.format(Temporal.PlainDate.from(isoDate))).toBe(
        nativeMonthDay,
      )
    })
  })

  describe('formatToParts', () => {
    it('formats PlainTime without falling through to valueOf', () => {
      const format = new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      const time = Temporal.PlainTime.from('13:05')

      expect(format.formatToParts(time)).toEqual(
        new globalThis.Intl.DateTimeFormat('en', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        }).formatToParts(new Date(Date.UTC(1970, 0, 1, 13, 5))),
      )
    })
  })
})

describe('Intl', () => {
  it('Has members aside from DateTimeFormat', () => {
    expect(Intl.NumberFormat).toBeTruthy()
  })
})

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
