import { ensureObj } from '../dateUtils/abstract'
import { Calendar, createDefaultCalendar } from '../public/calendar'
import { CalendarArg, CalendarProtocol } from '../public/types'

export type CalendarArgSimple = CalendarProtocol | string
export type CalendarArgBag = { calendar: CalendarArgSimple }

export function isCalendarArgBag(arg: any): arg is CalendarArgBag {
  return arg.calendar // boolean-ish
}

export function extractCalendar(input: { calendar?: CalendarArg; }): Calendar {
  if (input.calendar === undefined) {
    return createDefaultCalendar()
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
