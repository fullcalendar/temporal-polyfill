import { Calendar, CalendarId } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'

test('can instantiate', () => {
  const calendar = new Calendar()
  expect(calendar).toBeDefined()
})

test.each<[CalendarId]>([['iso8601'], ['gregory']])('can return %s', (id) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})

describe.each([
  [new PlainDate(1970, 1, 1), 12, 365, 1], // Unix Epoch
  [new PlainDate(1970, 1, 8), 12, 365, 2], // 1st week since Epoch
  [new PlainDate(2020, 12, 25), 12, 366, 52], // Christmas 2020
])('for %s', (date, monthsInYear, daysInYear, weekOfYear) => {
  const calendar = new Calendar()
  test('can get monthsInYear', () => {
    expect(calendar.monthsInYear(date)).toBe(monthsInYear)
  })

  test('can get daysInYear', () => {
    expect(calendar.daysInYear(date)).toBe(daysInYear)
  })

  test('can get weekOfYear', () => {
    expect(calendar.weekOfYear(date)).toBe(weekOfYear)
  })
})

test.each<[PlainDate, Duration, PlainDate]>([
  [new PlainDate(1970, 12, 1), new Duration(1, 1), new PlainDate(1972, 1, 1)],
  [
    new PlainDate(1970, 1, 25),
    new Duration(0, 0, 1),
    new PlainDate(1970, 2, 1),
  ],
])('can dateAdd %s + %s = %s', (date, dur, expected) => {
  const calendar = new Calendar()
  expect(calendar.dateAdd(date, dur)).toEqual(expected)
})

test.each<[PlainDate, PlainDate, Duration]>([
  [
    new PlainDate(1970, 1, 1),
    new PlainDate(1972, 3, 5),
    new Duration(2, 2, 0, 4),
  ],
  [
    new PlainDate(1970, 5, 30),
    new PlainDate(1972, 1, 1),
    new Duration(1, 7, 0, 2),
  ],
  [
    new PlainDate(2021, 5, 24),
    new PlainDate(2021, 5, 28),
    new Duration(0, 0, 0, 4),
  ],
  [
    new PlainDate(2022, 6, 3),
    new PlainDate(2021, 5, 1),
    new Duration(-1, -1, 0, -2),
  ],
])('can do dateUntil from %s to %s', (one, two, expected) => {
  const received = new Calendar().dateUntil(one, two, { largestUnit: 'years' })
  expect(received).toEqual(expected)
})

test.each([[new PlainDate(2021, 1, 4), 1]])(
  'can calculate weekOfYear for %s',
  (dt, expected) => {
    const calendar = new Calendar()
    expect(calendar.weekOfYear(dt)).toBe(expected)
  }
)

test.each([
  [new PlainDate(1970, 1, 1), 1],
  [new PlainDate(2021, 1, 29), 29],
  [new PlainDate(2020, 12, 31), 366],
  [new PlainDate(2021, 12, 31), 365],
])('can get proper dayOfYear for %s', (date, expected) => {
  const calendar = new Calendar()
  expect(calendar.dayOfYear(date)).toBe(expected)
})
