import { requireString } from './cast'
import {
  type InternalCalendar,
  gregoryCalendar,
  isoCalendar,
  throwExternalCalendarError,
} from './externalCalendar'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export type CalendarResolver = (rawCalendarId: string) => InternalCalendar

export function resolveCoreCalendar(rawCalendarId: string): InternalCalendar {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  throwExternalCalendarError()
}

export function resolveCoreCalendarArg(
  rawCalendarId = isoCalendarId,
): InternalCalendar {
  return resolveCoreCalendar(rawCalendarId)
}
