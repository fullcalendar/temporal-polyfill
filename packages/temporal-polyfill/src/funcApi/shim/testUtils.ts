import { expect } from 'vitest'
import { intlCalendarProvider } from '../../externalCalendars/intlCalendarProvider'
import { registerExternalCalendarProvider } from '../../internal/externalCalendar'
import { TimeFields } from '../../internal/fieldTypes'
import { isoCalendarId } from '../../internal/intlCalendarConfig'
import { systemTimeZoneId, testHotCache } from '../non-standard/testUtils'

export { systemTimeZoneId, testHotCache }

// The shim tests exercise source modules directly. The normal entry-point
// resolver may load the built intl-calendars bundle first, whose minified
// calendar-object shape is only compatible with built internals. Re-register
// the source provider so source calendar code receives source-shaped calendars.
registerExternalCalendarProvider(intlCalendarProvider)

const dateDefaults = {
  year: 0,
  month: 0,
  day: 0,
}

const timeDefaults = {
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}

const durationDefaults = {
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  microseconds: 0,
  nanoseconds: 0,
}

type CalendarSlots = Partial<typeof dateDefaults> & {
  calendarId?: string
}

type DateTimeSlots = CalendarSlots & Partial<TimeFields>
type YearMonthSlots = {
  calendarId?: string
  year?: number
  month?: number
  monthCode?: string
}
type MonthDaySlots = {
  calendarId?: string
  monthCode?: string
  day?: number
}

export function expectPlainDateEquals(pd: any, slots: CalendarSlots): void {
  slots = readExpectedDateFields(slots)
  expectCalendarId(pd, slots)
  expect(readDateFields(pd)).toStrictEqual({
    ...dateDefaults,
    ...slots,
    calendarId: slots.calendarId || isoCalendarId,
  })
}

export function expectPlainYearMonthEquals(
  pym: any,
  slots: YearMonthSlots,
): void {
  expectCalendarId(pym, slots)
  expect(readYearMonthFields(pym)).toStrictEqual({
    year: 0,
    month: 0,
    monthCode: formatMonthCode(slots.month || 1),
    ...slots,
    calendarId: slots.calendarId || isoCalendarId,
  })
}

export function expectPlainMonthDayEquals(
  pmd: any,
  slots: MonthDaySlots,
): void {
  expectCalendarId(pmd, slots)
  expect(readMonthDayFields(pmd, slots)).toStrictEqual({
    monthCode: 'M01',
    day: 0,
    ...slots,
    calendarId: slots.calendarId || isoCalendarId,
  })
}

export function expectPlainDateTimeEquals(
  pdt: any,
  slots: DateTimeSlots,
): void {
  slots = readExpectedDateTimeFields(slots)
  expectCalendarId(pdt, slots)
  expect(readDateTimeFields(pdt)).toStrictEqual({
    ...dateDefaults,
    ...timeDefaults,
    ...slots,
    calendarId: slots.calendarId || isoCalendarId,
  })
}

export function expectZonedDateTimeEquals(
  zdt: any,
  slots: {
    epochNanoseconds: bigint
    timeZoneId?: string
    calendarId?: string
  },
): void {
  slots = readExpectedZonedDateTimeFields(slots)
  expectCalendarId(zdt, slots)
  expect(zdt.timeZoneId).toBe(slots.timeZoneId || zdt.timeZoneId)
  expect({
    calendarId: zdt.calendarId,
    timeZoneId: zdt.timeZoneId,
    epochNanoseconds: zdt.epochNanoseconds,
  }).toStrictEqual({
    calendarId: slots.calendarId || isoCalendarId,
    timeZoneId: slots.timeZoneId || zdt.timeZoneId,
    epochNanoseconds: slots.epochNanoseconds,
  })
}

export function expectPlainTimeEquals(
  pt: any,
  slots: Partial<TimeFields>,
): void {
  expect(readTimeFields(pt)).toStrictEqual({
    ...timeDefaults,
    ...slots,
  })
}

export function expectInstantEquals(inst: any, epochNanoseconds: bigint): void {
  expect({ epochNanoseconds: inst.epochNanoseconds }).toStrictEqual({
    epochNanoseconds,
  })
}

export function expectDurationEquals(
  d: any,
  fields: Partial<typeof durationDefaults>,
): void {
  const bagToSlots = {
    ...durationDefaults,
    ...fields,
  }
  expect(readDurationFields(d)).toStrictEqual(bagToSlots)
}

function expectCalendarId(record: any, slots: { calendarId?: string }): void {
  expect(record.calendarId).toBe(slots.calendarId || isoCalendarId)
}

function readDateFields(record: any) {
  return {
    calendarId: record.calendarId,
    year: record.year,
    month: record.month,
    day: record.day,
  }
}

function readExpectedDateFields(slots: any): CalendarSlots {
  return shouldReadExpectedRecord(slots) ? readDateFields(slots) : slots
}

function readExpectedDateTimeFields(slots: any): DateTimeSlots {
  return shouldReadExpectedRecord(slots) ? readDateTimeFields(slots) : slots
}

function readExpectedZonedDateTimeFields(slots: any) {
  return shouldReadExpectedRecord(slots)
    ? {
        calendarId: slots.calendarId,
        timeZoneId: slots.timeZoneId,
        epochNanoseconds: slots.epochNanoseconds,
      }
    : slots
}

function shouldReadExpectedRecord(slots: any): boolean {
  return slots && Object.keys(slots).length === 0
}

function readYearMonthFields(record: any) {
  return {
    calendarId: record.calendarId,
    year: record.year,
    month: record.month,
    monthCode: record.monthCode,
  }
}

function readMonthDayFields(record: any, _slots: MonthDaySlots) {
  return {
    calendarId: record.calendarId,
    monthCode: record.monthCode,
    day: record.day,
  }
}

function readDateTimeFields(record: any) {
  return {
    ...readDateFields(record),
    ...readTimeFields(record),
  }
}

function readTimeFields(record: any) {
  return {
    hour: record.hour,
    minute: record.minute,
    second: record.second,
    millisecond: record.millisecond,
    microsecond: record.microsecond,
    nanosecond: record.nanosecond,
  }
}

function readDurationFields(record: any) {
  return {
    years: record.years,
    months: record.months,
    weeks: record.weeks,
    days: record.days,
    hours: record.hours,
    minutes: record.minutes,
    seconds: record.seconds,
    milliseconds: record.milliseconds,
    microseconds: record.microseconds,
    nanoseconds: record.nanoseconds,
  }
}

function formatMonthCode(month: number): string {
  return 'M' + String(month).padStart(2, '0')
}
