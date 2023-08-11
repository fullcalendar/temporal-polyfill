import { CalendarArg, CalendarProtocol, checkCalendarProtocol } from './calendar'
import { queryCalendarImpl } from './calendarImpl'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOps } from './calendarOps'
import { CalendarOpsAdapter } from './calendarOpsAdapter'
import { TemporalInstance, getInternals } from './class'

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (isObjectlike(calendarArg)) {
    const { calendar } = getInternals(
      calendarArg as TemporalInstance<{ calendar: CalendarOps }>
    ) || {}

    if (calendar) {
      return calendar // CalendarOps
    }

    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return new CalendarOpsAdapter(calendarArg as CalendarProtocol)
  }

  return queryCalendarImpl(parseCalendarId(ensureString(calendarArg)))
}
