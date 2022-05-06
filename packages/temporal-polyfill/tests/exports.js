
// Copyright (C) 2018-2019 Bloomberg LP. All rights reserved.
// This code is governed by the license found in the LICENSE file.

import { assert } from 'chai';
const { strictEqual: equal } = assert;

import { Temporal } from 'temporal-polyfill/impl';

describe('Exports', () => {
  const named = Object.keys(Temporal)

  it('should be 11 things', () => {
    equal(named.length, 11);
  });
  it('should contain `Instant`', () => {
    assert(named.includes('Instant'));
  });
  it('should contain `TimeZone`', () => {
    assert(named.includes('TimeZone'));
  });
  it('should contain `PlainDate`', () => {
    assert(named.includes('PlainDate'));
  });
  it('should contain `PlainTime`', () => {
    assert(named.includes('PlainTime'));
  });
  it('should contain `PlainDateTime`', () => {
    assert(named.includes('PlainDateTime'));
  });
  it('should contain `ZonedDateTime`', () => {
    assert(named.includes('ZonedDateTime'));
  });
  it('should contain `PlainYearMonth`', () => {
    assert(named.includes('PlainYearMonth'));
  });
  it('should contain `PlainMonthDay`', () => {
    assert(named.includes('PlainMonthDay'));
  });
  it('should contain `Duration`', () => {
    assert(named.includes('Duration'));
  });
  it('should contain `Calendar`', () => {
    assert(named.includes('Calendar'));
  });
  it('should contain `Now`', () => {
    assert(named.includes('Now'));
  });

  // [fullcalendar/temporal]
  it('should have correct Symbol.toStringTag values', () => {
    const map = {
      Instant: Temporal.Now.instant(),
      ZonedDateTime: Temporal.Now.zonedDateTimeISO(),
      PlainDateTime: Temporal.Now.plainDateTimeISO(),
      PlainDate: Temporal.Now.plainDateISO(),
      PlainTime: Temporal.Now.plainTimeISO(),
      PlainYearMonth: Temporal.Now.plainDateISO().toPlainYearMonth(),
      PlainMonthDay: Temporal.Now.plainDateISO().toPlainMonthDay(),
      Calendar: new Temporal.Calendar('iso8601'),
      TimeZone: new Temporal.TimeZone('UTC'),
      Now: Temporal.Now,
      Duration: new Temporal.Duration(),
    }
    for (let key in map) {
      equal(
        map[key][Symbol.toStringTag],
        `Temporal.${key}`
      )
    }
  });
  it('should have correct Symbol.toStringTag value for Temporal', () => {
    equal(
      Temporal[Symbol.toStringTag],
      'Temporal',
    )
  })
});
