import { expect } from 'vitest'
import { computeDurationSign } from '../internal/durationMath'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../internal/epochMath'
import {
  getInternalCalendarId,
  isoCalendar,
} from '../internal/externalCalendar'
import { TimeFields } from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { AbstractDateSlots, AbstractDateTimeSlots } from '../internal/slots'
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
  return InstantFns.toZonedDateTime(getCurrentInstant(), {
    timeZone: timeZoneId,
    calendar: calendarId,
  })
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
  branding: 'PlainDate',
  calendar: isoCalendar,
}

const plainYearMonthDefaults = {
  branding: 'PlainYearMonth',
  calendar: isoCalendar,
}

const plainMonthDayDefaults = {
  branding: 'PlainMonthDay',
  calendar: isoCalendar,
}

const plainDateTimeDefaults = {
  branding: 'PlainDateTime',
  calendar: isoCalendar,
}

const plainTimeDefaults = {
  branding: 'PlainTime',
}

const zonedDateTimeDefaults = {
  branding: 'ZonedDateTime',
}

const instantSlotDefaults = {
  branding: 'Instant',
  epochNanoseconds: 0n,
}

const durationSlotDefaults = {
  branding: 'Duration',
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

export function expectPlainDateEquals(
  pd: PlainDateFns.Record,
  slots: Partial<AbstractDateSlots> & { calendarId?: string },
): void {
  assertCalendarId(pd.calendar, slots)
  expectPropsEqualStrict(pd, {
    ...plainDateDefaults,
    ...dateDefaults,
    ...normalizeCalendarSlots(pd.calendar, slots),
  })
}

export function expectPlainYearMonthEquals(
  pym: PlainYearMonthFns.Record,
  slots: Partial<AbstractDateSlots> & { calendarId?: string },
): void {
  assertCalendarId(pym.calendar, slots)
  expectPropsEqualStrict(pym, {
    ...plainYearMonthDefaults,
    ...dateDefaults,
    day: 1,
    ...normalizeCalendarSlots(pym.calendar, slots),
  })
}

export function expectPlainMonthDayEquals(
  pym: PlainMonthDayFns.Record,
  slots: Partial<AbstractDateSlots> & { calendarId?: string },
): void {
  assertCalendarId(pym.calendar, slots)
  expectPropsEqualStrict(pym, {
    ...plainMonthDayDefaults,
    ...dateDefaults,
    year: 1972,
    ...normalizeCalendarSlots(pym.calendar, slots),
  })
}

export function expectPlainDateTimeEquals(
  pdt: PlainDateTimeFns.Record,
  slots: Partial<AbstractDateTimeSlots> & { calendarId?: string },
): void {
  assertCalendarId(pdt.calendar, slots)
  expectPropsEqualStrict(pdt, {
    ...plainDateTimeDefaults,
    ...timeDefaults,
    ...dateDefaults,
    ...normalizeCalendarSlots(pdt.calendar, slots),
  })
}

export function expectZonedDateTimeEquals(
  zdt: ZonedDateTimeFns.Record,
  slots: {
    epochNanoseconds: bigint
    timeZoneId?: string
    calendarId?: string
  },
): void {
  assertCalendarId(zdt.calendar, slots)
  assertTimeZoneId(zdt.timeZone, slots)
  const normalizedSlots = normalizeZonedSlots(zdt, slots)
  expectPropsEqualStrict(zdt, {
    ...zonedDateTimeDefaults,
    ...normalizedSlots,
  })
}

function normalizeCalendarSlots<T extends { calendarId?: string }>(
  calendar: AbstractDateSlots['calendar'],
  slots: T,
): Omit<T, 'calendarId'> & { calendar: AbstractDateSlots['calendar'] } {
  const { calendarId: _, ...rest } = slots
  return {
    ...rest,
    calendar,
  }
}

function normalizeZonedSlots(
  zdt: ZonedDateTimeFns.Record,
  slots: {
    epochNanoseconds: bigint
    timeZoneId?: string
    calendarId?: string
  },
) {
  const {
    calendarId: _calendarId,
    timeZoneId: _timeZoneId,
    epochNanoseconds,
  } = slots
  return {
    calendar: zdt.calendar,
    timeZone: zdt.timeZone,
    epochNanoseconds,
  }
}

function assertCalendarId(
  calendar: AbstractDateSlots['calendar'],
  slots: { calendar?: AbstractDateSlots['calendar']; calendarId?: string },
): void {
  const expectedCalendarId =
    slots.calendarId ||
    ('calendar' in slots ? getInternalCalendarId(slots.calendar) : 'iso8601')
  expect(getInternalCalendarId(calendar)).toBe(expectedCalendarId)
}

function assertTimeZoneId(
  timeZone: ZonedDateTimeFns.Record['timeZone'],
  slots: {
    timeZone?: ZonedDateTimeFns.Record['timeZone']
    timeZoneId?: string
  },
): void {
  const expectedTimeZoneId =
    slots.timeZoneId || ('timeZone' in slots ? slots.timeZone.id : timeZone.id)
  expect(timeZone.id).toBe(expectedTimeZoneId)
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
  expect(pdt0.branding).toBe('PlainDateTime')
  expect(pdt1.branding).toBe('PlainDateTime')
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
  expect(pd0.branding).toBe('PlainDate')
  expect(pd1.branding).toBe('PlainDate')
  expect(getInternalCalendarId(pd0.calendar)).toBe(
    getInternalCalendarId(pd1.calendar),
  )
  expectEpochNanosSimilar(isoDateToEpochNano(pd0)!, isoDateToEpochNano(pd1)!)
}

export function expectPlainTimesSimilar(
  pt0: PlainTimeFns.Record,
  pt1: PlainTimeFns.Record,
): void {
  expect(pt0.branding).toBe('PlainTime')
  expect(pt1.branding).toBe('PlainTime')
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
