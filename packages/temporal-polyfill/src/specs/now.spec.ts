/* eslint-disable @typescript-eslint/no-unused-vars */

/*
 ** Copyright (C) 2018-2019 Bloomberg LP. All rights reserved.
 ** This code is governed by the license found in the LICENSE file.
 */

import { assert } from 'chai'
import {
  Calendar,
  Instant,
  Now,
  PlainDate,
  PlainDateTime,
  PlainTime,
  TimeZone,
  ZonedDateTime,
} from '../impl'

declare const Temporal: never // don't use global
type InvalidArg = any

const { equal, throws } = assert

describe('Now', () => {
  describe('Structure', () => {
    it('Now is an object', () => equal(typeof Now, 'object'))
    it('Now has 9 properties', () => equal(Object.keys(Now).length, 9))
    it('Now.instant is a function', () => equal(typeof Now.instant, 'function'))
    it('Now.plainDateTime is a function', () => equal(typeof Now.plainDateTime, 'function'))
    it('Now.plainDateTimeISO is a function', () => equal(typeof Now.plainDateTimeISO, 'function'))
    it('Now.plainDate is a function', () => equal(typeof Now.plainDate, 'function'))
    it('Now.plainDateISO is a function', () => equal(typeof Now.plainDateISO, 'function'))
    it('Now.plainTimeISO is a function', () => equal(typeof Now.plainTimeISO, 'function'))
    it('Now.timeZone is a function', () => equal(typeof Now.timeZone, 'function'))
    it('Now.zonedDateTimeISO is a function', () => equal(typeof Now.zonedDateTimeISO, 'function'))
    it('Now.zonedDateTime is a function', () => equal(typeof Now.zonedDateTime, 'function'))
  })
  describe('Now.instant()', () => {
    it('Now.instant() returns an Instant', () => assert(Now.instant() instanceof Instant))
  })
  describe('Now.plainDateTimeISO()', () => {
    it('returns a DateTime in the ISO calendar', () => {
      const dt = Now.plainDateTimeISO()
      assert(dt instanceof PlainDateTime)
      equal(dt.calendar.id, 'iso8601')
    })
  })
  describe('Now.plainDateTime()', () => {
    it('returns a DateTime in the correct calendar', () => {
      const dt = Now.plainDateTime('gregory')
      assert(dt instanceof PlainDateTime)
      equal(dt.calendar.id, 'gregory')
    })
    it('requires a calendar', () => throws(() => (Now as InvalidArg).plainDateTime(), RangeError))
  })
  describe('Now.zonedDateTimeISO()', () => {
    it('returns a ZonedDateTime in the correct calendar and system time zone', () => {
      const zdt = Now.zonedDateTimeISO()
      const tz = Now.timeZone()
      assert(zdt instanceof ZonedDateTime)
      assert(zdt.calendar instanceof Calendar)
      equal(zdt.calendar.id, 'iso8601')
      assert(zdt.timeZone instanceof TimeZone)
      equal(zdt.timeZone.id, tz.id)
    })
    it('returns a ZonedDateTime in the correct calendar and specific time zone', () => {
      const zdt = Now.zonedDateTimeISO('America/Los_Angeles')
      assert(zdt instanceof ZonedDateTime)
      assert(zdt.calendar instanceof Calendar)
      equal(zdt.calendar.id, 'iso8601')
      assert(zdt.timeZone instanceof TimeZone)
      equal(zdt.timeZone.id, 'America/Los_Angeles')
    })
  })
  describe('Now.zonedDateTime()', () => {
    it('returns a ZonedDateTime in the correct calendar and system time zone', () => {
      const zdt = Now.zonedDateTime('gregory')
      const tz = Now.timeZone()
      assert(zdt instanceof ZonedDateTime)
      assert(zdt.calendar instanceof Calendar)
      equal(zdt.calendar.id, 'gregory')
      assert(zdt.timeZone instanceof TimeZone)
      equal(zdt.timeZone.id, tz.id)
    })
    it('returns a ZonedDateTime in the correct calendar and specific time zone', () => {
      const zdt = Now.zonedDateTime('gregory', 'America/Los_Angeles')
      assert(zdt instanceof ZonedDateTime)
      assert(zdt.calendar instanceof Calendar)
      equal(zdt.calendar.id, 'gregory')
      assert(zdt.timeZone instanceof TimeZone)
      equal(zdt.timeZone.id, 'America/Los_Angeles')
    })
    it('requires a calendar', () => throws(() => (Now as InvalidArg).zonedDateTime(), RangeError))
  })
  describe('Now.plainDateISO()', () => {
    it('returns a Date in the ISO calendar', () => {
      const d = Now.plainDateISO()
      assert(d instanceof PlainDate)
      equal(d.calendar.id, 'iso8601')
    })
  })
  describe('Now.plainDate()', () => {
    it('returns a Date in the correct calendar', () => {
      const d = Now.plainDate('gregory')
      assert(d instanceof PlainDate)
      equal(d.calendar.id, 'gregory')
    })
    it('requires a calendar', () => throws(() => (Now as InvalidArg).plainDate(), RangeError))
  })
  describe('Now.plainTimeISO()', () => {
    it('Now.plainTimeISO() returns a Time', () => {
      const t = Now.plainTimeISO()
      assert(t instanceof PlainTime)
      equal(t.calendar.id, 'iso8601')
    })
  })
})
