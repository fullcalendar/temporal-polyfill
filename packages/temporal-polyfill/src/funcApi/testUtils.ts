import { expect } from 'vitest'
import { BigNano, bigIntToBigNano, bigNanoToBigInt } from '../internal/bigNano'
import { computeDurationSign } from '../internal/durationMath'
import { IsoTimeFields } from '../internal/isoFields'
import { DateSlots, DateTimeSlots } from '../internal/slots'
import { isoToEpochNano } from '../internal/timeMath'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import * as ZonedDateTimeFns from './zonedDateTime'

// Current
// -----------------------------------------------------------------------------

const systemResolvedOptions = new Intl.DateTimeFormat().resolvedOptions()
export const systemTimeZoneId = systemResolvedOptions.timeZone

export function getCurrentInstant() {
  return InstantFns.fromEpochMilliseconds(Date.now())
}

export function getCurrentZonedDateTime(
  calendar: string,
  timeZone: string,
): ZonedDateTimeFns.Record {
  return InstantFns.toZonedDateTime(getCurrentInstant(), { timeZone, calendar })
}

// Equality
// -----------------------------------------------------------------------------
// All props should be alphabetized because they serve as a base for
// constructing comparable slots, retaining order.

const isoDateDefaults = {
  isoDay: 0,
  isoMonth: 0,
  isoYear: 0,
}

const isoTimeDefaults = {
  isoHour: 0,
  isoMicrosecond: 0,
  isoMillisecond: 0,
  isoMinute: 0,
  isoNanosecond: 0,
  isoSecond: 0,
}

const isoDateTimeDefaults = {
  isoDay: 0,
  isoHour: 0,
  isoMicrosecond: 0,
  isoMillisecond: 0,
  isoMinute: 0,
  isoMonth: 0,
  isoNanosecond: 0,
  isoSecond: 0,
  isoYear: 0,
}

const plainDateDefaults = {
  branding: 'PlainDate',
  calendar: 'iso8601',
  ...isoDateDefaults,
}

const plainYearMonthDefaults = {
  branding: 'PlainYearMonth',
  calendar: 'iso8601',
  ...isoDateDefaults,
  isoDay: 1,
}

const plainMonthDayDefaults = {
  branding: 'PlainMonthDay',
  calendar: 'iso8601',
  ...isoDateDefaults,
  isoYear: 1972,
}

const plainDateTimeDefaults = {
  branding: 'PlainDateTime',
  calendar: 'iso8601',
  ...isoDateTimeDefaults,
}

const plainTimeDefaults = {
  branding: 'PlainTime',
  ...isoTimeDefaults,
}

const zonedDateTimeDefaults = {
  branding: 'ZonedDateTime',
  calendar: 'iso8601',
  timeZone: '',
  epochNanoseconds: 0n,
}

const instantSlotDefaults = {
  branding: 'Instant',
  epochNanoseconds: 0n,
}

const durationSlotDefaults = {
  branding: 'Duration',
  sign: 0,
  days: 0,
  hours: 0,
  microseconds: 0,
  milliseconds: 0,
  minutes: 0,
  months: 0,
  nanoseconds: 0,
  seconds: 0,
  weeks: 0,
  years: 0,
}

export function expectPlainDateEquals(
  pd: PlainDateFns.Record,
  slots: Partial<DateSlots>,
): void {
  expectPropsEqualStrict(pd, {
    ...plainDateDefaults,
    ...slots,
  })
}

export function expectPlainYearMonthEquals(
  pym: PlainYearMonthFns.Record,
  slots: Partial<DateSlots>,
): void {
  expectPropsEqualStrict(pym, {
    ...plainYearMonthDefaults,
    ...slots,
  })
}

export function expectPlainMonthDayEquals(
  pym: PlainMonthDayFns.Record,
  slots: Partial<DateSlots>,
): void {
  expectPropsEqualStrict(pym, {
    ...plainMonthDayDefaults,
    ...slots,
  })
}

export function expectPlainDateTimeEquals(
  pdt: PlainDateTimeFns.Record,
  slots: Partial<DateTimeSlots>,
): void {
  expectPropsEqualStrict(pdt, {
    ...plainDateTimeDefaults,
    ...slots,
  })
}

export function expectZonedDateTimeEquals(
  zdt: ZonedDateTimeFns.Record,
  slots: {
    epochNanoseconds: bigint | BigNano
    timeZone: string
    calendar?: string
  },
): void {
  expectPropsEqualStrict(zdt, {
    ...zonedDateTimeDefaults,
    ...slots,
    epochNanoseconds:
      typeof slots.epochNanoseconds === 'bigint'
        ? bigIntToBigNano(slots.epochNanoseconds)
        : slots.epochNanoseconds,
  })
}

export function expectPlainTimeEquals(
  pt: PlainTimeFns.Record,
  slots: Partial<IsoTimeFields>,
): void {
  expectPropsEqualStrict(pt, {
    ...plainTimeDefaults,
    ...slots,
  })
}

export function expectInstantEquals(
  inst: InstantFns.Record,
  epochNanoseconds: bigint,
): void {
  expectPropsEqualStrict(inst, {
    ...instantSlotDefaults,
    epochNanoseconds: bigIntToBigNano(epochNanoseconds),
  })
}

export function expectDurationEquals(
  d: DurationFns.Record,
  fields: DurationFns.WithFields,
): void {
  const bagToSlots = {
    ...durationSlotDefaults,
    ...fields,
  }
  expectPropsEqualStrict(d, {
    ...bagToSlots,
    sign: computeDurationSign(bagToSlots),
  })
}

function expectPropsEqualStrict(obj0: {}, obj1: {}): void {
  expect(obj0).toStrictEqual(obj1)
  expect(Object.keys(obj0)).toStrictEqual(Object.keys(obj1))
}

// Similarity
// -----------------------------------------------------------------------------

export function expectInstantsSimilar(
  inst0: InstantFns.Record,
  inst1: InstantFns.Record,
): void {
  expect(inst0.branding).toBe('Instant')
  expect(inst1.branding).toBe('Instant')
  expectEpochNanosSimilar(
    InstantFns.epochNanoseconds(inst0),
    InstantFns.epochNanoseconds(inst1),
  )
}

export function expectZonedDateTimesSimilar(
  zdt0: ZonedDateTimeFns.Record,
  zdt1: ZonedDateTimeFns.Record,
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

export function expectPlainDateTimesSimilar(
  pdt0: PlainDateTimeFns.Record,
  pdt1: PlainDateTimeFns.Record,
): void {
  expect(pdt0.branding).toBe('PlainDateTime')
  expect(pdt1.branding).toBe('PlainDateTime')
  expect(pdt0.calendar).toBe(pdt1.calendar)
  expectEpochNanosSimilar(
    bigNanoToBigInt(isoToEpochNano(pdt0)!),
    bigNanoToBigInt(isoToEpochNano(pdt1)!),
  )
}

export function expectPlainDatesSimilar(
  pd0: PlainDateFns.Record,
  pd1: PlainDateFns.Record,
): void {
  expect(pd0.branding).toBe('PlainDate')
  expect(pd1.branding).toBe('PlainDate')
  expect(pd0.calendar).toBe(pd1.calendar)
  expectEpochNanosSimilar(
    bigNanoToBigInt(isoToEpochNano(pd0)!),
    bigNanoToBigInt(isoToEpochNano(pd1)!),
  )
}

export function expectPlainTimesSimilar(
  pt0: PlainTimeFns.Record,
  pt1: PlainTimeFns.Record,
): void {
  expect(pt0.branding).toBe('PlainTime')
  expect(pt1.branding).toBe('PlainTime')
  expectEpochNanosSimilar(
    bigNanoToBigInt(isoToEpochNano({ ...isoDateDefaults, ...pt0 })!),
    bigNanoToBigInt(isoToEpochNano({ ...isoDateDefaults, ...pt1 })!),
  )
}

function expectEpochNanosSimilar(
  epochNano0: bigint,
  epochNano1: bigint,
): boolean {
  return Math.abs(Number(epochNano0 - epochNano1)) < 1000
}

// Cache
// -----------------------------------------------------------------------------

// Repeated calls to toLocaleString/etc should be faster because the internal
// Intl.DateTimeFormat is cached. However, these Vitest tests sometimes give
// odd results. If tests are run with describe/it.only, then second run is
// usually 0.1, but often there's no speedup when tests are run in parallel
// and not in isolation. Disable for now.
const HOT_CACHE_FACTOR = 0 // 0.5

export function testHotCache<R>(op: () => R): R {
  if (HOT_CACHE_FACTOR) {
    const t0 = performance.now()
    const r0 = op()
    const t1 = performance.now()
    const r1 = op()
    const t2 = performance.now()

    expect(r0).toEqual(r1)
    expect(t2 - t1).toBeLessThan((t1 - t0) * HOT_CACHE_FACTOR)
  }
  return op()
}
