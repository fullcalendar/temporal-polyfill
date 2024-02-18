import { describe, expect, it } from 'vitest'
import * as NowFns from './now'
import {
  expectInstantsSimilar,
  expectPlainDateTimesSimilar,
  expectPlainDatesSimilar,
  expectPlainTimesSimilar,
  expectZonedDateTimesSimilar,
  getCurrentInstant,
  getCurrentZonedDateTime,
  systemTimeZoneId,
} from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

describe('timeZoneId', () => {
  it('returns the system time zone', () => {
    expect(NowFns.timeZoneId()).toBe(systemTimeZoneId)
  })
})

describe('instant', () => {
  it('returns now', () => {
    const inst0 = NowFns.instant()
    const inst1 = getCurrentInstant()
    expectInstantsSimilar(inst0, inst1)
  })
})

describe('zonedDateTime', () => {
  it('returns now, assuming system time zone', () => {
    const zdt0 = NowFns.zonedDateTime('hebrew')
    const zdt1 = getCurrentZonedDateTime('hebrew', systemTimeZoneId)
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })

  it('returns now with a given time zone', () => {
    const zdt0 = NowFns.zonedDateTime('hebrew', 'America/Chicago')
    const zdt1 = getCurrentZonedDateTime('hebrew', 'America/Chicago')
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })
})

describe('zonedDateTimeISO', () => {
  it('returns now, assuming system time zone', () => {
    const zdt0 = NowFns.zonedDateTimeISO()
    const zdt1 = getCurrentZonedDateTime('iso8601', systemTimeZoneId)
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })

  it('returns now with a given time zone', () => {
    const zdt0 = NowFns.zonedDateTimeISO('America/Chicago')
    const zdt1 = getCurrentZonedDateTime('iso8601', 'America/Chicago')
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })
})

describe('plainDateTime', () => {
  it('returns current date, assuming system time zone', () => {
    const pdt0 = NowFns.plainDateTime('hebrew')
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      getCurrentZonedDateTime('hebrew', systemTimeZoneId),
    )
    expectPlainDateTimesSimilar(pdt0, pdt1)
  })

  it('returns current date with a given time zone', () => {
    const pdt0 = NowFns.plainDateTime('hebrew', 'America/Chicago')
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      getCurrentZonedDateTime('hebrew', 'America/Chicago'),
    )
    expectPlainDateTimesSimilar(pdt0, pdt1)
  })
})

describe('plainDateTimeISO', () => {
  it('returns current date, assuming system time zone', () => {
    const pdt0 = NowFns.plainDateTimeISO()
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      getCurrentZonedDateTime('iso8601', systemTimeZoneId),
    )
    expectPlainDateTimesSimilar(pdt0, pdt1)
  })

  it('returns current date with a given time zone', () => {
    const pdt0 = NowFns.plainDateTimeISO('America/Chicago')
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      getCurrentZonedDateTime('iso8601', 'America/Chicago'),
    )
    expectPlainDateTimesSimilar(pdt0, pdt1)
  })
})

describe('plainDate', () => {
  it('returns current date, assuming system time zone', () => {
    const pd0 = NowFns.plainDate('hebrew')
    const pd1 = ZonedDateTimeFns.toPlainDate(
      getCurrentZonedDateTime('hebrew', systemTimeZoneId),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })

  it('returns current date with a given time zone', () => {
    const pd0 = NowFns.plainDate('hebrew', 'America/Chicago')
    const pd1 = ZonedDateTimeFns.toPlainDate(
      getCurrentZonedDateTime('hebrew', 'America/Chicago'),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })
})

describe('plainDateISO', () => {
  it('returns current date, assuming system time zone', () => {
    const pd0 = NowFns.plainDateISO()
    const pd1 = ZonedDateTimeFns.toPlainDate(
      getCurrentZonedDateTime('iso8601', systemTimeZoneId),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })

  it('returns current date with a given time zone', () => {
    const pd0 = NowFns.plainDateISO('America/Chicago')
    const pd1 = ZonedDateTimeFns.toPlainDate(
      getCurrentZonedDateTime('iso8601', 'America/Chicago'),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })
})

describe('plainTimeISO', () => {
  it('returns current time, assuming system time zone', () => {
    const pt0 = NowFns.plainTimeISO()
    const pt1 = ZonedDateTimeFns.toPlainTime(
      getCurrentZonedDateTime('iso8601', systemTimeZoneId),
    )
    expectPlainTimesSimilar(pt0, pt1)
  })

  it('returns current time with a given time zone', () => {
    const pt0 = NowFns.plainTimeISO('America/Chicago')
    const pt1 = ZonedDateTimeFns.toPlainTime(
      getCurrentZonedDateTime('iso8601', 'America/Chicago'),
    )
    expectPlainTimesSimilar(pt0, pt1)
  })
})
