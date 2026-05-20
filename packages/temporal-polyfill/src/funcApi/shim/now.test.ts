import { describe, expect, it } from 'vitest'
import * as InstantFns from './instant'
import * as NowFns from './now'
import { systemTimeZoneId } from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

describe('timeZoneId', () => {
  it('returns the system time zone', () => {
    expect(NowFns.timeZoneId()).toBe(systemTimeZoneId)
  })
})

describe('instant', () => {
  it('returns now', () => {
    const inst0 = NowFns.instant()
    const inst1 = InstantFns.fromEpochMilliseconds(Date.now())
    expectEpochNanosSimilar(inst0.epochNanoseconds, inst1.epochNanoseconds)
  })
})

describe('zonedDateTimeISO', () => {
  it('returns now, assuming system time zone', () => {
    const zdt0 = NowFns.zonedDateTimeISO()
    const zdt1 = InstantFns.toZonedDateTimeISO(
      InstantFns.fromEpochMilliseconds(Date.now()),
      systemTimeZoneId,
    )
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })

  it('returns now with a given time zone', () => {
    const zdt0 = NowFns.zonedDateTimeISO('America/Chicago')
    const zdt1 = InstantFns.toZonedDateTimeISO(
      InstantFns.fromEpochMilliseconds(Date.now()),
      'America/Chicago',
    )
    expectZonedDateTimesSimilar(zdt0, zdt1)
  })
})

describe('plainDateTimeISO', () => {
  it('returns current date-time, assuming system time zone', () => {
    const pdt0 = NowFns.plainDateTimeISO()
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        systemTimeZoneId,
      ),
    )
    expectEpochMillisSimilar(
      toEpochMilliseconds(pdt0),
      toEpochMilliseconds(pdt1),
    )
  })

  it('returns current date-time with a given time zone', () => {
    const pdt0 = NowFns.plainDateTimeISO('America/Chicago')
    const pdt1 = ZonedDateTimeFns.toPlainDateTime(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        'America/Chicago',
      ),
    )
    expectEpochMillisSimilar(
      toEpochMilliseconds(pdt0),
      toEpochMilliseconds(pdt1),
    )
  })
})

describe('plainDateISO', () => {
  it('returns current date, assuming system time zone', () => {
    const pd0 = NowFns.plainDateISO()
    const pd1 = ZonedDateTimeFns.toPlainDate(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        systemTimeZoneId,
      ),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })

  it('returns current date with a given time zone', () => {
    const pd0 = NowFns.plainDateISO('America/Chicago')
    const pd1 = ZonedDateTimeFns.toPlainDate(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        'America/Chicago',
      ),
    )
    expectPlainDatesSimilar(pd0, pd1)
  })
})

describe('plainTimeISO', () => {
  it('returns current time, assuming system time zone', () => {
    const pt0 = NowFns.plainTimeISO()
    const pt1 = ZonedDateTimeFns.toPlainTime(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        systemTimeZoneId,
      ),
    )
    expectEpochMillisSimilar(toEpochMilliseconds(pt0), toEpochMilliseconds(pt1))
  })

  it('returns current time with a given time zone', () => {
    const pt0 = NowFns.plainTimeISO('America/Chicago')
    const pt1 = ZonedDateTimeFns.toPlainTime(
      InstantFns.toZonedDateTimeISO(
        InstantFns.fromEpochMilliseconds(Date.now()),
        'America/Chicago',
      ),
    )
    expectEpochMillisSimilar(toEpochMilliseconds(pt0), toEpochMilliseconds(pt1))
  })
})

function expectZonedDateTimesSimilar(zdt0: any, zdt1: any): void {
  expect(normalizeCalendarId(zdt0.calendarId)).toBe(
    normalizeCalendarId(zdt1.calendarId),
  )
  expect(readTimeZoneId(zdt0)).toBe(readTimeZoneId(zdt1))
  expectEpochNanosSimilar(zdt0.epochNanoseconds, zdt1.epochNanoseconds)
}

function expectPlainDatesSimilar(pd0: any, pd1: any): void {
  expect(normalizeCalendarId(pd0.calendarId)).toBe(
    normalizeCalendarId(pd1.calendarId),
  )
  expect(toEpochMilliseconds(pd0)).toBe(toEpochMilliseconds(pd1))
}

function expectEpochNanosSimilar(epochNano0: bigint, epochNano1: bigint): void {
  expect(Math.abs(Number(epochNano0 - epochNano1))).toBeLessThan(1_000_000_000)
}

function expectEpochMillisSimilar(
  epochMilli0: number,
  epochMilli1: number,
): void {
  expect(Math.abs(epochMilli0 - epochMilli1)).toBeLessThan(1000)
}

function toEpochMilliseconds(fields: any): number {
  return Date.UTC(
    fields.year || 1970,
    (fields.month || 1) - 1,
    fields.day || 1,
    fields.hour || 0,
    fields.minute || 0,
    fields.second || 0,
    fields.millisecond || 0,
  )
}

function normalizeCalendarId(calendarId: string | undefined): string {
  return calendarId || 'iso8601'
}

function readTimeZoneId(zdt: any): string {
  return zdt.timeZoneId || zdt.timeZone.id
}
