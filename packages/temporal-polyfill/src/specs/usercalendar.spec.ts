// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

import { assert } from 'chai';
import { PlainDate } from '../impl';
const { equal, throws } = assert;

declare const Temporal: never; // don't use global
import { Calendar, Instant, Now, PlainDateTime, PlainMonthDay, PlainYearMonth, TimeZone, ZonedDateTime } from '../impl';

type ValidArg = any;
type ExtendedObj = any;

describe('Userland calendar', () => {
  describe('Trivial subclass', () => {
    // For the purposes of testing, a nonsensical calendar that uses 2-based
    // month numbers, instead of 1-based
    class TwoBasedCalendar extends Calendar {
      constructor() {
        super('iso8601');
      }
      toString() {
        return 'two-based';
      }
      dateFromFields(fields: any, options: any) {
        let { year, month, monthCode, day } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        return super.dateFromFields({ year, monthCode: `M${(month - 1).toString().padStart(2, '0')}`, day }, options);
      }
      yearMonthFromFields(fields: any, options: any) {
        let { year, month, monthCode } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        return super.yearMonthFromFields({ year, monthCode: `M${(month - 1).toString().padStart(2, '0')}` }, options);
      }
      monthDayFromFields(fields: any, options: any) {
        let { month, monthCode, day } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        return super.monthDayFromFields({ monthCode: `M${(month - 1).toString().padStart(2, '0')}`, day }, options);
      }
      month(date: any) {
        return date.getISOFields().isoMonth + 1;
      }
      monthCode(date: any) {
        return `M${this.month(date).toString().padStart(2, '0')}`;
      }
    }

    const obj = new TwoBasedCalendar();
    const date = PlainDate.from({ year: 2020, month: 5, day: 5, calendar: obj });
    const dt = PlainDateTime.from({ year: 2020, month: 5, day: 5, hour: 12, calendar: obj });
    const ym = PlainYearMonth.from({ year: 2020, month: 5, calendar: obj });
    const md = PlainMonthDay.from({ monthCode: 'M05', day: 5, calendar: obj });

    it('is a calendar', () => equal(typeof obj, 'object'));
    it('.id property', () => equal(obj.id, 'two-based'));
    // FIXME: what should happen in Calendar.from(obj)?
    it('.id is not available in from()', () => {
      throws(() => Calendar.from('two-based'), RangeError);
      throws(() => Calendar.from('2020-06-05T09:34-07:00[America/Vancouver][u-ca=two-based]'), RangeError);
    });
    it('PlainDate.from()', () => equal(`${date}`, '2020-04-05[u-ca=two-based]'));
    it('PlainDate fields', () => {
      equal(date.year, 2020);
      equal(date.month, 5);
      equal(date.day, 5);
    });
    it('date.with()', () => {
      const date2 = date.with({ month: 2 });
      equal(date2.month, 2);
    });
    it('date.withCalendar()', () => {
      const date2 = PlainDate.from('2020-04-05');
      assert(date2.withCalendar(obj).equals(date));
    });
    it('PlainDateTime.from()', () => equal(`${dt}`, '2020-04-05T12:00:00[u-ca=two-based]'));
    it('PlainDateTime fields', () => {
      equal(dt.year, 2020);
      equal(dt.month, 5);
      equal(dt.day, 5);
      equal(dt.hour, 12);
      equal(dt.minute, 0);
      equal(dt.second, 0);
      equal(dt.millisecond, 0);
      equal(dt.microsecond, 0);
      equal(dt.nanosecond, 0);
    });
    it('datetime.with()', () => {
      const dt2 = dt.with({ month: 2 });
      equal(dt2.month, 2);
    });
    it('datetime.withCalendar()', () => {
      const dt2 = PlainDateTime.from('2020-04-05T12:00');
      assert(dt2.withCalendar(obj).equals(dt));
    });
    it('PlainYearMonth.from()', () => equal(`${ym}`, '2020-04-01[u-ca=two-based]'));
    it('PlainYearMonth fields', () => {
      equal(dt.year, 2020);
      equal(dt.month, 5);
    });
    it('yearmonth.with()', () => {
      const ym2 = ym.with({ month: 2 });
      equal(ym2.month, 2);
    });
    it('PlainMonthDay.from()', () => equal(`${md}`, '1972-04-05[u-ca=two-based]'));
    it('PlainMonthDay fields', () => {
      equal(md.monthCode, 'M05');
      equal(md.day, 5);
    });
    it('monthday.with()', () => {
      const md2 = md.with({ monthCode: 'M02' });
      equal(md2.monthCode, 'M02');
    });
    it('timezone.getPlainDateTimeFor()', () => {
      const tz = TimeZone.from('UTC');
      const instant = Instant.fromEpochSeconds(0);
      const dt = tz.getPlainDateTimeFor(instant, obj);
      equal(dt.calendar.id, obj.id);
    });
    it('Now.plainDateTime()', () => {
      const nowDateTime = Now.plainDateTime(obj, 'UTC');
      equal(nowDateTime.calendar.id, obj.id);
    });
    it('Now.plainDate()', () => {
      const nowDate = Now.plainDate(obj, 'UTC');
      equal(nowDate.calendar.id, obj.id);
    });
  });
  describe('Trivial protocol implementation', () => {
    // For the purposes of testing, a nonsensical calendar that has 10-month
    // years, 10-day months, and the year zero is at the Unix epoch.
    function decimalToISO(year: number, month: number, day: number, overflow = 'constrain') {
      if (overflow === 'constrain') {
        if (month < 1) month = 1;
        if (month > 10) month = 10;
        if (day < 1) day = 1;
        if (day > 10) day = 10;
      } else if (overflow === 'reject') {
        if (month < 1 || month > 10 || day < 1 || day > 10) {
          throw new RangeError('invalid value');
        }
      }
      const days = year * 100 + (month - 1) * 10 + (day - 1);
      return new PlainDate(1970, 1, 1, 'iso8601').add({ days });
    }
    function isoToDecimal(date: PlainDate) {
      let { isoYear, isoMonth, isoDay } = date.getISOFields();
      let isoDate = new PlainDate(isoYear, isoMonth, isoDay);
      let { days } = isoDate.since(new PlainDate(1970, 1, 1), {
        largestUnit: 'days'
      });
      let year = Math.floor(days / 100);
      days %= 100;
      return { year, days };
    }
    const obj = {
      toString() {
        return 'decimal';
      },
      dateFromFields(fields: any, options: any) {
        const { overflow = 'constrain' } = options ? options : {};
        let { month, monthCode } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        const isoDate = decimalToISO(fields.year, month, fields.day, overflow); // **corrected method call**
        return new PlainDate(isoDate.year, isoDate.month, isoDate.day, this);
      },
      yearMonthFromFields(fields: any, options: any) {
        const { overflow = 'constrain' } = options ? options : {};
        let { month, monthCode } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        const isoDate = decimalToISO(fields.year, month, 1, overflow); // **corrected method call**
        return new PlainYearMonth(isoDate.year, isoDate.month, this, isoDate.day);
      },
      monthDayFromFields(fields: any, options: any) {
        const { overflow = 'constrain' } = options ? options : {};
        let { month, monthCode } = fields;
        if (month === undefined) month = +monthCode.slice(1);
        const isoDate = decimalToISO(0, month, fields.day, overflow); // **corrected method call**
        return new PlainMonthDay(isoDate.month, isoDate.day, this, isoDate.year);
      },
      year(date: PlainDate) {
        return isoToDecimal(date).year;
      },
      month(date: PlainDate) {
        const { days } = isoToDecimal(date);
        return Math.floor(days / 10) + 1;
      },
      monthCode(date: PlainDate) {
        return `M${this.month(date).toString().padStart(2, '0')}`;
      },
      day(date: PlainDate) {
        const { days } = isoToDecimal(date);
        return (days % 10) + 1;
      },
      // **these methods are required for CalendarProtocol**
      era() { return undefined },
      eraYear() { return undefined },
    };

    const date = PlainDate.from({ year: 184, month: 2, day: 9, calendar: obj });
    const dt = PlainDateTime.from({ year: 184, month: 2, day: 9, hour: 12, calendar: obj });
    const ym = PlainYearMonth.from({ year: 184, month: 2, calendar: obj });
    const md = PlainMonthDay.from({ monthCode: 'M02', day: 9, calendar: obj });

    it('is a calendar', () => equal(typeof obj, 'object'));
    // FIXME: what should happen in Calendar.from(obj)?
    it('.id is not available in from()', () => {
      throws(() => Calendar.from('decimal'), RangeError);
      throws(() => Calendar.from('2020-06-05T09:34-07:00[America/Vancouver][u-ca=decimal]'), RangeError);
    });
    it('PlainDate.from()', () => equal(`${date}`, '2020-06-05[u-ca=decimal]'));
    it('PlainDate fields', () => {
      equal(date.year, 184);
      equal(date.month, 2);
      equal(date.day, 9);
    });
    it('date.with()', () => {
      const date2 = date.with({ year: 0 });
      equal(date2.year, 0);
    });
    it('date.withCalendar()', () => {
      const date2 = PlainDate.from('2020-06-05T12:00');
      assert(date2.withCalendar(obj).equals(date));
    });
    it('PlainDateTime.from()', () => equal(`${dt}`, '2020-06-05T12:00:00[u-ca=decimal]'));
    it('PlainDateTime fields', () => {
      equal(dt.year, 184);
      equal(dt.month, 2);
      equal(dt.day, 9);
      equal(dt.hour, 12);
      equal(dt.minute, 0);
      equal(dt.second, 0);
      equal(dt.millisecond, 0);
      equal(dt.microsecond, 0);
      equal(dt.nanosecond, 0);
    });
    it('datetime.with()', () => {
      const dt2 = dt.with({ year: 0 });
      equal(dt2.year, 0);
    });
    it('datetime.withCalendar()', () => {
      const dt2 = PlainDateTime.from('2020-06-05T12:00');
      assert(dt2.withCalendar(obj).equals(dt));
    });
    it('PlainYearMonth.from()', () => equal(`${ym}`, '2020-05-28[u-ca=decimal]'));
    it('PlainYearMonth fields', () => {
      equal(dt.year, 184);
      equal(dt.month, 2);
    });
    it('yearmonth.with()', () => {
      const ym2 = ym.with({ year: 0 });
      equal(ym2.year, 0);
    });
    it('PlainMonthDay.from()', () => equal(`${md}`, '1970-01-19[u-ca=decimal]'));
    it('PlainMonthDay fields', () => {
      equal(md.monthCode, 'M02');
      equal(md.day, 9);
    });
    it('monthday.with()', () => {
      const md2 = md.with({ monthCode: 'M01' });
      equal(md2.monthCode, 'M01');
    });
    it('timezone.getPlainDateTimeFor()', () => {
      const tz = TimeZone.from('UTC');
      const inst = Instant.fromEpochSeconds(0);
      const dt = tz.getPlainDateTimeFor(inst, obj);
      equal(dt.calendar.id, (obj as ValidArg).id); // **both will be undefined, right?**
    });
    it('Now.plainDateTime()', () => {
      const nowDateTime = Now.plainDateTime(obj, 'UTC');
      equal(nowDateTime.calendar.id, (obj as ValidArg).id); // **both will be undefined, right?**
    });
    it('Now.plainDate()', () => {
      const nowDate = Now.plainDate(obj, 'UTC');
      equal(nowDate.calendar.id, (obj as ValidArg).id); // **both will be undefined, right?**
    });
  });
  describe('calendar with extra fields', () => {
    // Contrived example of a calendar identical to the ISO calendar except that
    // months are numbered 1, 2, 3, and each year has four seasons of 3 months
    // numbered 1, 2, 3, 4.
    class SeasonCalendar extends Calendar {
      constructor() {
        super('iso8601');
      }
      toString() {
        return 'season';
      }
      month(date: PlainDate) {
        const { isoMonth } = date.getISOFields();
        return ((isoMonth - 1) % 3) + 1;
      }
      monthCode(date: PlainDate) {
        return `M${this.month(date).toString().padStart(2, '0')}`;
      }
      season(date: PlainDate) {
        const { isoMonth } = date.getISOFields();
        return Math.floor((isoMonth - 1) / 3) + 1;
      }
      _isoMonthCode(fields: any) {
        const month = fields.month || +fields.monthCode.slice(1);
        return `M${((fields.season - 1) * 3 + month).toString().padStart(2, '0')}`;
      }
      dateFromFields(fields: any, options: any) {
        const monthCode = this._isoMonthCode(fields);
        delete fields.month;
        return super.dateFromFields({ ...fields, monthCode }, options);
      }
      yearMonthFromFields(fields: any, options: any) {
        const monthCode = this._isoMonthCode(fields);
        delete fields.month;
        return super.yearMonthFromFields({ ...fields, monthCode }, options);
      }
      monthDayFromFields(fields: any, options: any) {
        const monthCode = this._isoMonthCode(fields);
        delete fields.month;
        return super.monthDayFromFields({ ...fields, monthCode }, options);
      }
      fields(fields: any[]) {
        fields = fields.slice();
        if (fields.includes('month') || fields.includes('monthCode')) fields.push('season');
        return fields;
      }
    }
    const calendar = new SeasonCalendar();
    const datetime = new PlainDateTime(2019, 9, 15, 0, 0, 0, 0, 0, 0, calendar);
    const date = new PlainDate(2019, 9, 15, calendar);
    const yearmonth = new PlainYearMonth(2019, 9, calendar);
    const monthday = new PlainMonthDay(9, 15, calendar);
    const zoned = new ZonedDateTime(1568505600_000_000_000n, 'UTC', calendar);
    beforeEach(() => {
      const propDesc = {
        get(this: any): number {
          return this.calendar.season(this);
        },
        configurable: true
      };
      Object.defineProperty(PlainDateTime.prototype, 'season', propDesc);
      Object.defineProperty(PlainDate.prototype, 'season', propDesc);
      Object.defineProperty(PlainYearMonth.prototype, 'season', propDesc);
      Object.defineProperty(PlainMonthDay.prototype, 'season', propDesc);
      Object.defineProperty(ZonedDateTime.prototype, 'season', propDesc);
    });
    it('property getter works', () => {
      equal((datetime as ExtendedObj).season, 3);
      equal(datetime.month, 3);
      equal(datetime.monthCode, 'M03');
      equal((date as ExtendedObj).season, 3);
      equal(date.month, 3);
      equal(date.monthCode, 'M03');
      equal((yearmonth as ExtendedObj).season, 3);
      equal(yearmonth.month, 3);
      equal(yearmonth.monthCode, 'M03');
      equal((monthday as ExtendedObj).season, 3);
      equal(monthday.monthCode, 'M03');
      equal((zoned as ExtendedObj).season, 3);
      equal(zoned.month, 3);
      equal(zoned.monthCode, 'M03');
    });
    it('accepts season in from()', () => {
      equal(
        `${PlainDateTime.from({ year: 2019, season: 3, month: 3, day: 15, calendar } as ExtendedObj)}`,
        '2019-09-15T00:00:00[u-ca=season]'
      );
      equal(
        `${PlainDate.from({ year: 2019, season: 3, month: 3, day: 15, calendar } as ExtendedObj)}`,
        '2019-09-15[u-ca=season]'
      );
      equal(
        `${PlainYearMonth.from({ year: 2019, season: 3, month: 3, calendar } as ExtendedObj)}`,
        '2019-09-01[u-ca=season]'
      );
      equal(
        `${PlainMonthDay.from({ season: 3, monthCode: 'M03', day: 15, calendar } as ExtendedObj)}`,
        '1972-09-15[u-ca=season]'
      );
      equal(
        `${ZonedDateTime.from({ year: 2019, season: 3, month: 3, day: 15, timeZone: 'UTC', calendar } as ExtendedObj)}`,
        '2019-09-15T00:00:00+00:00[UTC][u-ca=season]'
      );
    });
    it('accepts season in with()', () => {
      equal(`${datetime.with({ season: 2 } as ExtendedObj)}`, '2019-06-15T00:00:00[u-ca=season]');
      equal(`${date.with({ season: 2 } as ExtendedObj)}`, '2019-06-15[u-ca=season]');
      equal(`${yearmonth.with({ season: 2 } as ExtendedObj)}`, '2019-06-01[u-ca=season]');
      equal(`${monthday.with({ season: 2 } as ExtendedObj)}`, '1972-06-15[u-ca=season]');
      equal(`${zoned.with({ season: 2 } as ExtendedObj)}`, '2019-06-15T00:00:00+00:00[UTC][u-ca=season]');
    });
    it('translates month correctly in with()', () => {
      equal(`${datetime.with({ month: 2 })}`, '2019-08-15T00:00:00[u-ca=season]');
      equal(`${date.with({ month: 2 })}`, '2019-08-15[u-ca=season]');
      equal(`${yearmonth.with({ month: 2 })}`, '2019-08-01[u-ca=season]');
      equal(`${monthday.with({ monthCode: 'M02' })}`, '1972-08-15[u-ca=season]');
      equal(`${zoned.with({ month: 2 })}`, '2019-08-15T00:00:00+00:00[UTC][u-ca=season]');
    });
    afterEach(() => {
      delete (PlainDateTime.prototype as ExtendedObj).season;
      delete (PlainDate.prototype as ExtendedObj).season;
      delete (PlainYearMonth.prototype as ExtendedObj).season;
      delete (PlainMonthDay.prototype as ExtendedObj).season;
      delete (ZonedDateTime.prototype as ExtendedObj).season;
    });
  });

  describe('calendar with nontrivial mergeFields implementation', () => {
    // Contrived example of a calendar identical to the ISO calendar except that
    // you can specify years as a combination of `century` (the 21st century is
    // the year 2001 through 2100) and `centuryYear` (1-100)
    class CenturyCalendar extends Calendar {
      constructor() {
        super('iso8601');
      }
      toString() {
        return 'century';
      }
      century(date: PlainDate) {
        const { isoYear } = date.getISOFields();
        return Math.ceil(isoYear / 100);
      }
      centuryYear(date: PlainDate) {
        const { isoYear } = date.getISOFields();
        return isoYear % 100;
      }
      _validateFields(fields: any) {
        const { year, century, centuryYear } = fields;
        if ((century === undefined) !== (centuryYear === undefined)) {
          throw new TypeError('pass either both or neither of century and centuryYear');
        }
        if (year === undefined) return (century - 1) * 100 + centuryYear;
        if (century !== undefined) {
          let centuryCalculatedYear = (century - 1) * 100 + centuryYear;
          if (year !== centuryCalculatedYear) {
            throw new RangeError('year must agree with century/centuryYear if both given');
          }
        }
        return year;
      }
      dateFromFields(fields: any, options: any) {
        const isoYear = this._validateFields(fields);
        return super.dateFromFields({ ...fields, year: isoYear }, options);
      }
      yearMonthFromFields(fields: any, options: any) {
        const isoYear = this._validateFields(fields);
        return super.yearMonthFromFields({ ...fields, year: isoYear }, options);
      }
      monthDayFromFields(fields: any, options: any) {
        const isoYear = this._validateFields(fields);
        return super.monthDayFromFields({ ...fields, year: isoYear }, options);
      }
      fields(fields: any) {
        fields = fields.slice();
        if (fields.includes('year')) fields.push('century', 'centuryYear');
        return fields;
      }
      mergeFields(fields: any, additionalFields: any) {
        const { year, century, centuryYear, ...original } = fields;
        const { year: newYear, century: newCentury, centuryYear: newCenturyYear } = additionalFields;
        if (newYear === undefined) {
          original.century = century;
          original.centuryYear = centuryYear;
        }
        if (newCentury === undefined && newCenturyYear === undefined) {
          original.year === year;
        }
        return { ...original, ...additionalFields };
      }
    }
    const calendar = new CenturyCalendar();
    const datetime = new PlainDateTime(2019, 9, 15, 0, 0, 0, 0, 0, 0, calendar);
    const date = new PlainDate(2019, 9, 15, calendar);
    const yearmonth = new PlainYearMonth(2019, 9, calendar);
    const zoned = new ZonedDateTime(1568505600_000_000_000n, 'UTC', calendar);
    beforeEach(() => {
      const propDesc = {
        century: {
          get(this: any): number {
            return this.calendar.century(this);
          },
          configurable: true
        },
        centuryYear: {
          get(this: any): number {
            return this.calendar.centuryYear(this);
          },
          configurable: true
        }
      };
      Object.defineProperties(PlainDateTime.prototype, propDesc);
      Object.defineProperties(PlainDate.prototype, propDesc);
      Object.defineProperties(PlainYearMonth.prototype, propDesc);
      Object.defineProperties(ZonedDateTime.prototype, propDesc);
    });
    it('property getters work', () => {
      equal((datetime as ExtendedObj).century, 21);
      equal((datetime as ExtendedObj).centuryYear, 19);
      equal((date as ExtendedObj).century, 21);
      equal((date as ExtendedObj).centuryYear, 19);
      equal((yearmonth as ExtendedObj).century, 21);
      equal((yearmonth as ExtendedObj).centuryYear, 19);
      equal((zoned as ExtendedObj).century, 21);
      equal((zoned as ExtendedObj).centuryYear, 19);
    });
    it('correctly resolves century in with()', () => {
      equal(`${datetime.with({ century: 20 } as ExtendedObj)}`, '1919-09-15T00:00:00[u-ca=century]');
      equal(`${date.with({ century: 20 } as ExtendedObj)}`, '1919-09-15[u-ca=century]');
      equal(`${yearmonth.with({ century: 20 } as ExtendedObj)}`, '1919-09-01[u-ca=century]');
      equal(`${zoned.with({ century: 20 } as ExtendedObj)}`, '1919-09-15T00:00:00+00:00[UTC][u-ca=century]');
    });
    it('correctly resolves centuryYear in with()', () => {
      equal(`${datetime.with({ centuryYear: 5 } as ExtendedObj)}`, '2005-09-15T00:00:00[u-ca=century]');
      equal(`${date.with({ centuryYear: 5 } as ExtendedObj)}`, '2005-09-15[u-ca=century]');
      equal(`${yearmonth.with({ centuryYear: 5 } as ExtendedObj)}`, '2005-09-01[u-ca=century]');
      equal(`${zoned.with({ centuryYear: 5 } as ExtendedObj)}`, '2005-09-15T00:00:00+00:00[UTC][u-ca=century]');
    });
    it('correctly resolves year in with()', () => {
      equal(`${datetime.with({ year: 1974 })}`, '1974-09-15T00:00:00[u-ca=century]');
      equal(`${date.with({ year: 1974 })}`, '1974-09-15[u-ca=century]');
      equal(`${yearmonth.with({ year: 1974 })}`, '1974-09-01[u-ca=century]');
      equal(`${zoned.with({ year: 1974 })}`, '1974-09-15T00:00:00+00:00[UTC][u-ca=century]');
    });
    afterEach(() => {
      delete (PlainDateTime.prototype as ExtendedObj).century;
      delete (PlainDateTime.prototype as ExtendedObj).centuryYear;
      delete (PlainDate.prototype as ExtendedObj).century;
      delete (PlainDate.prototype as ExtendedObj).centuryYear;
      delete (PlainYearMonth.prototype as ExtendedObj).century;
      delete (PlainYearMonth.prototype as ExtendedObj).centuryYear;
      delete (ZonedDateTime.prototype as ExtendedObj).century;
      delete (ZonedDateTime.prototype as ExtendedObj).centuryYear;
    });
  });
});
