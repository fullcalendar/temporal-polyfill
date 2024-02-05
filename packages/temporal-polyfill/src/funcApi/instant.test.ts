import { describe, expect, it } from 'vitest'
import { bigIntToDayTimeNano } from '../internal/dayTimeNano'
import { expectPropsEqualStrict } from '../internal/testUtils'
import * as DurationFns from './duration'
import { InstantSlots } from './instant'
import * as InstantFns from './instant'

describe('create', () => {
  it('works', () => {
    const inst = InstantFns.create(1n)
    expectInstantEquals(inst, 1n)
  })
})

describe('fromString', () => {
  it('works', () => {
    const inst = InstantFns.fromString('2024-01-01T00:00:00+01:00')
    expectInstantEquals(inst, 1704063600000000000n)
  })
})

describe('fromEpochNanoseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochNanoseconds(1n)
    expectInstantEquals(inst, 1n)
  })
})

describe('fromEpochMicroseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochMicroseconds(1n)
    expectInstantEquals(inst, 1000n)
  })
})

describe('fromEpochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochMilliseconds(1)
    expectInstantEquals(inst, 1000000n)
  })
})

describe('fromEpochSeconds', () => {
  it('works', () => {
    const inst = InstantFns.fromEpochSeconds(1)
    expectInstantEquals(inst, 1000000000n)
  })
})

describe('epochNanoseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1n)
    expect(InstantFns.epochNanoseconds(inst)).toBe(1n)
  })
})

describe('epochMicroseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1000n)
    expect(InstantFns.epochMicroseconds(inst)).toBe(1n)
  })
})

describe('epochMilliseconds', () => {
  it('works', () => {
    const inst = InstantFns.create(1000000n)
    expect(InstantFns.epochMilliseconds(inst)).toBe(1)
  })
})

describe('add', () => {
  it('advances by time units', () => {
    const inst0 = InstantFns.create(0n)
    const d = DurationFns.fromFields({ hours: 2 })
    const inst1 = InstantFns.add(inst0, d)
    expectInstantEquals(inst1, 7200000000000n)
  })
})

describe('subtract', () => {
  it('advances by time units', () => {
    const inst0 = InstantFns.create(0n)
    const d = DurationFns.fromFields({ hours: -2 })
    const inst1 = InstantFns.subtract(inst0, d)
    expectInstantEquals(inst1, 7200000000000n)
  })
})

// Utils
// -----------------------------------------------------------------------------

const defaultSlots = {
  branding: 'Instant',
  epochNanoseconds: 0n,
}

function expectInstantEquals(
  inst: InstantSlots,
  epochNanoseconds: bigint,
): void {
  expectPropsEqualStrict(inst, {
    ...defaultSlots,
    epochNanoseconds: bigIntToDayTimeNano(epochNanoseconds),
  })
}
