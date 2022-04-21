import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { Calendar, createDefaultCalendar } from '../public/calendar'
import { Temporal } from '../spec'

// Temporal.CalendarLike broken in two
export type CalendarArgSimple = Temporal.CalendarProtocol | string
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

export function extractCalendar(input: { calendar?: Temporal.CalendarLike }): Calendar {
  if (input.calendar === undefined) {
    return createDefaultCalendar()
  }
  return ensureObj(Calendar, input.calendar)
}

export function getCommonCalendar(
  obj0: { calendar: Temporal.CalendarProtocol },
  obj1: { calendar: Temporal.CalendarProtocol },
): Temporal.CalendarProtocol {
  const { calendar } = obj0
  ensureCalendarsEqual(calendar, obj1.calendar)
  return calendar
}

export function getStrangerCalendar(
  obj0: { calendar: Temporal.CalendarProtocol },
  obj1: { calendar: Temporal.CalendarProtocol },
): Temporal.CalendarProtocol {
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
  calendar0: Temporal.CalendarProtocol,
  calendar1: Temporal.CalendarProtocol,
): void {
  if (calendar0.toString() !== calendar1.toString()) {
    throw new RangeError('Calendars must match')
  }
}
