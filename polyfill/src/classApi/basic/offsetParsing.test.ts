import { describe, expect, it } from 'vitest'
import * as CalendarFns from '../../funcApi/calendar'
import * as InstantFns from '../../funcApi/instant'
import * as ZonedDateTimeFns from '../../funcApi/zonedDateTime'
import { Temporal } from './implementation'

// test262 only covers hours past 23, so also check minutes and seconds past 59.

const outOfRange = [
  '+00:60',
  '+00:99',
  '-00:60',
  '+0060',
  '+01:60',
  '+01:00:60', // an offset has no leap seconds
  '+01:00:99',
  '+010060',
  '+01:59:60',
  '+24:00', // already rejected, along with the rest of the hours
  '+99:00',
]

const inRange = [
  ['+00:59', '2024-10-03T11:01:00Z'],
  ['-00:59', '2024-10-03T12:59:00Z'],
  ['+0059', '2024-10-03T11:01:00Z'],
  ['+23:59', '2024-10-02T12:01:00Z'],
  ['+01:00:59', '2024-10-03T10:59:01Z'],
  ['+23:59:59.999999999', '2024-10-02T12:00:00.000000001Z'],
]

describe('UTC offsets in Temporal strings', () => {
  for (const offset of outOfRange) {
    describe(`rejects ${offset}`, () => {
      const str = `2024-10-03T12:00${offset}`

      it('in Instant.from', () => {
        expect(() => Temporal.Instant.from(str)).toThrow(RangeError)
      })

      it('in ZonedDateTime.from, even when ignoring the offset', () => {
        expect(() =>
          Temporal.ZonedDateTime.from(`${str}[UTC]`, { offset: 'ignore' }),
        ).toThrow(RangeError)
      })

      it('in a ZonedDateTime property bag', () => {
        expect(() =>
          Temporal.ZonedDateTime.from(
            {
              year: 2024,
              month: 10,
              day: 3,
              offset,
              timeZone: 'UTC',
            },
            { offset: 'ignore' },
          ),
        ).toThrow(RangeError)
      })

      it('in the function API', () => {
        expect(() => InstantFns.fromString(str)).toThrow(RangeError)
        expect(() =>
          ZonedDateTimeFns.fromString(`${str}[UTC]`, CalendarFns.getBasic, {
            offset: 'ignore',
          }),
        ).toThrow(RangeError)
        expect(() =>
          ZonedDateTimeFns.fromFields(
            {
              year: 2024,
              month: 10,
              day: 3,
              offset,
              timeZone: 'UTC',
            },
            { offset: 'ignore' },
          ),
        ).toThrow(RangeError)
      })
    })
  }

  for (const [offset, expected] of inRange) {
    it(`accepts ${offset}`, () => {
      const str = `2024-10-03T12:00${offset}`
      expect(Temporal.Instant.from(str).toString()).toBe(expected)
      expect(InstantFns.toString(InstantFns.fromString(str))).toBe(expected)
    })
  }

  it('rejects a time zone identifier the same way', () => {
    const zdt = Temporal.ZonedDateTime.from('2024-10-03T12:00[UTC]')
    for (const id of ['+00:60', '+01:99']) {
      expect(() => zdt.withTimeZone(id)).toThrow(RangeError)
      expect(() => new Temporal.ZonedDateTime(0n, id)).toThrow(RangeError)
    }
  })
})
