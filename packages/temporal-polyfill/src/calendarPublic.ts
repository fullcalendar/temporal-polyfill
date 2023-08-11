import { Calendar, CalendarArg, CalendarProtocol, checkCalendarProtocol, createCalendar } from './calendar'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { getInternals, TemporalInstance } from './class'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOpsAdapter } from './calendarOpsAdapter'
import { CalendarOps } from './calendarOps'

export function queryCalendarPublic(calendarArg: CalendarArg): CalendarProtocol {
  if (isObjectlike(calendarArg)) {
    if (calendarArg instanceof Calendar) {
      return calendarArg
    }

    const { calendar } = getInternals(
      calendarArg as TemporalInstance<{ calendar: CalendarOps }>
    ) || {}

    return calendar
      ? calendarOpsToPublic(calendar)
      : (
        checkCalendarProtocol(calendarArg as CalendarProtocol),
        calendarArg as CalendarProtocol
      )
  }

  return createCalendar(queryCalendarImpl(parseCalendarId(ensureString(calendarArg))))
}

export function getPublicCalendar(internals: { calendar: CalendarOps }): CalendarProtocol {
  return calendarOpsToPublic(internals.calendar)
}
function calendarOpsToPublic(calendarOps: CalendarOps): CalendarProtocol {
  return getInternals(calendarOps as CalendarOpsAdapter) ||
    createCalendar(calendarOps as CalendarImpl)
}
