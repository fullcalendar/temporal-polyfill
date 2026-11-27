import { type CalendarImpl, getCalendarSlotId } from './calendarImpl'
import * as errorMessages from './errorMessages'
import { type ZonedEpochNanoFields } from './slots'
import { type TimeZone } from './timeZone'
import { throwRangeError } from './utils'

// These helpers compare the identity-bearing parts of Temporal slots without
// tying that logic to a specific caller like diffing or Intl formatting.

export function getCommonCalendar(
  a: CalendarImpl,
  b: CalendarImpl,
): CalendarImpl {
  checkCalendarIdsMatch(getCalendarSlotId(a), getCalendarSlotId(b))
  return a
}

// The one place a calendar mismatch is detected and reported. Callers compare
// IDs rather than CalendarImpl records because one side may come from outside
// a slot, e.g. the calendar an Intl.DateTimeFormat's locale resolved to.
export function checkCalendarIdsMatch(
  calendarId0: string,
  calendarId1: string,
): void {
  if (calendarId0 !== calendarId1) {
    throwRangeError(
      errorMessages.mismatchingCalendars(calendarId0, calendarId1),
    )
  }
}

export function getCommonTimeZone(a: TimeZone, b: TimeZone): TimeZone {
  // compareKey, not id: aliases of the same zone (e.g. Asia/Calcutta and
  // Asia/Kolkata) are equal. The ids are only for the error message.
  if (a.compareKey !== b.compareKey) {
    throwRangeError(errorMessages.mismatchingTimeZones(a.id, b.id))
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
