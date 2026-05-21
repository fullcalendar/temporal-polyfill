import { type CalendarSlot, gregoryCalendar, isoCalendar } from './calendarSlot'
import { requireString } from './cast'
import * as errorMessages from './errorMessages'
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
