import {
  type CalendarImpl,
  getCalendarSlotId,
  isoCalendarImpl,
} from './calendarImpl'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { checkCalendarIdsMatch } from './slotUtils'
import { ZonedEpochNanoFields } from './slots'
import { utcTimeZoneId } from './timeZoneConfig'
import { throwTypeError } from './utils'

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
    throwTypeError(errorMessages.forbiddenFormatTimeZone)
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
  // ISO values format in any locale calendar unless the type is strict
  // (PlainYearMonth/PlainMonthDay), so only then is resolvedOptions() needed.
  // The object's calendar is named first and the locale's second.
  if (strictCalendarCheck || slots.calendar !== isoCalendarImpl) {
    checkCalendarIdsMatch(
      getCalendarSlotId(slots.calendar),
      format.resolvedOptions().calendar,
    )
  }
}
