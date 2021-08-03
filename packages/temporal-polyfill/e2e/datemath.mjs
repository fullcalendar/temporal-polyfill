#! /usr/bin/env -S node --experimental-modules

/*
 ** Copyright (C) 2018-2019 Bloomberg LP. All rights reserved.
 ** This code is governed by the license found in the LICENSE file.
 */

import { assert } from '@esm-bundle/chai'
const { equal } = assert

import * as Temporal from 'temporal-polyfill'

describe.skip('Date.since(simple, simple)', () => {
  build('Before Leap Day', '2020-01-03', '2020-02-15')
  build('Before Leap Day', '2020-01-28', '2020-02-15')
  build('Before Leap Day', '2020-01-31', '2020-02-15')
  build('Cross Leap Day', '2020-01-31', '2020-06-30')
  build('After Leap Day', '2020-03-31', '2020-06-30')
  build('After Leap Day', '2020-03-25', '2020-07-31')
})
describe('Date.since(normal, normal)', () => {
  build('Month<2 & Month<2', '2018-01-20', '2019-01-05')
  build('Month>2 & Month>2', '2018-03-20', '2019-03-05')
  build('Month>2 & Month>2', '2018-04-20', '2019-04-05')
  build('Month<2 & Month>2', '2018-01-20', '2019-04-05')
  build('Month>2 & Month<2', '2018-03-20', '2019-01-05')
  build('Month>2 & Month<2', '2018-04-20', '2019-01-05')
})
describe('Date.since(leap, leap)', () => {
  build('Month<2 & Month<2', '2016-01-20', '2020-01-05')
  build('Month>2 & Month>2', '2016-03-20', '2020-04-05')
  build('Month>2 & Month>2', '2016-03-20', '2020-03-05')
  build('Month<2 & Month>2', '2016-01-20', '2020-02-05')
  build('Month>2 & Month<2', '2016-03-20', '2020-01-05')
  build('Month>2 & Month<2', '2016-04-20', '2020-01-05')
})
describe('Date.since(leap, normal)', () => {
  build('Month<2 & Month<2', '2016-01-20', '2017-01-05')
  build('Month>2 & Month>2', '2016-03-20', '2017-04-05')
  build('Month>2 & Month>2', '2016-04-20', '2017-03-05')
  build('Month<2 & Month>2', '2016-01-20', '2017-04-05')
  build('Month>2 & Month<2', '2016-03-20', '2017-01-05')
  build('Month>2 & Month<2', '2016-04-20', '2017-01-05')
})
describe('Date.since(normal, leap)', () => {
  build('Month<2 & Month<2', '2019-01-20', '2020-01-05')
  build('Month>2 & Month>2', '2019-03-20', '2020-04-05')
  build('Month>2 & Month>2', '2019-04-20', '2020-03-05')
  build('Month<2 & Month>2', '2019-01-20', '2020-04-05')
  build('Month>2 & Month<2', '2019-03-20', '2020-01-05')
  build('Month>2 & Month<2', '2019-04-20', '2020-01-05')
})

function build(name, sone, stwo) {
  const [one, two] = [
    Temporal.PlainDate.from(sone),
    Temporal.PlainDate.from(stwo),
  ].sort(Temporal.PlainDate.compare)
  describe(name, () => {
    const largestUnits = ['years', 'months', 'weeks', 'days']
    buildSub(one, two, largestUnits)
    buildSub(one.with({ day: 25 }), two.with({ day: 5 }), largestUnits)
    buildSub(one.with({ day: 30 }), two.with({ day: 29 }), largestUnits)
    buildSub(one.with({ day: 30 }), two.with({ day: 5 }), largestUnits)
  })
}

function buildSub(one, two, largestUnits) {
  largestUnits.forEach((largestUnit) => {
    describe(`< ${one} : ${two} (${largestUnit})>`, () => {
      const dif = two.since(one, { largestUnit })
      const overflow = 'reject'

      if (largestUnit === 'months' || largestUnit === 'years') {
        // For months and years, `until` and `since` won't agree because the
        // starting point is always `this` and month-aware arithmetic behavior
        // varies based on the starting point.
        it(`(${two}).subtract(${dif}) => ${one}`, () => {
          return assert(two.subtract(dif).equals(one))
        })
        it(`(${two}).add(-${dif}) => ${one}`, () => {
          return assert(two.add(dif.negated()).equals(one))
        })
        const difUntil = one.until(two, { largestUnit })
        it(`(${one}).subtract(-${difUntil}) => ${two}`, () => {
          return assert(one.subtract(difUntil.negated()).equals(two))
        })
        it(`(${one}).add(${difUntil}) => ${two}`, () => {
          return assert(one.add(difUntil).equals(two))
        })
      } else {
        it('until() and since() agree', () => {
          return equal(`${dif}`, `${one.until(two, { largestUnit })}`)
        })
        it(`(${one}).add(${dif}) => ${two}`, () => {
          return assert(one.add(dif, { overflow }).equals(two))
        })
        it(`(${two}).subtract(${dif}) => ${one}`, () => {
          return assert(two.subtract(dif, { overflow }).equals(one))
        })
        it(`(${one}).subtract(-${dif}) => ${two}`, () => {
          return assert(one.subtract(dif.negated(), { overflow }).equals(two))
        })
        it(`(${two}).add(-${dif}) => ${one}`, () => {
          return assert(two.add(dif.negated(), { overflow }).equals(one))
        })
      }
    })
  })
}
