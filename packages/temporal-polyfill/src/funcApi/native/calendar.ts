import { createSlotClass } from '../../apiHelpers/slotClass'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'
import { memoize } from '../../internal/utils'
import { CalendarRecordBranding } from '../recordBranding'

export type CalendarNativeRecord = any
export type CalendarNativeResolver = (
  calendarId: string,
) => CalendarNativeRecord

export const [
  CalendarNativeRecord,
  createCalendarNativeRecord,
  getCalendarNativeRecordId,
] = createSlotClass(
  CalendarRecordBranding,
  (calendarId: string) => calendarId, // TODO: use identity
  (calendarId: string) => calendarId, // formatFunc. TODO: use identity
  {}, // getters
  {},
  {},
)

const isoCalendarRecord = createCalendarNativeRecord(isoCalendarId)
const gregoryCalendarRecord = createCalendarNativeRecord(gregoryCalendarId)
const getIntlCalendarRecord = memoize((calendarId: string) =>
  createCalendarNativeRecord(calendarId),
)

// Native Temporal owns string parsing in this branch, but the fns API still
// owns the calendar add-on boundary. After native parsing succeeds, hand the
// parsed calendar id off to the public resolver and validate that what comes
// back is one of this API's calendar records, not an arbitrary value.
export function runCalendarNativeResolver(
  calendarId: string,
  getCalendar: CalendarNativeResolver,
): void {
  getCalendarNativeRecordId(getCalendar(calendarId.toLowerCase()))
}

export function getIsoCalendar(): CalendarNativeRecord {
  return isoCalendarRecord
}

export function getGregoryCalendar(): CalendarNativeRecord {
  return gregoryCalendarRecord
}

export function getIntlCalendar(calendarId: string): CalendarNativeRecord {
  return getIntlCalendarRecord(calendarId.toLowerCase())
}
