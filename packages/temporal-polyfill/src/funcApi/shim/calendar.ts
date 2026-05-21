import { createSlotClass } from '../../apiHelpers/slotClass'
import { getExternalCalendar } from '../../externalCalendars/intlCalendarProvider'
import type { CalendarResolver } from '../../internal/calendarResolver'
import {
  InternalCalendar,
  getInternalCalendarId,
  gregoryCalendar,
  isoCalendar,
  throwExternalCalendarError,
} from '../../internal/externalCalendar'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'
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
  (internalCalendar: InternalCalendar) => internalCalendar, // TODO: use identity
  (internalCalendar: InternalCalendar) =>
    getInternalCalendarId(internalCalendar), // formatFunc
  {}, // getters
  {},
  {},
)

const isoCalendarRecord = createCalendarShimRecord(isoCalendar)
const gregoryCalendarRecord = createCalendarShimRecord(gregoryCalendar)
const getIntlCalendarRecord = memoize((calendarId: string) =>
  createCalendarShimRecord(getExternalCalendar(calendarId)),
)

// Function APIs accept an omitted calendar as ISO. Massage that not-defined
// public input into the internal ISO sentinel before the shared date logic runs.
export function refineCalendarShimArg(
  calendar?: CalendarShimRecord,
): InternalCalendar {
  return calendar === undefined
    ? isoCalendar
    : getCalendarShimRecordInternal(calendar)
}

// String parsing is core-calendar-only unless the public caller supplies the
// add-on resolver hook. This keeps Intl calendar support explicit at the API
// boundary instead of hidden inside shared parsing internals.
export function createCalendarShimStringResolver(
  resolveCalendar?: CalendarShimResolver,
): CalendarResolver {
  return (calendarId: string) => {
    const lowerCalendarId = calendarId.toLowerCase()

    if (lowerCalendarId === isoCalendarId) {
      return isoCalendar
    }
    if (lowerCalendarId === gregoryCalendarId) {
      return gregoryCalendar
    }
    if (!resolveCalendar) {
      throwExternalCalendarError()
    }

    return getCalendarShimRecordInternal(resolveCalendar(lowerCalendarId))
  }
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
