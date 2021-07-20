#! /usr/bin/env -S node --experimental-modules

/* eslint-disable @typescript-eslint/no-extra-semi */

// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

import mocha from 'mocha'
const { describe, it } = mocha

import { strict as assert } from 'assert'
const { equal, throws } = assert

import * as Temporal from 'temporal-polyfill'
const { Calendar } = Temporal

describe('Calendar', () => {
  describe('Structure', () => {
    it('Calendar is a Function', () => {
      equal(typeof Calendar, 'function')
    })
    it('Calendar has a prototype', () => {
      assert(Calendar.prototype)
      equal(typeof Calendar.prototype, 'object')
    })
    describe('Calendar.prototype', () => {
      it('Calendar.prototype has id', () => {
        assert('id' in Calendar.prototype)
      })
      it('Calendar.prototype.dateFromFields is a Function', () => {
        equal(typeof Calendar.prototype.dateFromFields, 'function')
      })
      it('Calendar.prototype.yearMonthFromFields is a Function', () => {
        equal(typeof Calendar.prototype.yearMonthFromFields, 'function')
      })
      it('Calendar.prototype.monthDayFromFields is a Function', () => {
        equal(typeof Calendar.prototype.monthDayFromFields, 'function')
      })
      it('Calendar.prototype.dateAdd is a Function', () => {
        equal(typeof Calendar.prototype.dateAdd, 'function')
      })
      it('Calendar.prototype.dateUntil is a Function', () => {
        equal(typeof Calendar.prototype.dateUntil, 'function')
      })
      it('Calendar.prototype.year is a Function', () => {
        equal(typeof Calendar.prototype.year, 'function')
      })
      it('Calendar.prototype.month is a Function', () => {
        equal(typeof Calendar.prototype.month, 'function')
      })
      it('Calendar.prototype.monthCode is a Function', () => {
        equal(typeof Calendar.prototype.monthCode, 'function')
      })
      it('Calendar.prototype.day is a Function', () => {
        equal(typeof Calendar.prototype.day, 'function')
      })
      it('Calendar.prototype.era is a Function', () => {
        equal(typeof Calendar.prototype.era, 'function')
      })
      it('Calendar.prototype.dayOfWeek is a Function', () => {
        equal(typeof Calendar.prototype.dayOfWeek, 'function')
      })
      it('Calendar.prototype.dayOfYear is a Function', () => {
        equal(typeof Calendar.prototype.dayOfYear, 'function')
      })
      it('Calendar.prototype.weekOfYear is a Function', () => {
        equal(typeof Calendar.prototype.weekOfYear, 'function')
      })
      it('Calendar.prototype.daysInWeek is a Function', () => {
        equal(typeof Calendar.prototype.daysInWeek, 'function')
      })
      it('Calendar.prototype.daysInMonth is a Function', () => {
        equal(typeof Calendar.prototype.daysInMonth, 'function')
      })
      it('Calendar.prototype.daysInYear is a Function', () => {
        equal(typeof Calendar.prototype.daysInYear, 'function')
      })
      it('Calendar.prototype.monthsInYear is a Function', () => {
        equal(typeof Calendar.prototype.monthsInYear, 'function')
      })
      it('Calendar.prototype.inLeapYear is a Function', () => {
        equal(typeof Calendar.prototype.inLeapYear, 'function')
      })
      it('Calendar.prototype.toString is a Function', () => {
        equal(typeof Calendar.prototype.toString, 'function')
      })
    })
    it('Calendar.from is a Function', () => {
      equal(typeof Calendar.from, 'function')
    })
  })
  const iso = Calendar.from('iso8601')
  describe('Calendar.from()', () => {
    describe('from identifier', () => {
      test('iso8601')
      test('gregory')
      test('japanese')

      function test(id) {
        const calendar = Calendar.from(id)
        it(`Calendar.from(${id}) is a calendar`, () => {
          return assert(calendar instanceof Calendar)
        })
        it(`Calendar.from(${id}) has the correct ID`, () => {
          return equal(calendar.id, id)
        })
      }
      it('other types with a calendar are accepted', () => {
        ;[
          Temporal.PlainDate.from('1976-11-18[u-ca=gregory]'),
          Temporal.PlainDateTime.from('1976-11-18[u-ca=gregory]'),
          Temporal.PlainMonthDay.from('1972-11-18[u-ca=gregory]'),
          Temporal.PlainYearMonth.from('1976-11-01[u-ca=gregory]'),
        ].forEach((obj) => {
          const calFrom = Calendar.from(obj)
          assert(calFrom instanceof Calendar)
          equal(calFrom.id, 'gregory')
        })
      })
      it('property bag with calendar object is accepted', () => {
        const cal = new Calendar('iso8601')
        const calFrom = Calendar.from({ calendar: cal })
        assert(calFrom instanceof Calendar)
        equal(calFrom.id, 'iso8601')
      })
      it('property bag with string is accepted', () => {
        const calFrom = Calendar.from({ calendar: 'iso8601' })
        assert(calFrom instanceof Calendar)
        equal(calFrom.id, 'iso8601')
      })
      it('property bag with custom calendar is accepted', () => {
        const custom = { id: 'custom-calendar' }
        const calFrom = Calendar.from({ calendar: custom })
        equal(calFrom, custom)
      })
      it('throws with bad identifier', () => {
        throws(() => {
          return Calendar.from('local')
        }, RangeError)
        throws(() => {
          return Calendar.from('iso-8601')
        }, RangeError)
        throws(() => {
          return Calendar.from('[u-ca=iso8601]')
        }, RangeError)
      })
      it('throws with bad value in property bag', () => {
        throws(() => {
          return Calendar.from({ calendar: 'local' })
        }, RangeError)
        throws(() => {
          return Calendar.from({ calendar: { calendar: 'iso8601' } })
        }, RangeError)
      })
    })
    describe('Calendar.from(ISO string)', () => {
      test('1994-11-05T08:15:30-05:00', 'iso8601')
      test('1994-11-05T08:15:30-05:00[u-ca=gregory]', 'gregory')
      test('1994-11-05T13:15:30Z[u-ca=japanese]', 'japanese')

      function test(isoString, id) {
        const calendar = Calendar.from(isoString)
        it(`Calendar.from(${isoString}) is a calendar`, () => {
          return assert(calendar instanceof Calendar)
        })
        it(`Calendar.from(${isoString}) has ID ${id}`, () => {
          return equal(calendar.id, id)
        })
      }
    })
  })
  describe('Calendar.dateFromFields()', () => {
    it('throws on non-object fields', () => {
      ;['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => {
          return iso.dateFromFields(bad, {})
        }, TypeError)
      })
    })
  })
  describe('Calendar.monthDayFromFields()', () => {
    it('throws on non-object fields', () => {
      ;['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => {
          return iso.monthDayFromFields(bad, {})
        }, TypeError)
      })
    })
  })
  describe('Calendar.yearMonthFromFields()', () => {
    it('throws on non-object fields', () => {
      ;['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => {
          return iso.yearMonthFromFields(bad, {})
        }, TypeError)
      })
    })
  })
  describe('Calendar.year()', () => {
    const res = 1994
    it('accepts Date', () => {
      return equal(iso.year(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.year(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(iso.year(Temporal.PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.year({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.year('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.year({ month: 5 })
      }, TypeError)
    })
  })
  describe('Calendar.month()', () => {
    const res = 11
    it('accepts Date', () => {
      return equal(iso.month(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.month(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(iso.month(Temporal.PlainYearMonth.from('1994-11')), res)
    })
    it('does not accept MonthDay', () => {
      return throws(() => {
        return iso.month(Temporal.PlainMonthDay.from('11-05'))
      }, TypeError)
    })
    it('casts argument', () => {
      equal(iso.month({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.month('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.month({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.monthCode()', () => {
    const res = 'M11'
    it('accepts Date', () => {
      return equal(iso.monthCode(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.monthCode(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(iso.monthCode(Temporal.PlainYearMonth.from('1994-11')), res)
    })
    it('accepts MonthDay', () => {
      return equal(iso.monthCode(Temporal.PlainMonthDay.from('11-05')), res)
    })
    it('casts argument', () => {
      equal(iso.monthCode({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.monthCode('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.monthCode({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.day()', () => {
    const res = 5
    it('accepts Date', () => {
      return equal(iso.day(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.day(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts MonthDay', () => {
      return equal(iso.day(Temporal.PlainMonthDay.from('11-05')), res)
    })
    it('casts argument', () => {
      equal(iso.day({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.day('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.day({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.dayOfWeek()', () => {
    const res = 5
    it('accepts Date', () => {
      return equal(iso.dayOfWeek(Temporal.PlainDate.from('2020-10-23')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.dayOfWeek(Temporal.PlainDateTime.from('2020-10-23T08:15:30')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.dayOfWeek({ year: 2020, month: 10, day: 23 }), res)
      equal(iso.dayOfWeek('2020-10-23'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.dayOfWeek({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.dayOfYear()', () => {
    const res = 32
    it('accepts Date', () => {
      return equal(iso.dayOfYear(Temporal.PlainDate.from('1994-02-01')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.dayOfYear(Temporal.PlainDateTime.from('1994-02-01T08:15:30')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.dayOfYear({ year: 1994, month: 2, day: 1 }), res)
      equal(iso.dayOfYear('1994-02-01'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.dayOfYear({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.weekOfYear()', () => {
    const res = 44
    it('accepts Date', () => {
      return equal(iso.weekOfYear(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.weekOfYear(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.weekOfYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.weekOfYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.weekOfYear({ year: 2000 })
      }, TypeError)
    })
  })
  describe('edge cases for Calendar.weekOfYear()', () => {
    it('week 1 from next year', () => {
      return equal(iso.weekOfYear(Temporal.PlainDate.from('2019-12-31')), 1)
    })
    it('week 53 from previous year', () => {
      return equal(iso.weekOfYear(Temporal.PlainDate.from('2021-01-01')), 53)
    })
  })
  describe('Calendar.daysInWeek()', () => {
    const res = 7
    it('accepts Date', () => {
      return equal(iso.daysInWeek(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.daysInWeek(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.daysInWeek({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInWeek('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.daysInWeek({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.daysInMonth()', () => {
    const res = 30
    it('accepts Date', () => {
      return equal(iso.daysInMonth(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.daysInMonth(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(
        iso.daysInMonth(Temporal.PlainYearMonth.from('1994-11')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.daysInMonth({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInMonth('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.daysInMonth({ year: 2000 })
      }, TypeError)
    })
  })
  describe('Calendar.daysInYear()', () => {
    const res = 365
    it('accepts Date', () => {
      return equal(iso.daysInYear(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.daysInYear(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(iso.daysInYear(Temporal.PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.daysInYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.daysInYear({ month: 11 })
      }, TypeError)
    })
  })
  describe('Calendar.monthsInYear()', () => {
    const res = 12
    it('accepts Date', () => {
      return equal(iso.monthsInYear(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.monthsInYear(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(
        iso.monthsInYear(Temporal.PlainYearMonth.from('1994-11')),
        res
      )
    })
    it('casts argument', () => {
      equal(iso.monthsInYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.monthsInYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.monthsInYear({ month: 11 })
      }, TypeError)
    })
  })
  describe('Calendar.inLeapYear()', () => {
    const res = false
    it('accepts Date', () => {
      return equal(iso.inLeapYear(Temporal.PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      return equal(
        iso.inLeapYear(Temporal.PlainDateTime.from('1994-11-05T08:15:30')),
        res
      )
    })
    it('accepts YearMonth', () => {
      return equal(iso.inLeapYear(Temporal.PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.inLeapYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.inLeapYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => {
        return iso.inLeapYear({ month: 11 })
      }, TypeError)
    })
  })
  describe('Calendar.dateAdd()', () => {
    const date = Temporal.PlainDate.from('1994-11-05')
    const duration = Temporal.Duration.from({ months: 1, weeks: 1 })
    it('casts date argument', () => {
      equal(
        `${iso.dateAdd(
          Temporal.PlainDateTime.from('1994-11-05T08:15:30'),
          duration,
          {},
          Temporal.PlainDate
        )}`,
        '1994-12-12'
      )
      equal(
        `${iso.dateAdd(
          { year: 1994, month: 11, day: 5 },
          duration,
          {},
          Temporal.PlainDate
        )}`,
        '1994-12-12'
      )
      equal(
        `${iso.dateAdd('1994-11-05', duration, {}, Temporal.PlainDate)}`,
        '1994-12-12'
      )
    })
    it('date object must contain at least the required properties', () => {
      throws(() => {
        return iso.dateAdd({ month: 11 }, duration, {}, Temporal.PlainDate)
      }, TypeError)
    })
    it('casts duration argument', () => {
      equal(
        `${iso.dateAdd(date, { months: 1, weeks: 1 }, {}, Temporal.PlainDate)}`,
        '1994-12-12'
      )
      equal(
        `${iso.dateAdd(date, 'P1M1W', {}, Temporal.PlainDate)}`,
        '1994-12-12'
      )
    })
    it('duration object must contain at least one correctly-spelled property', () => {
      throws(() => {
        return iso.dateAdd(date, { month: 1 }, {}, Temporal.PlainDate)
      }, TypeError)
    })
  })
  describe('Calendar.dateAdd() (negative duration)', () => {
    const duration = Temporal.Duration.from({ months: 1, weeks: 1 }).negated()
    it('casts date argument', () => {
      equal(
        `${iso.dateAdd(
          Temporal.PlainDateTime.from('1994-11-05T08:15:30'),
          duration,
          {}
        )}`,
        '1994-09-28'
      )
      equal(
        `${iso.dateAdd({ year: 1994, month: 11, day: 5 }, duration, {})}`,
        '1994-09-28'
      )
      equal(`${iso.dateAdd('1994-11-05', duration, {})}`, '1994-09-28')
    })
  })
  describe('Calendar.dateUntil()', () => {
    const date1 = Temporal.PlainDate.from('1999-09-03')
    const date2 = Temporal.PlainDate.from('2000-01-01')
    it('casts first argument', () => {
      equal(
        `${iso.dateUntil(
          Temporal.PlainDateTime.from('1999-09-03T08:15:30'),
          date2,
          {}
        )}`,
        'P120D'
      )
      equal(
        `${iso.dateUntil({ year: 1999, month: 9, day: 3 }, date2, {})}`,
        'P120D'
      )
      equal(`${iso.dateUntil('1999-09-03', date2, {})}`, 'P120D')
    })
    it('casts second argument', () => {
      equal(
        `${iso.dateUntil(
          date1,
          Temporal.PlainDateTime.from('2000-01-01T08:15:30'),
          {}
        )}`,
        'P120D'
      )
      equal(
        `${iso.dateUntil(date1, { year: 2000, month: 1, day: 1 }, {})}`,
        'P120D'
      )
      equal(`${iso.dateUntil(date1, '2000-01-01', {})}`, 'P120D')
    })
    it('objects must contain at least the required properties', () => {
      throws(() => {
        return iso.dateUntil({ month: 11 }, date2, {})
      }, TypeError)
      throws(() => {
        return iso.dateUntil(date1, { month: 11 }, {})
      }, TypeError)
    })
  })
})
describe('Built-in calendars (not standardized yet)', () => {
  describe('gregory', () => {
    it('era CE', () => {
      const date = Temporal.PlainDate.from('1999-12-31[u-ca=gregory]')
      equal(date.era, 'ce')
      equal(date.eraYear, 1999)
      equal(date.year, 1999)
    })
    it('era BCE', () => {
      const date = Temporal.PlainDate.from('-000001-12-31[u-ca=gregory]')
      equal(date.era, 'bce')
      equal(date.eraYear, 2)
      equal(date.year, -1)
    })
    it('can create from fields with era CE', () => {
      const date = Temporal.PlainDate.from({
        era: 'ce',
        eraYear: 1999,
        month: 12,
        day: 31,
        calendar: 'gregory',
      })
      equal(`${date}`, '1999-12-31[u-ca=gregory]')
    })
    it('era CE is the default', () => {
      const date = Temporal.PlainDate.from({
        year: 1999,
        month: 12,
        day: 31,
        calendar: 'gregory',
      })
      equal(`${date}`, '1999-12-31[u-ca=gregory]')
    })
    it('can create from fields with era BCE', () => {
      const date = Temporal.PlainDate.from({
        era: 'bce',
        eraYear: 2,
        month: 12,
        day: 31,
        calendar: 'gregory',
      })
      equal(`${date}`, '-000001-12-31[u-ca=gregory]')
    })
  })
})
