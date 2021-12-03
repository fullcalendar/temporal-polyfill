/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

import { assert } from 'chai'
import { Instant, Now, PlainDate, PlainDateTime, PlainTime, TimeZone, ZonedDateTime } from '../impl'

declare const Temporal: never // don't use global

const { equal, throws } = assert

describe('Userland time zone', () => {
  describe('Trivial subclass', () => {
    class CustomUTCSubclass extends TimeZone {
      constructor() {
        super('UTC')
      }

      toString() {
        return 'Etc/Custom/UTC_Subclass'
      }

      getOffsetNanosecondsFor(/* instant */) {
        return 0
      }

      getPossibleInstantsFor(dateTime: PlainDateTime) {
        const { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond } = dateTime
        const dayNum = MakeDay(year, month, day)
        const time = MakeTime(hour, minute, second, millisecond, microsecond, nanosecond)
        const epochNs = MakeDate(dayNum, time)
        return [new Instant(epochNs)]
      }

      getNextTransition(/* instant */) {
        return null
      }

      getPreviousTransition(/* instant */) {
        return null
      }
    }

    const obj = new CustomUTCSubclass()
    const inst = Instant.fromEpochNanoseconds(0n)
    const dt = new PlainDateTime(1976, 11, 18, 15, 23, 30, 123, 456, 789)

    it('is a time zone', () => equal(typeof obj, 'object'))
    it('.id property', () => equal(obj.id, 'Etc/Custom/UTC_Subclass'))
    // FIXME: what should happen in TimeZone.from(obj)?
    it('.id is not available in from()', () => {
      throws(() => TimeZone.from('Etc/Custom/UTC_Subclass'), RangeError)
      throws(() => TimeZone.from('2020-05-26T16:02:46.251163036+00:00[Etc/Custom/UTC_Subclass]'), RangeError)
    })
    it('has offset string +00:00', () => equal(obj.getOffsetStringFor(inst), '+00:00'))
    it('converts to DateTime', () => {
      equal(`${obj.getPlainDateTimeFor(inst)}`, '1970-01-01T00:00:00')
      equal(`${obj.getPlainDateTimeFor(inst, 'gregory')}`, '1970-01-01T00:00:00[u-ca=gregory]')
    })
    it('converts to Instant', () => {
      equal(`${obj.getInstantFor(dt)}`, '1976-11-18T15:23:30.123456789Z')
    })
    it('converts to string', () => equal(`${obj}`, obj.id))
    it('offset prints in instant.toString', () => equal(inst.toString({ timeZone: obj }), '1970-01-01T00:00:00+00:00'))
    it('prints in zdt.toString', () => {
      const zdt = new ZonedDateTime(0n, obj)
      equal(zdt.toString(), '1970-01-01T00:00:00+00:00[Etc/Custom/UTC_Subclass]')
    })
    it('has no next transitions', () => assert.equal(obj.getNextTransition(), null))
    it('has no previous transitions', () => assert.equal(obj.getPreviousTransition(), null))
    it('works in Now', () => {
      assert(Now.plainDateTimeISO(obj) instanceof PlainDateTime)
      assert(Now.plainDateTime('gregory', obj) instanceof PlainDateTime)
      assert(Now.plainDateISO(obj) instanceof PlainDate)
      assert(Now.plainDate('gregory', obj) instanceof PlainDate)
      assert(Now.plainTimeISO(obj) instanceof PlainTime)
    })
  })
  describe('Trivial protocol implementation', () => {
    const obj = {
      getOffsetNanosecondsFor(/* instant */) {
        return 0
      },
      getPossibleInstantsFor(dateTime: PlainDateTime) {
        const { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond } = dateTime
        const dayNum = MakeDay(year, month, day)
        const time = MakeTime(hour, minute, second, millisecond, microsecond, nanosecond)
        const epochNs = MakeDate(dayNum, time)
        return [new Instant(epochNs)]
      },
      toString() {
        return 'Etc/Custom/UTC_Protocol'
      },
    }

    const inst = Instant.fromEpochNanoseconds(0n)

    it('converts to DateTime', () => {
      equal(`${TimeZone.prototype.getPlainDateTimeFor.call(obj, inst)}`, '1970-01-01T00:00:00')
      equal(
        `${TimeZone.prototype.getPlainDateTimeFor.call(obj, inst, 'gregory')}`,
        '1970-01-01T00:00:00[u-ca=gregory]',
      )
    })
    it('offset prints in instant.toString', () => equal(inst.toString({ timeZone: obj }), '1970-01-01T00:00:00+00:00'))
    it('prints in zdt.toString', () => {
      const zdt = new ZonedDateTime(0n, obj)
      equal(zdt.toString(), '1970-01-01T00:00:00+00:00[Etc/Custom/UTC_Protocol]')
    })
    it('works in Now', () => {
      assert(Now.plainDateTimeISO(obj) instanceof PlainDateTime)
      assert(Now.plainDateTime('gregory', obj) instanceof PlainDateTime)
      assert(Now.plainDateISO(obj) instanceof PlainDate)
      assert(Now.plainDate('gregory', obj) instanceof PlainDate)
      assert(Now.plainTimeISO(obj) instanceof PlainTime)
    })
  })
  describe('sub-minute offset', () => {
    class SubminuteTimeZone extends TimeZone {
      constructor() {
        super('-00:00:01.111111111')
      }

      toString() {
        return 'Custom/Subminute'
      }

      getOffsetNanosecondsFor() {
        return -1111111111
      }

      getPossibleInstantsFor(dateTime: PlainDateTime) {
        const utc = TimeZone.from('UTC')
        const instant = utc.getInstantFor(dateTime)
        return [instant.add({ nanoseconds: 1111111111 })]
      }

      getNextTransition() {
        return null
      }

      getPreviousTransition() {
        return null
      }
    }

    const obj = new SubminuteTimeZone()
    const inst = Instant.fromEpochNanoseconds(0n)
    const dt = new PlainDateTime(1976, 11, 18, 15, 23, 30, 123, 456, 789)

    it('is a time zone', () => equal(typeof obj, 'object'))
    it('.id property', () => equal(obj.id, 'Custom/Subminute'))
    it('.id is not available in from()', () => {
      throws(() => TimeZone.from('Custom/Subminute'), RangeError)
      throws(
        () => TimeZone.from('2020-05-26T16:02:46.251163036-00:00:01.111111111[Custom/Subminute]'),
        RangeError,
      )
    })
    it('has offset string -00:00:01.111111111', () => equal(obj.getOffsetStringFor(inst), '-00:00:01.111111111'))
    it('converts to DateTime', () => {
      equal(`${obj.getPlainDateTimeFor(inst)}`, '1969-12-31T23:59:58.888888889')
      equal(`${obj.getPlainDateTimeFor(inst, 'gregory')}`, '1969-12-31T23:59:58.888888889[u-ca=gregory]')
    })
    it('converts to Instant', () => {
      equal(`${obj.getInstantFor(dt)}`, '1976-11-18T15:23:31.2345679Z')
    })
    it('converts to string', () => equal(`${obj}`, obj.id))
    it('offset prints in instant.toString', () =>
      equal(inst.toString({ timeZone: obj }), '1969-12-31T23:59:58.888888889-00:00:01.111111111'))
    it('prints in zdt.toString', () => {
      const zdt = new ZonedDateTime(0n, obj)
      equal(zdt.toString(), '1969-12-31T23:59:58.888888889-00:00:01.111111111[Custom/Subminute]')
    })
    it('has no next transitions', () => assert.equal(obj.getNextTransition(), null))
    it('has no previous transitions', () => assert.equal(obj.getPreviousTransition(), null))
    it('works in Now', () => {
      assert(Now.plainDateTimeISO(obj) instanceof PlainDateTime)
      assert(Now.plainDateTime('gregory', obj) instanceof PlainDateTime)
      assert(Now.plainDateISO(obj) instanceof PlainDate)
      assert(Now.plainDate('gregory', obj) instanceof PlainDate)
      assert(Now.plainTimeISO(obj) instanceof PlainTime)
    })
  })
})

const nsPerDay = 86400_000_000_000n
const nsPerMillisecond = 1_000_000n

function Day(t: bigint) {
  return t / nsPerDay
}

function MakeDate(day: bigint, time: bigint) {
  return day * nsPerDay + time
}

function MakeDay(year: number, month: number, day: number) {
  const m = month - 1
  const ym = year + Math.floor(m / 12)
  const mn = m % 12
  const t = BigInt(Date.UTC(ym, mn, 1)) * nsPerMillisecond
  return Day(t) + BigInt(day) - 1n
}

function MakeTime(h: number, min: number, s: number, ms: number, µs: number, ns: number) {
  const MinutesPerHour = 60n
  const SecondsPerMinute = 60n
  const nsPerSecond = 1_000_000_000n
  const nsPerMinute = nsPerSecond * SecondsPerMinute
  const nsPerHour = nsPerMinute * MinutesPerHour
  return (
    BigInt(h) * nsPerHour +
    BigInt(min) * nsPerMinute +
    BigInt(s) * nsPerSecond +
    BigInt(ms) * nsPerMillisecond +
    BigInt(µs) * 1000n +
    BigInt(ns)
  )
}
