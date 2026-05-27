import { getExoticCalendar } from '../../exoticCalendars/exoticCalendarProvider'
import {
  CalendarSlot,
  getCalendarSlotId,
  gregoryCalendar,
  isoCalendar,
} from '../../internal/calendarSlot'
import type { CalendarResolver } from '../../internal/isoParse'
import { memoize } from '../../internal/utils'
import {
  getCalendarRecordIfPresent,
  isCalendarRecord,
  setCalendarRecord,
} from '../temporalRecords'
import {
  attachDebugString,
  forbiddenValueOf,
  invalidRecordType,
} from './recordUtils'

export type CalendarShimResolver = (calendarId: string) => CalendarShimRecord

export class CalendarShimRecord {
  constructor(calendarSlot: CalendarSlot) {
    setCalendarShimRecordInternal(this, calendarSlot)
  }

  toJSON() {
    return getCalendarSlotId(getCalendarShimRecordInternal(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setCalendarShimRecordInternal(
  instance: object,
  calendarSlot: CalendarSlot,
) {
  setCalendarRecord(instance, calendarSlot)
  attachDebugString(instance, calendarSlot, getCalendarSlotId)
}

export function createCalendarShimRecord(
  calendarSlot: CalendarSlot,
): CalendarShimRecord {
  const instance = Object.create(CalendarShimRecord.prototype)
  setCalendarShimRecordInternal(instance, calendarSlot)
  return instance
}

export function getCalendarShimRecordInternal(record: unknown): CalendarSlot {
  if (!isCalendarRecord(record)) {
    return invalidRecordType()
  }
  return getCalendarRecordIfPresent(record)
}

// TEMP disabled for size inspection: defineTemporalClass(CalendarShimRecord, ...)

const isoCalendarRecord = createCalendarShimRecord(isoCalendar)
const gregoryCalendarRecord = createCalendarShimRecord(gregoryCalendar)
const getIntlCalendarRecord = memoize((calendarId: string) =>
  createCalendarShimRecord(getExoticCalendar(calendarId)),
)

// Function APIs accept an omitted calendar as ISO. Massage that not-defined
// public input into the internal ISO sentinel before the shared date logic runs.
export function refineCalendarShimArg(
  calendar?: CalendarShimRecord,
): CalendarSlot {
  return calendar === undefined
    ? isoCalendar
    : getCalendarShimRecordInternal(calendar)
}

// Adapt a public shim resolver (id -> CalendarShimRecord) into the internal
// CalendarResolver signature (id -> CalendarSlot) that the parser expects.
// The public resolver — typically getCoreCalendar or getAnyCalendar — owns the
// iso/gregory/Intl policy, so all this wrapper does is brand-unwrap.
export function createCalendarShimStringResolver(
  getCalendar: CalendarShimResolver,
): CalendarResolver {
  return (calendarId: string) =>
    getCalendarShimRecordInternal(getCalendar(calendarId.toLowerCase()))
}

export function getIsoCalendar(): CalendarShimRecord {
  return isoCalendarRecord
}

export function getGregoryCalendar(): CalendarShimRecord {
  return gregoryCalendarRecord
}

export function getIntlCalendar(calendarId: string): CalendarShimRecord {
  return getIntlCalendarRecord(calendarId.toLowerCase())
}
