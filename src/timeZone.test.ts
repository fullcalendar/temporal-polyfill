import { PlainDateTime } from './plainDateTime'
import { TimeZone } from './timeZone'

test('can create with variable', () => {
  const tz = 'local'
  expect(new TimeZone(tz)).toBeDefined()
})

test('timezone for tests is America/New_York', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
    'America/New_York'
  )
})

describe('can get timezone offset milliseconds', () => {
  test.each([
    [0, 0],
    [100000, 0],
  ])('in utc for %d to be %d', (time, offset) => {
    const tz = new TimeZone('utc')
    expect(tz.getOffsetMillisecondsFor(time)).toBe(offset)
  })

  test.each([
    [0, -18000000],
    [100000, -18000000],
  ])('in local time (America/New_York) for %d to be %d', (time, offset) => {
    const tz = new TimeZone('local')
    expect(tz.getOffsetMillisecondsFor(time)).toBe(offset)
  })

  test.each([
    ['Asia/Tokyo', 0, 3.24e7],
    ['America/New_York', 100000, -1.8e7],
    ['America/Chicago', 1623128400000, -1.8e7],
    ['Asia/Shanghai', 1623128400000, 2.88e7],
  ])('in an arbitrary timezone(%s)', (timeZone, time, offset) => {
    const tz = new TimeZone(timeZone)
    expect(tz.getOffsetMillisecondsFor(time)).toBe(offset)
  })
})

describe('can get offset string', () => {
  test.each([
    [0, '-05:00'],
    [100000, '-05:00'],
  ])('for epoch at %d to be %s', (time, str) => {
    const tz = new TimeZone()
    expect(tz.getOffsetStringFor(time)).toBe(str)
  })
})

describe('can get PlainDateTime', () => {
  test('in utc', () => {
    const tz = new TimeZone('utc')
    expect(tz.getPlainDateTimeFor(0)).toEqual(new PlainDateTime(1970, 1, 1))
  })
})
