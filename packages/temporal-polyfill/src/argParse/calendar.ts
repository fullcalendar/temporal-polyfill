import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { Calendar, createDefaultCalendar } from '../public/calendar'
import { CalendarArg, CalendarProtocol } from '../public/types'

export type CalendarArgSimple = CalendarProtocol | string
export type CalendarArgBag = { calendar: CalendarArgSimple }

export function isCalendarArgBag(arg: any): arg is CalendarArgBag {
  return arg.calendar // boolean-ish
}

// bag ITEM
// weird
export function parseCalendarArgFromBag(arg: CalendarArgSimple): Calendar {
  if (typeof arg === 'object' && arg) { // TODO: isObjectLike
    if (typeof arg.id === 'string') {
      return arg as Calendar // custom implementation
    } else {
      throw new RangeError('Invalid calendar')
    }
  }
  return new Calendar(String(arg))
}

export function extractCalendar(input: { calendar?: CalendarArg; }): Calendar {
  if (input.calendar === undefined) {
    return createDefaultCalendar()
  }
  return ensureObj(Calendar, input.calendar)
}

export function getCommonCalendar(
  obj0: { calendar: Calendar },
  obj1: { calendar: Calendar },
): Calendar {
  const { calendar } = obj0
  ensureCalendarsEqual(calendar, obj1.calendar)
  return calendar
}

export function getStrangerCalendar(
  obj0: { calendar: Calendar },
  obj1: { calendar: Calendar },
): Calendar {
  const calendar0 = obj0.calendar
  const calendar1 = obj1.calendar

  if (calendar0.id === isoCalendarID) {
    return calendar1
  }
  if (calendar1.id === isoCalendarID) {
    return calendar0
  }
  if (calendar0.id !== calendar1.id) {
    throw new RangeError('Non-ISO calendars incompatible')
  }

  return calendar0
}

export function ensureCalendarsEqual(
  calendar0: Calendar,
  calendar1: Calendar,
): void {
  if (calendar0.id !== calendar1.id) {
    throw new RangeError('Calendars must match')
  }
}
