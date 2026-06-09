import { CalendarImpl, isoCalendarImpl } from '../../internal/calendarImpl'
import { CalendarRecord, getCalendarRecordImplCreator } from '../calendarRecord'

export function refineCalendarShimArgMaybe(
  calendarRecord: CalendarRecord | undefined,
): CalendarImpl {
  // not specified?
  if (calendarRecord === undefined) {
    return isoCalendarImpl
  }
  return getCalendarRecordImpl(calendarRecord)
}

export function createCalendarShimStringResolver(
  getCalendarRecord: (calendarId: string) => CalendarRecord,
): (id: string) => CalendarImpl {
  return (calendarId: string) => {
    const calendarRecord = getCalendarRecord(calendarId.toLowerCase())
    return getCalendarRecordImpl(calendarRecord)
  }
}

/*
Throws if calendar doesn't exist
*/
export function getCalendarRecordImpl(record: CalendarRecord): CalendarImpl {
  return getCalendarRecordImplCreator(record)()
}

/*
TODO: make util to extract from bag? like getCalendarFromBag (class-api)
*/
