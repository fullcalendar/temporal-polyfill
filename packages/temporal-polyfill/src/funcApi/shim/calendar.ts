import { createSlotClass } from '../../classApi/slotClass'
import { refineCalendarId } from '../../internal/calendarId'
import {
  InternalCalendar,
  getInternalCalendar,
  getInternalCalendarId,
  isoCalendar,
} from '../../internal/externalCalendar'
import { CalendarRecordBranding } from '../common-branding'

export type CalendarShimRecord = any
export type CalendarShimArg = CalendarShimRecord | string

export const [
  CalendarShimRecord,
  createCalendarShimRecord,
  getCalendarShimRecordInternal,
] = createSlotClass(
  CalendarRecordBranding,
  (internalCalendar: InternalCalendar) => internalCalendar, // TODO: use identity
  (internalCalendar: InternalCalendar) =>
    getInternalCalendarId(internalCalendar), // formatFunc
  {}, // getters
  {},
  {},
)

// NOTE: temporary
export function refineCalendarShimArg(
  calendar?: CalendarShimArg,
): InternalCalendar {
  return calendar === undefined
    ? isoCalendar
    : typeof calendar === 'string'
      ? getInternalCalendar(refineCalendarId(calendar))
      : getCalendarShimRecordInternal(calendar)
}

// NOTE: temporary
export function refineCalendarShimArgToId(
  calendar?: CalendarShimArg,
): string | undefined {
  return calendar === undefined
    ? undefined
    : typeof calendar === 'string'
      ? refineCalendarId(calendar)
      : getInternalCalendarId(getCalendarShimRecordInternal(calendar))
}
