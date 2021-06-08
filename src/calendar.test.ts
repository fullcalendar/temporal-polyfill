import { msToIsoDate } from './convert'
import { Calendar, CalendarId } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDateTime'

test('can instantiate', () => {
  const calendar = new Calendar()
  expect(calendar).toBeDefined()
})

test.each<[CalendarId]>([['iso8601'], ['gregory']])('can return %s', (id) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})

test.each([
  [0, 1], // Unix Epoch
  [626400000, 2], // 1st week since Epoch
  [1608876000000, 52], // Christmas 2020
])('can get weekOfYear for %d as %d', (epochMilliseconds, expected) => {
  const calendar = new Calendar()
  expect(calendar.weekOfYear(msToIsoDate(epochMilliseconds))).toBe(expected)
})

test.each<[PlainDate, Duration, PlainDate]>([
  [
    { isoYear: 1970, isoMonth: 12, isoDay: 1 },
    new Duration(1, 1),
    {
      isoYear: 1972,
      isoMonth: 1,
      isoDay: 1,
    },
  ],
  [
    { isoYear: 1970, isoMonth: 1, isoDay: 25 },
    new Duration(0, 0, 1),
    {
      isoYear: 1970,
      isoMonth: 2,
      isoDay: 1,
    },
  ],
])('can dateAdd %s + %s = %s', (date, dur, expected) => {
  const calendar = new Calendar()
  expect(calendar.dateAdd(date, dur)).toEqual(expected)
})

test.each<[PlainDate, PlainDate, Duration]>([
  [
    { isoYear: 1970, isoMonth: 1, isoDay: 1 },
    { isoYear: 1972, isoMonth: 3, isoDay: 5 },
    new Duration(2, 2, 0, 4),
  ],
  [
    { isoYear: 1970, isoMonth: 5, isoDay: 30 },
    { isoYear: 1972, isoMonth: 1, isoDay: 1 },
    new Duration(1, 7, 0, 2),
  ],
  [
    { isoYear: 2021, isoMonth: 5, isoDay: 24 },
    { isoYear: 2021, isoMonth: 5, isoDay: 28 },
    new Duration(0, 0, 0, 4),
  ],
  [
    { isoYear: 2022, isoMonth: 6, isoDay: 3 },
    { isoYear: 2021, isoMonth: 5, isoDay: 1 },
    new Duration(-1, -1, 0, -2),
  ],
])('can do dateUntil from %s to %s', (one, two, expected) => {
  const received = new Calendar().dateUntil(one, two, { largestUnit: 'years' })
  expect(received).toEqual(expected)
})
