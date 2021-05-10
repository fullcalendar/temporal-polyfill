import { TimeZone } from './timezone'

test('can create with variable', () => {
  const timezone = 'local'
  expect(new TimeZone(timezone)).toBeDefined()
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
    const timezone = new TimeZone('utc')
    expect(timezone.getOffsetMillisecondsFor(time)).toBe(offset)
  })

  test.each([
    [0, -18000000],
    [100000, -18000000],
  ])('in local time (America/New_York) for %d to be %d', (time, offset) => {
    const timezone = new TimeZone('local')
    expect(timezone.getOffsetMillisecondsFor(time)).toBe(offset)
  })
})

describe('can get offset string', () => {
  test.each([
    [0, '-05:00'],
    [100000, '-05:00'],
  ])('for epoch at %d to be %s', (time, str) => {
    const timezone = new TimeZone()
    expect(timezone.getOffsetStringFor(time)).toBe(str)
  })
})
