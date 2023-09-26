import { Calendar, CalendarArg, CalendarProtocol, checkCalendarProtocol, createCalendar } from './calendar'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOpsAdapter } from './calendarOpsAdapter'
import { CalendarOps } from './calendarOps'
import { CalendarBranding, getSlots } from './slots'

export function queryCalendarPublic(calendarArg: CalendarArg): CalendarProtocol {
  if (isObjectlike(calendarArg)) {
    if (calendarArg instanceof Calendar) {
      return calendarArg
    }

    const { calendar } = (getSlots(calendarArg) || {}) as { calendar?: CalendarOps }

    return calendar
      ? calendarOpsToPublic(calendar)
      : (
        checkCalendarProtocol(calendarArg as CalendarProtocol),
        calendarArg as CalendarProtocol
      )
  }

  return createCalendar({
    branding: CalendarBranding,
    impl: queryCalendarImpl(parseCalendarId(ensureString(calendarArg)))
  })
}

export function getPublicCalendar(internals: { calendar: CalendarOps }): CalendarProtocol {
  return calendarOpsToPublic(internals.calendar)
}

function calendarOpsToPublic(calendarOps: CalendarOps): CalendarProtocol {
  return (calendarOps instanceof CalendarOpsAdapter)
    ? calendarOps.c
    : createCalendar({
        branding: CalendarBranding,
        impl: calendarOps as CalendarImpl,
      })
}
