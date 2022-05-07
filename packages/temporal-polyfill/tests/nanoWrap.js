import { ensureNanoWrap } from '../src/utils/nanoWrap'

describe('NanoWrap', () => {
  describe('adding', () => {
    it('positive by positive', () => {
      expect(ensureNanoWrap(12392922812381123123n).add(9228123).toBigInt())
        .toBe(12392922812381123123n + 9228123n)
    })
    it('positive by negative', () => {
      expect(ensureNanoWrap(12392922812381123123n).add(-9228123).toBigInt())
        .toBe(12392922812381123123n - 9228123n)
    })
    it('negative by positive', () => {
      expect(ensureNanoWrap(-12392922812381123123n).add(9228123).toBigInt())
        .toBe(-12392922812381123123n + 9228123n)
    })
    it('negative by negative', () => {
      expect(ensureNanoWrap(-12392922812381123123n).add(-9228123).toBigInt())
        .toBe(-12392922812381123123n - 9228123n)
    })
  })
  describe('subtracting', () => {
    it('positive by positive', () => {
      expect(ensureNanoWrap(12392922812381123123n).sub(9228123).toBigInt())
        .toBe(12392922812381123123n - 9228123n)
    })
    it('positive by positive wrap', () => {
      expect(
        ensureNanoWrap(12392922812381123123n)
          .sub(ensureNanoWrap(56843732763n)).toBigInt()
      ).toBe(12392922812381123123n - 56843732763n)
    })
    it('positive by negative wrap', () => {
      expect(
        ensureNanoWrap(12392922812381123123n)
          .sub(ensureNanoWrap(-56843732763n)).toBigInt()
      ).toBe(12392922812381123123n + 56843732763n)
    })
    it('negative by positive wrap', () => {
      expect(
        ensureNanoWrap(-12392922812381123123n)
          .sub(ensureNanoWrap(56843732763n)).toBigInt()
      ).toBe(-12392922812381123123n - 56843732763n)
    })
    it('negative by negative wrap', () => {
      expect(
        ensureNanoWrap(-12392922812381123123n)
          .sub(ensureNanoWrap(-56843732763n)).toBigInt()
      ).toBe(-12392922812381123123n + 56843732763n)
    })
  })
  describe('multiplying', () => {
    it('positive by positive', () => {
      expect(ensureNanoWrap(812381123123n).mult(92223).toBigInt())
        .toBe(812381123123n * 92223n)
    })
    it('positive by negative', () => {
      expect(ensureNanoWrap(812381123123n).mult(-92223).toBigInt())
        .toBe(812381123123n * -92223n)
    })
    it('negative by positive', () => {
      expect(ensureNanoWrap(-812381123123n).mult(92223).toBigInt())
        .toBe(-812381123123n * 92223n)
    })
    it('negative by negative', () => {
      expect(ensureNanoWrap(-812381123123n).mult(-92223).toBigInt())
        .toBe(-812381123123n * -92223n)
    })
  })
  describe('dividing', () => {
    it('positive by positive', () => {
      expect(ensureNanoWrap(812381123123n).div(92223).toBigInt())
        .toBe(812381123123n / 92223n)
    })
    it('positive by negative', () => {
      expect(ensureNanoWrap(812381123123n).div(-92223).toBigInt())
        .toBe(812381123123n / -92223n)
    })
    it('negative by positive', () => {
      expect(ensureNanoWrap(-812381123123n).div(92223).toBigInt())
        .toBe(-812381123123n / 92223n)
    })
    it('negative by negative', () => {
      expect(ensureNanoWrap(-812381123123n).div(-92223).toBigInt())
        .toBe(-812381123123n / -92223n)
    })
  })
})
