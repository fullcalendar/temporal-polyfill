import { createSlotClass } from '../../apiHelpers/slotClass'
import { getExoticCalendar } from '../../exoticCalendars/exoticCalendarProvider'
import type { CalendarResolver } from '../../internal/calendarResolver'
import {
  CalendarSlot,
  getCalendarSlotId,
  gregoryCalendar,
  isoCalendar,
} from '../../internal/calendarSlot'
import { memoize } from '../../internal/utils'
import { CalendarRecordBranding } from '../recordBranding'

export type CalendarShimRecord = any
export type CalendarShimResolver = (calendarId: string) => CalendarShimRecord

export const [
  CalendarShimRecord,
  createCalendarShimRecord,
  getCalendarShimRecordInternal,
] = createSlotClass(
  CalendarRecordBranding,
  (calendarSlot: CalendarSlot) => calendarSlot, // TODO: use identity
  (calendarSlot: CalendarSlot) => getCalendarSlotId(calendarSlot), // formatFunc
  {}, // getters
  {},
  {},
)

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
