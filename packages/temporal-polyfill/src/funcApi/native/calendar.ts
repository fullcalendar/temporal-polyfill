import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'
import { memoize } from '../../internal/utils'
import type * as RecordTypes from '../recordTypes'
import { getCalendarSlots, setCalendarSlots } from '../temporalRecords'
import { attachDebugString, defineTemporalClass } from './recordUtils'

export type CalendarNativeResolver = (
  calendarId: string,
) => CalendarNativeRecord

type CalendarRecord = RecordTypes.CalendarRecord

export const getCalendarNativeRecordId: (record: unknown) => string =
  getCalendarSlots

class _CalendarNativeRecord implements CalendarRecord {
  declare readonly [RecordTypes.CalendarRecordBrand]: undefined

  toJSON() {
    return getCalendarNativeRecordId(this)
  }

  valueOf() {
    return getCalendarNativeRecordId(this)
  }
}

function setCalendarNativeRecordId(instance: object, calendarId: string) {
  setCalendarSlots(instance, calendarId)
  attachDebugString(instance, calendarId, (slots) => slots)
}

export function createCalendarNativeRecord(
  calendarId: string,
): CalendarNativeRecord {
  const instance = Object.create(CalendarNativeRecord.prototype)
  setCalendarNativeRecordId(instance, calendarId)
  return instance
}

export type CalendarNativeRecord = _CalendarNativeRecord
export const CalendarNativeRecord = defineTemporalClass(
  _CalendarNativeRecord,
  'Calendar',
)

const isoCalendarRecord = createCalendarNativeRecord(isoCalendarId)
const gregoryCalendarRecord = createCalendarNativeRecord(gregoryCalendarId)
const getExoticCalendarRecord = memoize((calendarId: string) =>
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

export function getISO(): CalendarNativeRecord {
  return isoCalendarRecord
}

export function getGregory(): CalendarNativeRecord {
  return gregoryCalendarRecord
}

export function getExotic(calendarId: string): CalendarNativeRecord {
  return getExoticCalendarRecord(calendarId.toLowerCase())
}
