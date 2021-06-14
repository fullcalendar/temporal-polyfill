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
  [{ isoYear: 1970, isoMonth: 1, isoDay: 1 }, 12, 365, 1], // Unix Epoch
  [{ isoYear: 1970, isoMonth: 1, isoDay: 8 }, 12, 365, 2], // 1st week since Epoch
  [{ isoYear: 2020, isoMonth: 12, isoDay: 25 }, 12, 366, 52], // Christmas 2020
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
