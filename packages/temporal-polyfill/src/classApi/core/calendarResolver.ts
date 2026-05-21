import {
  type CalendarSlot,
  gregoryCalendar,
  isoCalendar,
} from '../../internal/calendarSlot'
import { requireString } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'

// classApi-only policy: the core bundle ships just ISO + Gregory; any other
// calendar id is a request for the "full" build and is rejected here. funcApi
// resolves via its own shim that can route through exotic calendars.
export function resolveCoreCalendar(rawCalendarId: string): CalendarSlot {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  throw new RangeError(
    errorMessages.exoticCalendarRequired(
      rawCalendarId,
      'temporal-polyfill/full',
    ),
  )
}

// Allows an undefined calendar argument, which defaults to ISO.
export function resolveCoreCalendarArg(
  rawCalendarId = isoCalendarId,
): CalendarSlot {
  return resolveCoreCalendar(rawCalendarId)
}
