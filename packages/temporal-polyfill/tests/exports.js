
// Copyright (C) 2018-2019 Bloomberg LP. All rights reserved.
// This code is governed by the license found in the LICENSE file.

import { assert } from 'chai';
const { strictEqual: equal } = assert;

import { Temporal } from 'temporal-polyfill/impl';

describe('Exports', () => {
  // [fullcalendar/temporal]
  // exclude polyfill-specific utilities
  // TODO: better solution
  const nonStandardRE = /^(extendDateTimeFormat|toTemporalInstant)$/
  const named = Object.keys(Temporal).filter((key) => !nonStandardRE.test(key))

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
});
