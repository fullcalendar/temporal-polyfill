import { ZonedDateTime } from './zonedDateTime'

test('can instantiate', () => {
  const date = new ZonedDateTime(0)
  expect(date).toBeDefined()
})

describe.each([
  [1970, 1, 1, 0, 0, 0, 0],
  [1970, 1, 1, 12, 30, 30, 500],
  [2020, 12, 25, 0, 0, 0, 0],
])(
  'can get values for %d-%d-%dT%d:%d:%d.%d',
  (year, month, day, hour, minute, second, millisecond) => {
    const date = new ZonedDateTime(
      new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second,
        millisecond
      ).valueOf(),
      'utc'
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
        `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`
      )
    })
  }
)
