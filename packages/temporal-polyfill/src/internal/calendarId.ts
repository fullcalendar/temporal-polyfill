import { requireString } from './cast'
import {
  resolveExternalCalendarId,
  throwExternalCalendarError,
} from './externalCalendar'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export function refineCalendarId(rawCalendarId: string): string {
  return resolveCalendarId(requireString(rawCalendarId))
}

export function resolveCalendarId(rawCalendarId: string): string {
  const lowerRawCalendarId = rawCalendarId.toLowerCase()

  if (
    lowerRawCalendarId === isoCalendarId ||
    lowerRawCalendarId === gregoryCalendarId
  ) {
    return lowerRawCalendarId
  }

  const normCalendarId = resolveExternalCalendarId(lowerRawCalendarId)
  if (normCalendarId !== undefined) {
    return normCalendarId
  }

  throwExternalCalendarError()
}

// Probably not worth putting into externalCalendars
export function computeCalendarIdBase(normCalendarId: string): string {
  if (normCalendarId === 'islamicc') {
    normCalendarId = 'islamic'
  }
  return normCalendarId.split('-')[0]
}
