import { CalendarArg, CalendarProtocol, checkCalendarProtocol } from './calendar'
import { queryCalendarImpl } from './calendarImpl'
import { parseCalendarId } from './isoParse'
import { ensureString } from './cast'
import { isObjectlike } from './utils'
import { CalendarOps } from './calendarOps'
import { CalendarOpsAdapter } from './calendarOpsAdapter'
import { getSlots } from './slots'

export function queryCalendarOps(calendarArg: CalendarArg): CalendarOps {
  if (isObjectlike(calendarArg)) {
    const { calendar } = (getSlots(calendarArg) || {}) as { calendar?: CalendarOps }

    if (calendar) {
      return calendar // CalendarOps
    }

    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return new CalendarOpsAdapter(calendarArg as CalendarProtocol)
  }

  return queryCalendarImpl(parseCalendarId(ensureString(calendarArg)))
}
