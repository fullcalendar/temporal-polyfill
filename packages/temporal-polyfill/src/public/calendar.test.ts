import { Calendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'

test('can instantiate', () => {
  const calendar = new Calendar('iso8601')
  expect(calendar).toBeDefined()
})

test.each`
  id
  ${'iso8601'}
  ${'gregory'}
`('can return $id', ({ id }) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})

describe.each`
  date                           | monthsInYear | daysInYear | weekOfYear
  ${new PlainDate(1970, 1, 1)}   | ${12}        | ${365}     | ${1}
  ${new PlainDate(1970, 1, 8)}   | ${12}        | ${365}     | ${2}
  ${new PlainDate(2020, 12, 25)} | ${12}        | ${366}     | ${52}
`('for $date', ({ date, monthsInYear, daysInYear, weekOfYear }) => {
  const calendar = new Calendar('iso8601')
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

test.each`
  date                          | dur                      | expected
  ${new PlainDate(1970, 12, 1)} | ${new Duration(1, 1)}    | ${new PlainDate(1972, 1, 1)}
  ${new PlainDate(1970, 1, 25)} | ${new Duration(0, 0, 1)} | ${new PlainDate(1970, 2, 1)}
`('can dateAdd $date + $dur', ({ date, dur, expected }) => {
  const calendar = new Calendar('iso8601')
  expect(calendar.dateAdd(date, dur)).toEqual(expected)
})

test.each`
  one                           | two                           | expected
  ${new PlainDate(1970, 1, 1)}  | ${new PlainDate(1972, 3, 5)}  | ${new Duration(2, 2, 0, 4)}
  ${new PlainDate(1970, 5, 30)} | ${new PlainDate(1972, 1, 1)}  | ${new Duration(1, 7, 0, 2)}
  ${new PlainDate(2021, 5, 24)} | ${new PlainDate(2021, 5, 28)} | ${new Duration(0, 0, 0, 4)}
  ${new PlainDate(2022, 6, 3)}  | ${new PlainDate(2021, 5, 1)}  | ${new Duration(-1, -1, 0, -2)}
`('can do dateUntil from $one to $two', ({ one, two, expected }) => {
  const received = new Calendar('iso8601').dateUntil(one, two, { largestUnit: 'year' })
  expect(received).toEqual(expected)
})

test.each`
  date                         | expected
  ${new PlainDate(2021, 1, 4)} | ${1}
`('can calculate weekOfYear for $date', ({ date, expected }) => {
  const calendar = new Calendar('iso8601')
  expect(calendar.weekOfYear(date)).toBe(expected)
})

test.each`
  date                           | expected
  ${new PlainDate(1970, 1, 1)}   | ${1}
  ${new PlainDate(2021, 1, 29)}  | ${29}
  ${new PlainDate(2020, 12, 31)} | ${366}
  ${new PlainDate(2021, 12, 31)} | ${365}
`('can get proper dayOfYear for $date', ({ date, expected }) => {
  const calendar = new Calendar('iso8601')
  expect(calendar.dayOfYear(date)).toBe(expected)
})

/*
For more test data, visit:
https://github.com/jalaali/moment-jalaali
*/
describe('persian calendar', () => {
  test('can convert *to* ISO', () => {
    const cal = new Calendar('persian')
    const date = cal.dateFromFields({ year: 1392, month: 6, day: 3 })
    expect(date.toString()).toBe('2013-08-25[u-ca=persian]')
  })

  test('can convert *from* ISO', () => {
    const date = PlainDate.from('2013-08-25[u-ca=persian]')
    expect(date.calendar.id).toBe('persian')
    expect(date.year).toBe(1392)
    expect(date.month).toBe(6)
    expect(date.day).toBe(3)
  })
})
