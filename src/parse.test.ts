import { advanceTo } from 'jest-date-mock'
import { parseISO, parseNative, parseNow } from './parse'

describe('can parse', () => {
  advanceTo()

  test('now', () => {
    expect(parseNow('utc')).toBe(0)
  })

  test('native date', () => {
    const date = new Date()
    expect(parseNative(date, 'utc')).toBe(0)
  })

  test.each([
    ['1970-01-01', 0],
    ['1970-01-01T00:00:00.000Z', 0],
    ['1970-01-01T00:00:00.100Z', 100],
  ])('ISO string "%s"', (str, expected) => {
    expect(parseISO(str)).toBe(expected)
  })
})
