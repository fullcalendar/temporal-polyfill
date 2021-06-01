import { balanceFromMs } from './balance'
import { Calendar } from './calendar'
import { Duration } from './duration'
import { CalendarType, PlainDateType } from './types'
import { ZonedDateTime } from './zonedDateTime'

test('can instantiate', () => {
  const calendar = new Calendar()
  expect(calendar).toBeDefined()
})

test.each<[CalendarType]>([['iso8601'], ['gregory']])('can return %s', (id) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})

test.each([
  [0, 1], // Unix Epoch
  [626400000, 2], // 1st week since Epoch
  [1608876000000, 52], // Christmas 2020
])('can get weekOfYear for %d as %d', (epochMilliseconds, expected) => {
  const calendar = new Calendar()
  expect(calendar.weekOfYear(balanceFromMs(epochMilliseconds))).toBe(expected)
})

test.each([
  [
    { isoYear: 1970, isoMonth: 11, isoDay: 1 },
    new Duration(1, 1),
    {
      isoYear: 1972,
      isoMonth: 0,
      isoDay: 1,
    },
  ],
  [
    { isoYear: 1970, isoMonth: 0, isoDay: 25 },
    new Duration(0, 0, 1),
    {
      isoYear: 1970,
      isoMonth: 1,
      isoDay: 1,
    },
  ],
])('can do dateAdd', (date, dur, expected) => {
  const calendar = new Calendar()
  expect(calendar.dateAdd(date, dur)).toEqual(expected)
})

test.each<[PlainDateType, PlainDateType, Duration]>([
  [
    { isoYear: 2021, isoMonth: 5, isoDay: 24 },
    { isoYear: 2021, isoMonth: 5, isoDay: 28 },
    new Duration(0, 0, 0, 4),
  ],
])('can do dateUntil', (one, two, expected) => {
  const calendar = new Calendar()
  expect(calendar.dateUntil(one, two)).toEqual(expected)
})
