import { type CalendarSlot, getCalendarSlotId } from './calendarSlot'
import * as errorMessages from './errorMessages'
import { type ZonedEpochNanoFields } from './slots'
import { type TimeZone } from './timeZone'

// These helpers compare the identity-bearing parts of Temporal slots without
// tying that logic to a specific caller like diffing or Intl formatting.

export function getCommonCalendar(
  a: CalendarSlot,
  b: CalendarSlot,
): CalendarSlot {
  if (getCalendarSlotId(a) !== getCalendarSlotId(b)) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }

  return a
}

export function getCommonTimeZone(a: TimeZone, b: TimeZone): TimeZone {
  if (a.compareKey !== b.compareKey) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }

  return a
}

// Formatting paths usually need the canonical ID that will be passed back into
// Intl, not the full TimeZone object.
export function getZonedTimeZoneId(slots: ZonedEpochNanoFields): string {
  return slots.timeZone.id
}

export function getCommonZonedRangeTimeZoneId(
  slots0: ZonedEpochNanoFields,
  slots1: ZonedEpochNanoFields,
): string {
  return getCommonTimeZone(slots0.timeZone, slots1.timeZone).id
}
