import { getExoticCalendar } from '../../exoticCalendars/index'
import { gregoryCalendar, isoCalendar } from '../../internal/calendarSlot'
import type { CalendarSlot } from '../../internal/calendarSlot'
import { requireString } from '../../internal/cast'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'

export function resolveAnyCalendar(rawCalendarId: string): CalendarSlot {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  return getExoticCalendar(lowerRawCalendarId)
}

// Allows an undefined calendar argument, which defaults to ISO.
export function resolveAnyCalendarArg(
  rawCalendarId = isoCalendarId,
): CalendarSlot {
  return resolveAnyCalendar(rawCalendarId)
}
