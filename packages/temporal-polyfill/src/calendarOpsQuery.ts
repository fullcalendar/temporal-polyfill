import { CalendarArg, CalendarProtocol, checkCalendarProtocol } from './calendar'
import { queryCalendarImpl } from './calendarImpl'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOps } from './calendarOps'
import { CalendarOpsAdapter } from './calendarOpsAdapter'

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (isObjectlike(calendarArg)) {
    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return new CalendarOpsAdapter(calendarArg as CalendarProtocol)
  }

  return queryCalendarImpl(parseCalendarId(ensureString(calendarArg)))
}
