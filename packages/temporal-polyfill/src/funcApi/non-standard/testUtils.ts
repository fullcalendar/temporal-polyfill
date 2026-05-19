import { expect } from 'vitest'
import { computeDurationSign } from '../../internal/durationMath'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../../internal/epochMath'
import {
  type InternalCalendar,
  getInternalCalendarId,
  isoCalendar,
} from '../../internal/externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { type ZonedEpochNanoFields } from '../../internal/slots'
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
  calendarId: string,
  timeZoneId: string,
): ZonedDateTimeFns.Record {
  return ZonedDateTimeFns.withCalendar(
    InstantFns.toZonedDateTimeISO(getCurrentInstant(), timeZoneId),
    calendarId,
  )
}

// Equality
// -----------------------------------------------------------------------------
// Keep these defaults in the same insertion order as real slots. Date-time
// slots are unit-ascending, so the smaller time fields come before date fields.

const dateDefaults = {
  day: 0,
  month: 0,
  year: 0,
}

const timeDefaults = {
  nanosecond: 0,
  microsecond: 0,
  millisecond: 0,
  second: 0,
  minute: 0,
  hour: 0,
}

const plainDateDefaults = {
  calendar: isoCalendar,
}

const plainYearMonthDefaults = {
  calendar: isoCalendar,
}

const plainMonthDayDefaults = {
  calendar: isoCalendar,
}

const plainDateTimeDefaults = {
  calendar: isoCalendar,
}

const plainTimeDefaults = {}

const zonedDateTimeDefaults = {}

const instantSlotDefaults = {
  epochNanoseconds: 0n,
}

const durationSlotDefaults = {
  sign: 0,
  nanoseconds: 0,
  microseconds: 0,
  milliseconds: 0,
  seconds: 0,
  minutes: 0,
  hours: 0,
  days: 0,
  weeks: 0,
  months: 0,
  years: 0,
}

type CalendarSlots = Partial<
  CalendarDateFields & { calendar: InternalCalendar }
>

type DateTimeSlots = Partial<
  CalendarDateTimeFields & { calendar: InternalCalendar }
>

type ZonedDateTimeSlots = Partial<
  ZonedEpochNanoFields & { calendar: InternalCalendar }
> & {
  epochNanoseconds: bigint
}

export function expectPlainDateEquals(
  pd: PlainDateFns.Record,
  slots: CalendarSlots,
): void {
  expectPropsEqualStrict(pd, {
    ...plainDateDefaults,
    ...dateDefaults,
    ...slots,
  })
}

export function expectPlainYearMonthEquals(
  pym: PlainYearMonthFns.Record,
  slots: CalendarSlots,
): void {
  expectPropsEqualStrict(pym, {
    ...plainYearMonthDefaults,
    ...dateDefaults,
    day: 1,
    ...slots,
  })
}

export function expectPlainMonthDayEquals(
  pym: PlainMonthDayFns.Record,
  slots: CalendarSlots,
): void {
  expectPropsEqualStrict(pym, {
    ...plainMonthDayDefaults,
    ...dateDefaults,
    year: 1972,
    ...slots,
  })
}

export function expectPlainDateTimeEquals(
  pdt: PlainDateTimeFns.Record,
  slots: DateTimeSlots,
): void {
  expectPropsEqualStrict(pdt, {
    ...plainDateTimeDefaults,
    ...timeDefaults,
    ...dateDefaults,
    ...slots,
  })
}

export function expectZonedDateTimeEquals(
  zdt: ZonedDateTimeFns.Record,
  slots: ZonedDateTimeSlots,
): void {
  expectPropsEqualStrict(zdt, {
    ...zonedDateTimeDefaults,
    ...slots,
  })
}

export function expectPlainTimeEquals(
  pt: PlainTimeFns.Record,
  slots: Partial<TimeFields>,
): void {
  expectPropsEqualStrict(pt, {
    ...plainTimeDefaults,
    ...timeDefaults,
    ...slots,
  })
}

export function expectInstantEquals(
  inst: InstantFns.Record,
  epochNanoseconds: bigint,
): void {
  expectPropsEqualStrict(inst, {
    ...instantSlotDefaults,
    epochNanoseconds,
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
  expectEpochNanosSimilar(
    InstantFns.epochNanoseconds(inst0),
    InstantFns.epochNanoseconds(inst1),
  )
}

export function expectZonedDateTimesSimilar(
  zdt0: ZonedDateTimeFns.Record,
  zdt1: ZonedDateTimeFns.Record,
): void {
  expect(getInternalCalendarId(zdt0.calendar)).toBe(
    getInternalCalendarId(zdt1.calendar),
  )
  expect(zdt0.timeZone.id).toBe(zdt1.timeZone.id)
  expectEpochNanosSimilar(
    ZonedDateTimeFns.epochNanoseconds(zdt0),
    ZonedDateTimeFns.epochNanoseconds(zdt1),
  )
}

export function expectPlainDateTimesSimilar(
  pdt0: PlainDateTimeFns.Record,
  pdt1: PlainDateTimeFns.Record,
): void {
  expect(getInternalCalendarId(pdt0.calendar)).toBe(
    getInternalCalendarId(pdt1.calendar),
  )
  expectEpochNanosSimilar(
    isoDateTimeToEpochNano(pdt0)!,
    isoDateTimeToEpochNano(pdt1)!,
  )
}

export function expectPlainDatesSimilar(
  pd0: PlainDateFns.Record,
  pd1: PlainDateFns.Record,
): void {
  expect(getInternalCalendarId(pd0.calendar)).toBe(
    getInternalCalendarId(pd1.calendar),
  )
  expectEpochNanosSimilar(isoDateToEpochNano(pd0)!, isoDateToEpochNano(pd1)!)
}

export function expectPlainTimesSimilar(
  pt0: PlainTimeFns.Record,
  pt1: PlainTimeFns.Record,
): void {
  expectEpochNanosSimilar(
    isoDateTimeToEpochNano(combineDateAndTime(dateDefaults, pt0))!,
    isoDateTimeToEpochNano(combineDateAndTime(dateDefaults, pt1))!,
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
