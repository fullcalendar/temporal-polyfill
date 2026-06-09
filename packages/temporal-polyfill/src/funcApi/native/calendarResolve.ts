import {
  getCalendarRecordId,
  getCalendarRecordImplCreator,
} from '../calendarRecord'
import { CalendarRecord } from '../recordTypes'

export function refineCalendarNativeArgMaybe(
  calendarRecord: CalendarRecord | undefined,
): string | undefined {
  // not specified?
  if (calendarRecord === undefined) {
    // keep undefined, let native process it
    return undefined
  }
  return getValidatedCalendarId(calendarRecord)
}

// Validate a native parse result against the public fns resolver. Native
// parsing canonicalizes the calendar ID before it reaches this point.
export function runCalendarNativeResolver(
  canonicalCalendarId: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): void {
  getValidatedCalendarId(getCalendarRecord(canonicalCalendarId))
}

/*
Throws if calendar wasn't whitelisted
Native callers should use use this instead of getCalendarRecordId directly
*/
export function getValidatedCalendarId(record: CalendarRecord): string {
  getCalendarRecordImplCreator(record) // throws
  return getCalendarRecordId(record)
}

/*
TODO: make util to extract from bag? like getCalendarFromBag (class-api)
*/
