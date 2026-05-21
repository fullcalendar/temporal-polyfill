import { getExternalCalendar } from '../externalCalendars/intlCalendarProvider'
import { requireString } from '../internal/cast'
import {
  getInternalCalendarId,
  gregoryCalendar,
  isoCalendar,
} from '../internal/externalCalendar'
import type { InternalCalendar } from '../internal/externalCalendar'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'

export function resolveFullCalendar(rawCalendarId: string): InternalCalendar {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  return getExternalCalendar(lowerRawCalendarId)
}

export function resolveFullCalendarId(rawCalendarId: string): string {
  return getInternalCalendarId(resolveFullCalendar(rawCalendarId))
}
