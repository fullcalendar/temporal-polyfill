import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'
import { memoize } from '../../internal/utils'
import {
  getCalendarRecordIfPresent,
  setCalendarRecord,
} from '../temporalRecords'
import {
  attachDebugString,
  forbiddenValueOf,
  invalidRecordType,
} from './recordUtils'

export type CalendarNativeResolver = (
  calendarId: string,
) => CalendarNativeRecord

export class CalendarNativeRecord {
  constructor(calendarId: string) {
    setCalendarNativeRecordId(this, calendarId)
  }

  toJSON() {
    return getCalendarNativeRecordId(this)
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setCalendarNativeRecordId(instance: object, calendarId: string) {
  setCalendarRecord(instance, calendarId)
  attachDebugString(instance, calendarId, (slots) => slots)
}

export function createCalendarNativeRecord(
  calendarId: string,
): CalendarNativeRecord {
  const instance = Object.create(CalendarNativeRecord.prototype)
  setCalendarNativeRecordId(instance, calendarId)
  return instance
}

export function getCalendarNativeRecordId(record: unknown): string {
  return getCalendarRecordIfPresent(record) || invalidRecordType()
}

// TEMP disabled for size inspection: defineTemporalClass(CalendarNativeRecord, ...)

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
