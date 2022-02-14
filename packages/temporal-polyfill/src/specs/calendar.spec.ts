/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

import { assert } from 'chai'
import { Calendar, Duration, PlainDate, PlainDateTime, PlainMonthDay, PlainYearMonth } from '../impl'

declare const Temporal: never // don't use global
type InvalidArg = any
type ValidArg = any

const { equal, throws } = assert

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
      function test(id: string) {
        const calendar = Calendar.from(id)
        it(`Calendar.from(${id}) is a calendar`, () => assert(calendar instanceof Calendar))
        it(`Calendar.from(${id}) has the correct ID`, () => equal(calendar.id, id))
      }
      it('other types with a calendar are accepted', () => {
        [
          PlainDate.from('1976-11-18[u-ca=gregory]'),
          PlainDateTime.from('1976-11-18[u-ca=gregory]'),
          PlainMonthDay.from('1972-11-18[u-ca=gregory]'),
          PlainYearMonth.from('1976-11-01[u-ca=gregory]'),
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
        const custom = { id: 'custom-calendar' } // **doesn't implement all CalendarProtocol methods**
        const calFrom = Calendar.from({ calendar: custom as ValidArg })
        equal(calFrom, custom as ValidArg)
      })
      it('throws with bad identifier', () => {
        throws(() => Calendar.from('local'), RangeError)
        throws(() => Calendar.from('iso-8601'), RangeError)
        throws(() => Calendar.from('[u-ca=iso8601]'), RangeError)
      })
      it('throws with bad value in property bag', () => {
        throws(() => Calendar.from({ calendar: 'local' }), RangeError)
        throws(() => Calendar.from({ calendar: { calendar: 'iso8601' } as InvalidArg }), RangeError)
      })
    })
    describe('Calendar.from(ISO string)', () => {
      test('1994-11-05T08:15:30-05:00', 'iso8601')
      test('1994-11-05T08:15:30-05:00[u-ca=gregory]', 'gregory')
      test('1994-11-05T13:15:30Z[u-ca=japanese]', 'japanese')
      function test(isoString: string, id: string) {
        const calendar = Calendar.from(isoString)
        it(`Calendar.from(${isoString}) is a calendar`, () => assert(calendar instanceof Calendar))
        it(`Calendar.from(${isoString}) has ID ${id}`, () => equal(calendar.id, id))
      }
    })
  })
  describe('Calendar.dateFromFields()', () => {
    it('throws on non-object fields', () => {
      ['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => iso.dateFromFields(bad as InvalidArg, {}), TypeError)
      })
    })
  })
  describe('Calendar.monthDayFromFields()', () => {
    it('throws on non-object fields', () => {
      ['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => iso.monthDayFromFields(bad as InvalidArg, {}), TypeError)
      })
    })
  })
  describe('Calendar.yearMonthFromFields()', () => {
    it('throws on non-object fields', () => {
      ['string', Math.PI, false, 42n, Symbol('sym'), null].forEach((bad) => {
        throws(() => iso.yearMonthFromFields(bad as InvalidArg, {}), TypeError)
      })
    })
  })
  describe('Calendar.year()', () => {
    const res = 1994
    it('accepts Date', () => {
      equal(iso.year(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.year(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.year(PlainYearMonth.from('1994-11')), res)
    })
    it('does not accept MonthDay', () => {
      throws(() => {
        iso.year(PlainMonthDay.from('11-05') as InvalidArg)
      }, TypeError)
    })
    it('casts argument', () => {
      equal(iso.year({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.year('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.year({ month: 5 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.month()', () => {
    const res = 11
    it('accepts Date', () => {
      equal(iso.month(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.month(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.month(PlainYearMonth.from('1994-11')), res)
    })
    it('does not accept MonthDay', () => {
      throws(() => {
        iso.month(PlainMonthDay.from('11-05') as InvalidArg)
      }, TypeError)
    })
    it('casts argument', () => {
      equal(iso.month({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.month('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.month({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.monthCode()', () => {
    const res = 'M11'
    it('accepts Date', () => {
      equal(iso.monthCode(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.monthCode(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.monthCode(PlainYearMonth.from('1994-11')), res)
    })
    it('accepts MonthDay', () => {
      equal(iso.monthCode(PlainMonthDay.from('11-05')), res)
    })
    it('casts argument', () => {
      equal(iso.monthCode({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.monthCode('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.monthCode({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.day()', () => {
    const res = 5
    it('accepts Date', () => {
      equal(iso.day(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.day(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts MonthDay', () => {
      equal(iso.day(PlainMonthDay.from('11-05')), res)
    })
    it('casts argument', () => {
      equal(iso.day({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.day('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.day({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.dayOfWeek()', () => {
    const res = 5
    it('does not accept MonthDay', () => {
      throws(() => iso.dayOfWeek(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.dayOfWeek(PlainDate.from('2020-10-23')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.dayOfWeek(PlainDateTime.from('2020-10-23T08:15:30')), res)
    })
    it('casts argument', () => {
      equal(iso.dayOfWeek({ year: 2020, month: 10, day: 23 }), res)
      equal(iso.dayOfWeek('2020-10-23'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.dayOfWeek({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.dayOfYear()', () => {
    const res = 32
    it('does not accept MonthDay', () => {
      throws(() => iso.dayOfYear(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.dayOfYear(PlainDate.from('1994-02-01')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.dayOfYear(PlainDateTime.from('1994-02-01T08:15:30')), res)
    })
    it('casts argument', () => {
      equal(iso.dayOfYear({ year: 1994, month: 2, day: 1 }), res)
      equal(iso.dayOfYear('1994-02-01'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.dayOfYear({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.weekOfYear()', () => {
    const res = 44
    it('does not accept MonthDay', () => {
      throws(() => iso.weekOfYear(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.weekOfYear(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.weekOfYear(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('casts argument', () => {
      equal(iso.weekOfYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.weekOfYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.weekOfYear({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('edge cases for Calendar.weekOfYear()', () => {
    it('week 1 from next year', () => equal(iso.weekOfYear(PlainDate.from('2019-12-31')), 1))
    it('week 53 from previous year', () => equal(iso.weekOfYear(PlainDate.from('2021-01-01')), 53))
  })
  describe('Calendar.daysInWeek()', () => {
    const res = 7
    it('accepts Date', () => {
      equal(iso.daysInWeek(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.daysInWeek(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('casts argument', () => {
      equal(iso.daysInWeek({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInWeek('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.daysInWeek({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.daysInMonth()', () => {
    const res = 30
    it('does not accept MonthDay', () => {
      throws(() => iso.daysInMonth(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.daysInMonth(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.daysInMonth(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.daysInMonth(PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.daysInMonth({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInMonth('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.daysInMonth({ year: 2000 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.daysInYear()', () => {
    const res = 365
    it('does not accept MonthDay', () => {
      throws(() => iso.daysInYear(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.daysInYear(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.daysInYear(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.daysInYear(PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.daysInYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.daysInYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.daysInYear({ month: 11 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.monthsInYear()', () => {
    const res = 12
    it('does not accept MonthDay', () => {
      throws(() => iso.monthsInYear(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.monthsInYear(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.monthsInYear(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.monthsInYear(PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.monthsInYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.monthsInYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.monthsInYear({ month: 11 } as InvalidArg), TypeError)
    })
  })
  describe('Calendar.inLeapYear()', () => {
    const res = false
    it('does not accept MonthDay', () => {
      throws(() => iso.inLeapYear(PlainMonthDay.from('11-05') as InvalidArg), TypeError)
    })
    it('accepts Date', () => {
      equal(iso.inLeapYear(PlainDate.from('1994-11-05')), res)
    })
    it('accepts DateTime', () => {
      equal(iso.inLeapYear(PlainDateTime.from('1994-11-05T08:15:30')), res)
    })
    it('accepts YearMonth', () => {
      equal(iso.inLeapYear(PlainYearMonth.from('1994-11')), res)
    })
    it('casts argument', () => {
      equal(iso.inLeapYear({ year: 1994, month: 11, day: 5 }), res)
      equal(iso.inLeapYear('1994-11-05'), res)
    })
    it('object must contain at least the required properties', () => {
      throws(() => iso.inLeapYear({ month: 11 } as InvalidArg), TypeError)
    })
  })
  // **this 4th argument (a "type" argument) doesn't seem to be accepted**
  // describe('Calendar.dateAdd()', () => {
  //   const date = PlainDate.from('1994-11-05');
  //   const duration = Duration.from({ months: 1, weeks: 1 });
  //   it('casts date argument', () => {
  //     equal(
  //       `${iso.dateAdd(PlainDateTime.from('1994-11-05T08:15:30'), duration, {}, PlainDate)}`,
  //       '1994-12-12'
  //     );
  //     equal(`${iso.dateAdd({ year: 1994, month: 11, day: 5 }, duration, {}, PlainDate)}`, '1994-12-12');
  //     equal(`${iso.dateAdd('1994-11-05', duration, {}, PlainDate)}`, '1994-12-12');
  //   });
  //   it('date object must contain at least the required properties', () => {
  //     throws(() => iso.dateAdd({ month: 11 }, duration, {}, PlainDate), TypeError);
  //   });
  //   it('casts duration argument', () => {
  //     equal(`${iso.dateAdd(date, { months: 1, weeks: 1 }, {}, PlainDate)}`, '1994-12-12');
  //     equal(`${iso.dateAdd(date, 'P1M1W', {}, PlainDate)}`, '1994-12-12');
  //   });
  //   it('duration object must contain at least one correctly-spelled property', () => {
  //     throws(() => iso.dateAdd(date, { month: 1 }, {}, PlainDate), TypeError);
  //   });
  // });
  describe('Calendar.dateAdd() (negative duration)', () => {
    const duration = Duration.from({ months: 1, weeks: 1 }).negated()
    it('casts date argument', () => {
      equal(`${iso.dateAdd(PlainDateTime.from('1994-11-05T08:15:30'), duration, {})}`, '1994-09-28')
      equal(`${iso.dateAdd({ year: 1994, month: 11, day: 5 }, duration, {})}`, '1994-09-28')
      equal(`${iso.dateAdd('1994-11-05', duration, {})}`, '1994-09-28')
    })
  })
  describe('Calendar.dateUntil()', () => {
    const date1 = PlainDate.from('1999-09-03')
    const date2 = PlainDate.from('2000-01-01')
    it('casts first argument', () => {
      equal(`${iso.dateUntil(PlainDateTime.from('1999-09-03T08:15:30'), date2, {})}`, 'P120D')
      equal(`${iso.dateUntil({ year: 1999, month: 9, day: 3 }, date2, {})}`, 'P120D')
      equal(`${iso.dateUntil('1999-09-03', date2, {})}`, 'P120D')
    })
    it('casts second argument', () => {
      equal(`${iso.dateUntil(date1, PlainDateTime.from('2000-01-01T08:15:30'), {})}`, 'P120D')
      equal(`${iso.dateUntil(date1, { year: 2000, month: 1, day: 1 }, {})}`, 'P120D')
      equal(`${iso.dateUntil(date1, '2000-01-01', {})}`, 'P120D')
    })
    it('objects must contain at least the required properties', () => {
      throws(() => iso.dateUntil({ month: 11 } as InvalidArg, date2, {}), TypeError)
      throws(() => iso.dateUntil(date1, { month: 11 } as InvalidArg, {}), TypeError)
    })
  })
})
describe('Built-in calendars (not standardized yet)', () => {
  describe('gregory', () => {
    it('era CE', () => {
      const date = PlainDate.from('1999-12-31[u-ca=gregory]')
      equal(date.era, 'ce')
      equal(date.eraYear, 1999)
      equal(date.year, 1999)
    })
    it('era BCE', () => {
      const date = PlainDate.from('-000001-12-31[u-ca=gregory]')
      equal(date.era, 'bce')
      equal(date.eraYear, 2)
      equal(date.year, -1)
    })
    it('can create from fields with era CE', () => {
      const date = PlainDate.from({ era: 'ce', eraYear: 1999, month: 12, day: 31, calendar: 'gregory' })
      equal(`${date}`, '1999-12-31[u-ca=gregory]')
    })
    it('era CE is the default', () => {
      const date = PlainDate.from({ year: 1999, month: 12, day: 31, calendar: 'gregory' })
      equal(`${date}`, '1999-12-31[u-ca=gregory]')
    })
    it('can create from fields with era BCE', () => {
      const date = PlainDate.from({ era: 'bce', eraYear: 2, month: 12, day: 31, calendar: 'gregory' })
      equal(`${date}`, '-000001-12-31[u-ca=gregory]')
    })
  })
})
