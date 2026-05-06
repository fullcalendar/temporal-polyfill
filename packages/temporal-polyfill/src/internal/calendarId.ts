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
