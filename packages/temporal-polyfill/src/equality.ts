import { compareDayTimeNanos } from './dayTimeNano'
import { isTimeZonesEqual } from './timeZoneOps'
import { compareIsoDateTimeFields, compareIsoDateFields } from './isoMath'
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots } from './slots'
import { isCalendarSlotsEqual } from './calendarSlot'

export function isPlainDateTimesEqual(
  a: IsoDateTimeSlots,
  b: IsoDateTimeSlots
): boolean {
  return !compareIsoDateTimeFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}

export function isPlainDatesEqual(
  a: IsoDateSlots,
  b: IsoDateSlots
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}

export function isPlainMonthDaysEqual(
  a: IsoDateSlots,
  b: IsoDateSlots
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}

export function isPlainYearMonthsEqual(
  a: IsoDateSlots,
  b: IsoDateSlots
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}

export function isZonedDateTimesEqual(
  a: ZonedEpochSlots,
  b: ZonedEpochSlots
): boolean {
  return !compareDayTimeNanos(a.epochNanoseconds, b.epochNanoseconds) &&
    isTimeZonesEqual(a.timeZone, b.timeZone) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}
