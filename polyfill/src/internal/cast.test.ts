import { describe, expect, it, vi } from 'vitest'
import { toPrimitiveWithStringHint } from './cast'

describe('toPrimitiveWithStringHint', () => {
  it('leaves primitive values unchanged', () => {
    expect(toPrimitiveWithStringHint('M01')).toBe('M01')
    expect(toPrimitiveWithStringHint(5)).toBe(5)
    expect(toPrimitiveWithStringHint(null)).toBe(null)
  })

  it('uses ordinary string-hint conversion order', () => {
    const toString = vi.fn(() => ({}))
    const valueOf = vi.fn(() => 'M01')

    expect(toPrimitiveWithStringHint({ toString, valueOf })).toBe('M01')
    expect(toString).toHaveBeenCalledOnce()
    expect(valueOf).toHaveBeenCalledOnce()
  })

  it('calls Symbol.toPrimitive with the string hint and correct receiver', () => {
    const input = {
      [Symbol.toPrimitive](hint: string) {
        expect(this).toBe(input)
        expect(hint).toBe('string')
        return 'M01'
      },
    }

    expect(toPrimitiveWithStringHint(input)).toBe('M01')
  })

  it('treats a null Symbol.toPrimitive method as absent', () => {
    expect(
      toPrimitiveWithStringHint({
        [Symbol.toPrimitive]: null,
        toString: () => 'M01',
      }),
    ).toBe('M01')
  })

  it('rejects non-callable Symbol.toPrimitive methods', () => {
    const toString = vi.fn(() => 'should not be observed')

    expect(() =>
      toPrimitiveWithStringHint({ [Symbol.toPrimitive]: { toString } }),
    ).toThrow(TypeError)
    expect(toString).not.toHaveBeenCalled()
  })

  it('rejects an object result', () => {
    expect(() =>
      toPrimitiveWithStringHint({ [Symbol.toPrimitive]: () => ({}) }),
    ).toThrow(TypeError)
  })
})
