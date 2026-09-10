import { describe, expect, it } from 'vitest'
import { durationFieldDefaults } from './durationFields'
import { totalRelativeDuration } from './total'
import { Unit } from './units'

describe('totalRelativeDuration', () => {
  it('retries an overshot window whose endpoint is epoch zero', () => {
    // Guards against treating a 0n endpoint as "no endpoint" and skipping the
    // window retry. This uses a mock RelativeOps on purpose: the retry is only
    // reachable through zoned DST folds and skipped days, and no tzdata zone
    // has a transition near 1970-01-01T00:00Z, so no public-API input (and
    // therefore no parity test against another implementation) can hit it.
    // Shifting every marker by the real endpoint makes that endpoint 0n
    // without changing any interval relationship.
    const relativeOps = {
      originEpochNano: -4n,
      moveToEpochNano: (durationFields: typeof durationFieldDefaults) =>
        durationFields.months === 1 ? -3n : 0n,
    }

    expect(
      totalRelativeDuration(durationFieldDefaults, 0n, Unit.Month, relativeOps),
    ).toBe(2)
  })
})
