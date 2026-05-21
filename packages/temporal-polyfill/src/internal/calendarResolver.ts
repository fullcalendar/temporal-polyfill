import {
  type CalendarSlot,
  gregoryCalendar,
  isoCalendar,
  throwExoticCalendarError,
} from './calendarSlot'
import { requireString } from './cast'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export type CalendarResolver = (rawCalendarId: string) => CalendarSlot

export function resolveCoreCalendar(rawCalendarId: string): CalendarSlot {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  throwExoticCalendarError()
}

// Allows an undefined calendar argument, which defaults to ISO.
export function resolveCoreCalendarArg(
  rawCalendarId = isoCalendarId,
): CalendarSlot {
  return resolveCoreCalendar(rawCalendarId)
}
