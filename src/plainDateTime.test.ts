import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { RoundLikeType } from './types'
import { ZonedDateTime } from './zonedDateTime'

test('can instantiate', () => {
  const date = new PlainDateTime(1970, 1, 1)
  expect(date).toBeDefined()
})

test('is equivalent to utc ZonedDateTime', () => {
  const pdt = new PlainDateTime(1970, 1, 1, 0, 0, 0, 1)
  const zdt = new ZonedDateTime(1, 'utc')
  expect(pdt.toZonedDateTime('utc')).toEqual(zdt)
  expect(pdt.year).toBe(zdt.year)
  expect(pdt.month).toBe(zdt.month)
  expect(pdt.day).toBe(zdt.day)
  expect(pdt.hour).toBe(zdt.hour)
  expect(pdt.minute).toBe(zdt.minute)
  expect(pdt.second).toBe(zdt.second)
  expect(pdt.millisecond).toBe(zdt.millisecond)
})

describe.each([
  [1970, 1, 1, 0, 0, 0, 0],
  [1970, 1, 1, 12, 30, 30, 500],
  [2020, 12, 25, 0, 0, 0, 0],
])(
  'can get values for %d-%d-%dT%d:%d:%d.%d',
  (year, month, day, hour, minute, second, millisecond) => {
    const date = new PlainDateTime(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    )
    test('of year', () => {
      expect(date.year).toBe(year)
    })
    test('of month', () => {
      expect(date.month).toBe(month)
    })
    test('of day', () => {
      expect(date.day).toBe(day)
    })
    test('of hour', () => {
      expect(date.hour).toBe(hour)
    })
    test('of minute', () => {
      expect(date.minute).toBe(minute)
    })
    test('of second', () => {
      expect(date.second).toBe(second)
    })
    test('of millisecond', () => {
      expect(date.millisecond).toBe(millisecond)
    })
    test.skip('of string', () => {
      expect(date.toString()).toBe(
        `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`
      )
    })
  }
)

test.each([
  ['P1Y', new PlainDateTime(1970, 1, 1), new PlainDateTime(1971, 1, 1)],
  ['P1Y1M1D', new PlainDateTime(2000, 1, 1), new PlainDateTime(2001, 2, 2)],
  [{ years: 1 }, new PlainDateTime(1970, 1, 1), new PlainDateTime(1971, 1, 1)],
  [
    { months: 1 },
    new PlainDateTime(1982, 12, 1),
    new PlainDateTime(1983, 1, 1),
  ],
])('can add %s to %s', (add, orig, expected) => {
  const date = orig.add(add)
  expect(date).toMatchObject(expected)
})

test.each([
  [
    new PlainDateTime(1970, 1, 1),
    new PlainDateTime(1970, 1, 2),
    new Duration(0, 0, 0, -1),
  ],
  // [
  //   new PlainDateTime(1970, 2, 5),
  //   new PlainDateTime(1970, 1, 1),
  //   new Duration(0, 1, 0, 4),
  // ],
  [
    new PlainDateTime(1970, 1, 1, 3, 30, 30),
    new PlainDateTime(1970, 1, 1, 1),
    new Duration(0, 0, 0, 0, 2, 30, 30),
  ],
])('can get duration since other time', (date, other, expected) => {
  expect(date.since(other)).toEqual(expected)
})

test.each<[PlainDateTime, PlainDateTime, RoundLikeType]>([
  [
    new PlainDateTime(1970, 1, 1, 0, 55),
    new PlainDateTime(1970, 1, 1, 1),
    { smallestUnit: 'hours', roundingMode: 'halfExpand' },
  ],
  [
    new PlainDateTime(1970, 1, 1, 1, 1, 1, 1),
    new PlainDateTime(1970, 1, 1, 1, 1, 1, 1),
    {},
  ],
  [
    new PlainDateTime(2000, 1, 1, 1),
    new PlainDateTime(2000, 1, 2),
    { smallestUnit: 'days', roundingMode: 'ceil' },
  ],
])('can round %s', (date, expected, options) => {
  expect(date.round(options)).toEqual(expected)
})
