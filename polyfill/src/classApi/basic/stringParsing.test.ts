import { describe, expect, it } from 'vitest'
import { Temporal } from './implementation'

describe('time zone identifiers out of range', () => {
  const instant = Temporal.Instant.from('2024-01-01T00:00Z')

  it.each(['+24:00', '+23:60', '-24:00', '+2400'])('%s', (id) => {
    expect(() => instant.toZonedDateTimeISO(id)).toThrow(RangeError)
  })
})
