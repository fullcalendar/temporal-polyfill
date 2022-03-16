import { Calendar, createDefaultCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'

interface BaseParseResult {
  calendar: string | undefined
}

interface ZonedParseResult extends BaseParseResult {
  timeZone: string | undefined
}

export function refineBaseObj<T extends BaseParseResult>(
  parsed: T,
): T & { calendar: Calendar } {
  return {
    ...parsed,
    calendar: parsed.calendar === undefined
      ? createDefaultCalendar()
      : new Calendar(parsed.calendar),
  }
}

export function refineZonedObj<T extends ZonedParseResult>(
  parsed: T,
): T & { calendar: Calendar, timeZone: TimeZone } {
  return {
    ...refineBaseObj(parsed),
    timeZone: new TimeZone(parsed.timeZone!), // will throw error if empty timeZone
  }
}
