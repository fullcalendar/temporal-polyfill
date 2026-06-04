import {
  type CalendarSlot,
  getCalendarSlotId,
  isoCalendar,
} from './calendarSlot'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { isoCalendarId } from './intlCalendarConfig'
import { RawDateTimeFormat } from './intlFormatUtils'
import { ZonedEpochNanoFields } from './slots'
import { utcTimeZoneId } from './timeZoneConfig'

type CalendarFormatSlots<S> = S & { calendar: CalendarSlot }

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
  slots: { calendar: CalendarSlot },
  strictCalendarCheck?: boolean,
): void {
  const resolvedCalendarId = format.resolvedOptions().calendar

  if (
    (strictCalendarCheck || slots.calendar !== isoCalendar) &&
    getCalendarSlotId(slots.calendar) !== resolvedCalendarId
  ) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }
}

/*
Detect bug where explicitly specifying calendar:iso8601 results in calendar:gregory
Happens in Node 14 and some version of V8 (Chrome version 80 at least)
https://github.com/nodejs/node/issues/42440
https://codepen.io/arshaw/pen/RNwVewm?editors=0010

If buggy, relax strictCalendarChecks for PlainYearMonth/PlainMonthDay.
*/
// HACK for pureTopLevel
function computeNonBuggyIsoResolve() {
  return (
    new RawDateTimeFormat(undefined, {
      calendar: isoCalendarId,
    }).resolvedOptions().calendar === isoCalendarId
  )
}
export const strictPartialDateCalendarCheck = computeNonBuggyIsoResolve()
