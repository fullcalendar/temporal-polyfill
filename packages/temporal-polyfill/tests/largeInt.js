import { createLargeInt } from '../src/utils/largeInt'

describe('LargeInt', () => {
  describe('adding', () => {
    it('positive by positive', () => {
      expect(createLargeInt(12392922812381123123n).add(9228123).toBigInt())
        .toBe(12392922812381123123n + 9228123n)
    })
    it('positive by negative', () => {
      expect(createLargeInt(12392922812381123123n).add(-9228123).toBigInt())
        .toBe(12392922812381123123n - 9228123n)
    })
    it('negative by positive', () => {
      expect(createLargeInt(-12392922812381123123n).add(9228123).toBigInt())
        .toBe(-12392922812381123123n + 9228123n)
    })
    it('negative by negative', () => {
      expect(createLargeInt(-12392922812381123123n).add(-9228123).toBigInt())
        .toBe(-12392922812381123123n - 9228123n)
    })
  })
  describe('subtracting', () => {
    it('positive by positive', () => {
      expect(createLargeInt(12392922812381123123n).sub(9228123).toBigInt())
        .toBe(12392922812381123123n - 9228123n)
    })
    it('positive by positive wrap', () => {
      expect(
        createLargeInt(12392922812381123123n)
          .sub(createLargeInt(56843732763n)).toBigInt()
      ).toBe(12392922812381123123n - 56843732763n)
    })
    it('positive by negative wrap', () => {
      expect(
        createLargeInt(12392922812381123123n)
          .sub(createLargeInt(-56843732763n)).toBigInt()
      ).toBe(12392922812381123123n + 56843732763n)
    })
    it('negative by positive wrap', () => {
      expect(
        createLargeInt(-12392922812381123123n)
          .sub(createLargeInt(56843732763n)).toBigInt()
      ).toBe(-12392922812381123123n - 56843732763n)
    })
    it('negative by negative wrap', () => {
      expect(
        createLargeInt(-12392922812381123123n)
          .sub(createLargeInt(-56843732763n)).toBigInt()
      ).toBe(-12392922812381123123n + 56843732763n)
    })
  })
  describe('multiplying', () => {
    it('positive by positive', () => {
      expect(createLargeInt(812381123123n).mult(92223).toBigInt())
        .toBe(812381123123n * 92223n)
    })
    it('positive by negative', () => {
      expect(createLargeInt(812381123123n).mult(-92223).toBigInt())
        .toBe(812381123123n * -92223n)
    })
    it('negative by positive', () => {
      expect(createLargeInt(-812381123123n).mult(92223).toBigInt())
        .toBe(-812381123123n * 92223n)
    })
    it('negative by negative', () => {
      expect(createLargeInt(-812381123123n).mult(-92223).toBigInt())
        .toBe(-812381123123n * -92223n)
    })
  })
  describe('dividing', () => {
    it('positive by positive', () => {
      expect(createLargeInt(812381123123n).div(92223).toBigInt())
        .toBe(812381123123n / 92223n)
    })
    it('positive by negative', () => {
      expect(createLargeInt(812381123123n).div(-92223).toBigInt())
        .toBe(812381123123n / -92223n)
    })
    it('negative by positive', () => {
      expect(createLargeInt(-812381123123n).div(92223).toBigInt())
        .toBe(-812381123123n / 92223n)
    })
    it('negative by negative', () => {
      expect(createLargeInt(-812381123123n).div(-92223).toBigInt())
        .toBe(-812381123123n / -92223n)
    })
  })
})
