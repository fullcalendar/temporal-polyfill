import { describe, expect, it } from 'vitest'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { isoToEpochNano } from '../internal/timeMath'
import * as InstantFns from './instant'
import * as NowFns from './now'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainTimeFns from './plainTime'
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

// Utils
// -----------------------------------------------------------------------------

const systemResolvedOptions = new Intl.DateTimeFormat().resolvedOptions()
const systemTimeZoneId = systemResolvedOptions.timeZone

function getCurrentInstant() {
  return InstantFns.fromEpochMilliseconds(Date.now())
}

function getCurrentZonedDateTime(
  calendar: string,
  timeZone: string,
): ZonedDateTimeFns.ZonedDateTimeSlots<string, string> {
  return InstantFns.toZonedDateTime(getCurrentInstant(), { timeZone, calendar })
}

function expectEpochNanosSimilar(
  epochNano0: bigint,
  epochNano1: bigint,
): boolean {
  return Math.abs(Number(epochNano0 - epochNano1)) < 1000
}

function expectInstantsSimilar(
  inst0: InstantFns.InstantSlots,
  inst1: InstantFns.InstantSlots,
): void {
  expect(inst0.branding).toBe('Instant')
  expect(inst1.branding).toBe('Instant')
  expectEpochNanosSimilar(
    InstantFns.epochNanoseconds(inst0),
    InstantFns.epochNanoseconds(inst1),
  )
}

function expectZonedDateTimesSimilar(
  zdt0: ZonedDateTimeFns.ZonedDateTimeSlots<string, string>,
  zdt1: ZonedDateTimeFns.ZonedDateTimeSlots<string, string>,
): void {
  expect(zdt0.branding).toBe('ZonedDateTime')
  expect(zdt1.branding).toBe('ZonedDateTime')
  expect(zdt0.calendar).toBe(zdt1.calendar)
  expect(zdt0.timeZone).toBe(zdt1.timeZone)
  expectEpochNanosSimilar(
    ZonedDateTimeFns.epochNanoseconds(zdt0),
    ZonedDateTimeFns.epochNanoseconds(zdt1),
  )
}

function expectPlainDateTimesSimilar(
  pdt0: PlainDateTimeFns.PlainDateTimeSlots<string>,
  pdt1: PlainDateTimeFns.PlainDateTimeSlots<string>,
): void {
  expect(pdt0.branding).toBe('PlainDateTime')
  expect(pdt1.branding).toBe('PlainDateTime')
  expect(pdt0.calendar).toBe(pdt1.calendar)
  expectEpochNanosSimilar(
    dayTimeNanoToBigInt(isoToEpochNano(pdt0)!),
    dayTimeNanoToBigInt(isoToEpochNano(pdt1)!),
  )
}

function expectPlainDatesSimilar(
  pd0: PlainDateFns.PlainDateSlots<string>,
  pd1: PlainDateFns.PlainDateSlots<string>,
): void {
  expect(pd0.branding).toBe('PlainDate')
  expect(pd1.branding).toBe('PlainDate')
  expect(pd0.calendar).toBe(pd1.calendar)
  expectEpochNanosSimilar(
    dayTimeNanoToBigInt(isoToEpochNano(pd0)!),
    dayTimeNanoToBigInt(isoToEpochNano(pd1)!),
  )
}

function expectPlainTimesSimilar(
  pt0: PlainTimeFns.PlainTimeSlots,
  pt1: PlainTimeFns.PlainTimeSlots,
): void {
  expect(pt0.branding).toBe('PlainTime')
  expect(pt1.branding).toBe('PlainTime')
  expectEpochNanosSimilar(
    dayTimeNanoToBigInt(isoToEpochNano({ ...isoDateDefaults, ...pt0 })!),
    dayTimeNanoToBigInt(isoToEpochNano({ ...isoDateDefaults, ...pt1 })!),
  )
}

const isoDateDefaults = {
  isoYear: 0,
  isoMonth: 0,
  isoDay: 0,
}
