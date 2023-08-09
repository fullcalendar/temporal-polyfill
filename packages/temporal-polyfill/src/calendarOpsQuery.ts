import { Calendar, CalendarArg, CalendarProtocol, checkCalendarProtocol } from './calendar'
import { queryCalendarImpl } from './calendarImpl'
import { getInternals, TemporalInstance } from './class'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOps } from './calendarOps'
import { CalendarOpsAdapter } from './calendarOpsAdapter'

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (isObjectlike(calendarArg)) {
    if (calendarArg instanceof Calendar) {
      return getInternals(calendarArg as Calendar)
    }

    const { calendar } = getInternals(calendarArg as TemporalInstance<{ calendar: CalendarOps }>) || {}

    return calendar || (
      checkCalendarProtocol(calendarArg as CalendarProtocol),
      new CalendarOpsAdapter(calendarArg as CalendarProtocol)
    )
  }

  return queryCalendarImpl(parseCalendarId(ensureString(calendarArg)))
}
