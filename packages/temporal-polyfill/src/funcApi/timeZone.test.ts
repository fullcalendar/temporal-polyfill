import { describe, expect, it } from 'vitest'
import * as InstantFns from './instant'
import * as PlainDateTimeFns from './plainDateTime'
import { expectInstantEquals } from './testUtils'
import * as TimeZoneFns from './timeZone'

describe('getPossibleInstantsFor', () => {
  it('can return zero results', () => {
    const tzId = 'America/New_York'
    const pdt = PlainDateTimeFns.fromString('2024-03-10T02:00:00')
    const insts = TimeZoneFns.getPossibleInstantsFor(tzId, pdt)
    expect(insts.length).toBe(0)
  })

  it('can return one result', () => {
    const tzId = 'America/New_York'
    const pdt = PlainDateTimeFns.fromString('2024-04-01T05:00:00')
    const insts = TimeZoneFns.getPossibleInstantsFor(tzId, pdt)
    expect(insts.length).toBe(1)
    expectInstantEquals(insts[0], 1711962000000000000n)
  })

  it('can return two results', () => {
    const tzId = 'America/New_York'
    const pdt = PlainDateTimeFns.fromString('2024-11-03T01:00:00')
    const insts = TimeZoneFns.getPossibleInstantsFor(tzId, pdt)
    expect(insts.length).toBe(2)
    expectInstantEquals(insts[0], 1730610000000000000n)
    expectInstantEquals(insts[1], 1730613600000000000n)
  })
})

describe('getNextTransition', () => {
  it('can return an instant', () => {
    const tzId = 'America/New_York'
    const inst0 = InstantFns.create(1711962000000000000n)
    const inst1 = TimeZoneFns.getNextTransition(tzId, inst0)
    expectInstantEquals(inst1!, 1730613600000000000n)
  })

  it('can return null', () => {
    const tzId = 'UTC'
    const inst0 = InstantFns.create(1711962000000000000n)
    const inst1 = TimeZoneFns.getNextTransition(tzId, inst0)
    expect(inst1).toBe(null)
  })
})

describe('getPreviousTransition', () => {
  it('can return an instant', () => {
    const tzId = 'America/New_York'
    const inst0 = InstantFns.create(1711962000000000000n)
    const inst1 = TimeZoneFns.getPreviousTransition(tzId, inst0)
    expectInstantEquals(inst1!, 1710054000000000000n)
  })

  it('can return null', () => {
    const tzId = 'UTC'
    const inst0 = InstantFns.create(1711962000000000000n)
    const inst1 = TimeZoneFns.getPreviousTransition(tzId, inst0)
    expect(inst1).toBe(null)
  })
})

describe('equals', () => {
  it('returns true for case-different IDs', () => {
    const tzId0 = 'America/New_York'
    const tsId1 = 'AMERICA/NEW_YORK'
    expect(TimeZoneFns.equals(tzId0, tsId1)).toBe(true)
  })

  it('returns true for canonicalized IDs', () => {
    const tzId0 = 'Asia/Calcutta'
    const tsId1 = 'Asia/Kolkata'
    expect(TimeZoneFns.equals(tzId0, tsId1)).toBe(true)
  })

  it('returns false for different IDs', () => {
    const tzId0 = 'America/New_York'
    const tsId1 = 'America/Chicago'
    expect(TimeZoneFns.equals(tzId0, tsId1)).toBe(false)
  })
})
