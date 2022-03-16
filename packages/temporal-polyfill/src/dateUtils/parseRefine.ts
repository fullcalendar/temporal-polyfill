import { Calendar, createDefaultCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { DateTimeISOFields } from '../public/types'
import { DateTimeParseResult, ZonedDateTimeParseResult } from './parse'
import { ZonedDateTimeISOEssentials } from './zonedDateTime'

// TODO: anything with calendar!!!
export function refineDateTimeParse(parsed: DateTimeParseResult): DateTimeISOFields {
  return {
    ...parsed,
    calendar: parsed.calendar === undefined
      ? createDefaultCalendar()
      : new Calendar(parsed.calendar),
  }
}

// TODO: anything with timeZone!!!
export function refineZonedDateTimeParse(
  parsed: ZonedDateTimeParseResult,
): ZonedDateTimeISOEssentials {
  return {
    ...refineDateTimeParse(parsed),
    timeZone: new TimeZone(parsed.timeZone!), // will throw error if empty timeZone
  }
}
