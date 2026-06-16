import { CalendarImpl, isoCalendarImpl } from '../../internal/calendarImpl'
import { getCalendarRecordImplCreator } from '../calendarRecord'
import * as RecordType from '../recordTypes'

export function refineShimCalendarArgMaybe(
  calendarRecord: RecordType.CalendarRecord | undefined,
): CalendarImpl {
  // not specified?
  if (calendarRecord === undefined) {
    return isoCalendarImpl
  }
  return getCalendarRecordImpl(calendarRecord)
}

export function createShimCalendarStringResolver(
  getCalendarRecord: (calendarId: string) => RecordType.CalendarRecord,
): (id: string) => CalendarImpl {
  return (calendarId: string) => {
    const calendarRecord = getCalendarRecord(calendarId.toLowerCase())
    return getCalendarRecordImpl(calendarRecord)
  }
}

/*
Throws if calendar doesn't exist
*/
export function getCalendarRecordImpl(
  record: RecordType.CalendarRecord,
): CalendarImpl {
  return getCalendarRecordImplCreator(record)()
}

/*
TODO: make util to extract from bag? like getCalendarFromBag (class-api)
*/
