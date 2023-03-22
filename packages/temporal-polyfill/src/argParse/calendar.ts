import { Temporal } from 'temporal-spec'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { Calendar, createDefaultCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { isObjectLike } from './refine'

// TODO: move to argParse like timeZoneFromObj?
export function calendarFromObj(obj: any): Temporal.CalendarProtocol {
  if ('id' in obj) {
    if (obj instanceof TimeZone) {
      throw RangeError('Cannot be TimeZone')
    }
    return obj
  }

  // a date-like object
  if ('calendar' in obj) {
    const objCalendar = obj.calendar

    if (typeof objCalendar === 'symbol') {
      throw new TypeError('Calendar cannot be symbol')
    } else if (isObjectLike(objCalendar)) {
      if ('id' in objCalendar) {
        if (objCalendar instanceof TimeZone) {
          throw RangeError('Cannot be TimeZone')
        }
        return objCalendar as any
      } else {
        throw new TypeError('Must be a calendar')
      }
    } else { // objCalendar converted to string
      return new Calendar(objCalendar)
    }
  }

  throw new TypeError('Must be a calendar') // TODO: improve error
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
