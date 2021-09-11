import { CalendarArg } from '../args'
import { Calendar } from '../calendar'
import { ensureObj } from '../dateUtils/abstract'
import { isoCalendarID } from '../dateUtils/calendar'

export const isoCalendar = new Calendar(isoCalendarID)

export function extractCalendar(input: { calendar?: CalendarArg; }): Calendar {
  if (input.calendar == null) {
    return isoCalendar
  }
  return ensureObj(Calendar, input.calendar)
}

export function getCommonCalendar(
  obj0: { calendar: Calendar; },
  obj1: { calendar: Calendar; },
): Calendar {
  const { calendar } = obj0
  ensureCalendarsEqual(calendar, obj1.calendar)
  return calendar
}

export function ensureCalendarsEqual(
  calendar0: Calendar,
  calendar1: Calendar,
): void {
  if (calendar0.id !== calendar1.id) {
    throw new Error('Calendars must match')
  }
}
