import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'
import { memoize } from '../../internal/utils'
import { CalendarRecord, CalendarRecordBrand } from '../recordTypes'
import { getCalendarSlots, setCalendarSlots } from '../temporalRecords'
import { attachDebugString, defineTemporalClass } from './recordUtils'

// Slot Getter / Setter
// --------------------

export const getCalendarNativeId: (record: unknown) => string = getCalendarSlots

function setCalendarNativeId(instance: object, rawCalendarId: string) {
  setCalendarSlots(instance, rawCalendarId)
  attachDebugString(instance, rawCalendarId, (slots) => slots)
}

// Record
// ------

class _CalendarNativeRecord implements CalendarRecord {
  declare readonly [CalendarRecordBrand]: undefined

  toJSON() {
    return getCalendarNativeId(this)
  }

  valueOf() {
    return getCalendarNativeId(this)
  }
}

export type CalendarNativeRecord = _CalendarNativeRecord
export const CalendarNativeRecord = defineTemporalClass(
  _CalendarNativeRecord,
  'Calendar',
)

export function createCalendarNativeRecord(
  rawCalendarId: string,
): CalendarNativeRecord {
  const instance = Object.create(CalendarNativeRecord.prototype)
  setCalendarNativeId(instance, rawCalendarId)
  return instance
}

// Factory
// -------

// basic singletons
const isoCalendarRecord = createCalendarNativeRecord(isoCalendarId)
const gregoryCalendarRecord = createCalendarNativeRecord(gregoryCalendarId)

export function getISO(): CalendarNativeRecord {
  return isoCalendarRecord
}

export function getGregory(): CalendarNativeRecord {
  return gregoryCalendarRecord
}

// exotic cache
export const getExotic = memoize((rawCalendarId: string) =>
  createCalendarNativeRecord(rawCalendarId.toLowerCase()),
)

// Resolver
// --------

export type CalendarNativeResolver = (
  calendarId: string,
) => CalendarNativeRecord

// Validate a native parse result against the public fns resolver. Native
// parsing canonicalizes the calendar ID before it reaches this point.
export function runCalendarNativeResolver(
  canonicalCalendarId: string,
  resolveCalendar: CalendarNativeResolver,
): void {
  getCalendarNativeId(resolveCalendar(canonicalCalendarId))
}
