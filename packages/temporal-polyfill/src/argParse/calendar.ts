import { Temporal } from 'temporal-spec'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { Calendar, createDefaultCalendar } from '../public/calendar'
import { isObjectLike } from './refine'

// TODO: move to argParse like timeZoneFromObj?
export function calendarFromObj(obj: any): Temporal.CalendarProtocol {
  const innerCalendar = obj.calendar
  if (innerCalendar === undefined) {
    return obj
  }
  if (isObjectLike(innerCalendar) && innerCalendar.calendar === undefined) {
    return innerCalendar as any
  }
  return new Calendar(innerCalendar)
}

export function extractCalendar(input: any): Temporal.CalendarProtocol {
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
