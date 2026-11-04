import { describe, expect, it } from 'vitest'
import { Temporal } from '../classApi/basic/implementation'

describe('attachDebugString', () => {
  it('attaches nothing to objects on hosts with a process global', () => {
    expect(
      Object.getOwnPropertyNames(new Temporal.PlainDate(2026, 1, 2)),
    ).toEqual([])
  })
})
