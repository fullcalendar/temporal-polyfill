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
): T & { calendar: Calendar } { // TODO: weird TS anding-behavior
  return {
    ...parsed,
    calendar: parsed.calendar === undefined
      ? createDefaultCalendar()
      : new Calendar(parsed.calendar),
  }
}

export function refineZonedObj<T extends ZonedParseResult>(
  parsed: T,
): T & { calendar: Calendar, timeZone: TimeZone } { // TODO: weird TS anding-behavior
  return {
    ...refineBaseObj(parsed),
    timeZone: new TimeZone(parsed.timeZone!), // will throw error if empty timeZone
  }
}
