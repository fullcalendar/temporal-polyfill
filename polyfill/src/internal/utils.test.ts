import { describe, expect, it, vi } from 'vitest'
import { memoize } from './utils'

describe('memoize', () => {
  it('starts over once it holds 10,000 entries', () => {
    const generator = vi.fn((key: number) => key * 2)
    const memoized = memoize(generator)

    for (let key = 0; key < 10_000; key++) {
      memoized(key)
    }
    expect(generator).toHaveBeenCalledTimes(10_000)

    // Full, but a hit doesn't clear
    expect(memoized(0)).toBe(0)
    expect(generator).toHaveBeenCalledTimes(10_000)

    // A new key clears, so the old one has to be generated again
    memoized(10_000)
    memoized(0)
    expect(generator).toHaveBeenCalledTimes(10_002)
  })

  it('never clears a WeakMap', () => {
    const generator = vi.fn((key: object) => key)
    const memoized = memoize(generator, WeakMap)
    const keys = Array.from({ length: 10_001 }, () => ({}))

    for (const key of keys) {
      memoized(key)
    }
    memoized(keys[0])
    expect(generator).toHaveBeenCalledTimes(10_001)
  })
})
