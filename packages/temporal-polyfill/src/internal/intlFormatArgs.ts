import {
  type CalendarImpl,
  getCalendarSlotId,
  isoCalendarImpl,
} from './calendarImpl'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { ZonedEpochNanoFields } from './slots'
import { utcTimeZoneId } from './timeZoneConfig'

type CalendarFormatSlots<S> = S & { calendar: CalendarImpl }

export type CalendarDateFormatSlots = CalendarFormatSlots<CalendarDateFields>
export type CalendarDateTimeFormatSlots =
  CalendarFormatSlots<CalendarDateTimeFields>
export type ZonedDateTimeFormatSlots = CalendarFormatSlots<ZonedEpochNanoFields>

// DateTimeFormat Time-Zone Options
// -----------------------------------------------------------------------------

export function applyPlainFormatTimeZone(
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  // Plain types have no time zone, but Intl still needs a neutral time zone
  // because we format their ISO fields by mapping them onto epoch milliseconds.
  options.timeZone = utcTimeZoneId

  // full/long timeStyle would expose a time-zone name. Plain Temporal types do
  // not have one, so keep the same visible time fields with a shorter style.
  if (['full', 'long'].includes(options.timeStyle!)) {
    options.timeStyle = 'medium'
  }

  return options
}

export function applyZonedFormatTimeZone(
  options: Intl.DateTimeFormatOptions,
  timeZoneId: string,
): Intl.DateTimeFormatOptions {
  if (options.timeZone !== undefined) {
    throw new TypeError(errorMessages.forbiddenFormatTimeZone)
  }
  options.timeZone = timeZoneId
  return options
}

// Slot Compatibility
// -----------------------------------------------------------------------------

export function checkResolvedCalendarCompatible(
  format: Intl.DateTimeFormat,
  slots: { calendar: CalendarImpl },
  strictCalendarCheck?: boolean,
): void {
  const resolvedCalendarId = format.resolvedOptions().calendar

  if (
    (strictCalendarCheck || slots.calendar !== isoCalendarImpl) &&
    getCalendarSlotId(slots.calendar) !== resolvedCalendarId
  ) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }
}
