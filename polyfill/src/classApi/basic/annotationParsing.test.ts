import { describe, expect, it } from 'vitest'
import { Temporal } from './implementation'

// The annotation grammar from RFC 9557 and the Temporal spec. test262 covers some of
// these, but not an empty annotation, a misplaced time zone, or a malformed value.

const malformed = [
  '[]', // never empty
  '[!]',
  '[=x]', // needs a key
  '[u-ca=]', // needs a value
  '[a=]',
  '[u-ca=japanese;era=reiwa]', // values are alphanumeric parts joined by hyphens
  '[foo=b ar]',
  '[foo=b.ar]',
  '[foo=-bar]',
  '[foo=bar-]',
  '[foo=b--ar]',
  '[foo=a=b]', // only one equals sign
  '[FOO=bar]', // keys are lowercase
  '[fOo=bar]',
  '[1foo=bar]',
  '[-foo=bar]',
  '[foo =bar]',
  '[u-ca=hebrew][Asia/Tokyo]', // a time zone must come first
  '[foo=bar][Asia/Tokyo]',
  '[Asia/Tokyo][Asia/Tokyo]',
  '[a b]', // time zone names have no spaces, and no empty or digit-led components
  '[a ]',
  '[/a]',
  '[a/]',
  '[a//b]',
  '[a/1]',
  '[1a]',
  '[+24:00]', // offsets are in range, to minute precision
  '[+01:60]',
  '[+01:00:30]',
  '[+1]',
]

const wellFormed = [
  '[Asia/Tokyo]',
  '[!Asia/Tokyo]',
  '[asia/tokyo]',
  '[Foo/Bar]', // the grammar allows it, and only ZonedDateTime looks it up
  '[Etc/GMT+1]',
  '[.a/_b]',
  '[+01:00]',
  '[-0130]',
  '[+01]',
  '[u-ca=iso8601]',
  '[!u-ca=iso8601]',
  '[u-ca=ISO8601]',
  '[foo=bar]',
  '[foo=BAR]',
  '[_foo-1_a=b-C-1]',
  '[Asia/Tokyo][u-ca=iso8601]',
  '[Asia/Tokyo][foo=bar][u-ca=iso8601]',
  '[foo=bar][u-ca=iso8601]',
]

// Each of these has a parser that runs annotations through the same code
const entryPoints: [string, (annotations: string) => unknown][] = [
  ['PlainDate', (a) => Temporal.PlainDate.from(`2024-10-03${a}`)],
  ['PlainDateTime', (a) => Temporal.PlainDateTime.from(`2024-10-03T12:00${a}`)],
  ['PlainTime', (a) => Temporal.PlainTime.from(`12:00${a}`)],
  ['PlainYearMonth', (a) => Temporal.PlainYearMonth.from(`2024-10${a}`)],
  ['PlainMonthDay', (a) => Temporal.PlainMonthDay.from(`10-03${a}`)],
  ['Instant', (a) => Temporal.Instant.from(`2024-10-03T12:00Z${a}`)],
]

describe('annotations in Temporal strings', () => {
  for (const [name, parse] of entryPoints) {
    describe(name, () => {
      for (const annotations of malformed) {
        it(`rejects ${annotations}`, () => {
          expect(() => parse(annotations)).toThrow(RangeError)
        })
      }

      for (const annotations of wellFormed) {
        it(`accepts ${annotations}`, () => {
          expect(() => parse(annotations)).not.toThrow()
        })
      }
    })
  }

  it('ZonedDateTime rejects them too', () => {
    for (const annotations of [
      '[Asia/Tokyo][]',
      '[Asia/Tokyo][foo=b;ar]',
      '[u-ca=iso8601][Asia/Tokyo]',
    ]) {
      expect(() =>
        Temporal.ZonedDateTime.from(`2024-10-03T12:00${annotations}`),
      ).toThrow(RangeError)
    }
  })

  it('keeps the values it reads', () => {
    const zdt = Temporal.ZonedDateTime.from(
      '2024-10-03T12:00[!Asia/Tokyo][foo=bar][u-ca=ISO8601]',
    )
    expect(zdt.timeZoneId).toBe('Asia/Tokyo')
    expect(zdt.calendarId).toBe('iso8601')
  })

  it('still rejects an unknown critical annotation', () => {
    expect(() => Temporal.PlainDate.from('2024-10-03[!foo=bar]')).toThrow(
      RangeError,
    )
  })

  it('still rejects multiple calendars when one is critical', () => {
    expect(() =>
      Temporal.PlainDate.from('2024-10-03[u-ca=iso8601][!u-ca=iso8601]'),
    ).toThrow(RangeError)
  })

  it('stays fast on a long invalid annotation', () => {
    const long = `2024-10-03[${'a-'.repeat(50000)}=${'b-'.repeat(50000)}]`
    const start = performance.now()
    expect(() => Temporal.PlainDate.from(long)).toThrow(RangeError)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})
