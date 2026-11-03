import { describe, expect, it } from 'vitest'
import { Temporal } from './implementation'

describe('time zone identifiers out of range', () => {
  const instant = Temporal.Instant.from('2024-01-01T00:00Z')

  it.each(['+24:00', '+23:60', '-24:00', '+2400'])('%s', (id) => {
    expect(() => instant.toZonedDateTimeISO(id)).toThrow(RangeError)
  })
})

describe('annotations have no limit on their number', () => {
  const annotations = '[foo=bar]'.repeat(50)

  it.each([
    ['2024-10-03', '2024-10-03'],
    ['2024-10-03[UTC]', '2024-10-03'],
  ])('%s', (s, expected) => {
    expect(Temporal.PlainDate.from(s + annotations).toString()).toBe(expected)
  })
})
