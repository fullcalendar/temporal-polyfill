import { parseISO, parseNative, parseNow } from '.'

describe('can parse', () => {
  test('now', () => {
    expect(parseNow()).toBe(Date.now())
  })

  test('native date', () => {
    const date = new Date()
    expect(parseNative(date)).toBe(date.valueOf())
  })

  test('ISO string', () => {
    const date = new Date()
    expect(parseISO(date.toISOString())).toBe(date.valueOf())
  })
})
