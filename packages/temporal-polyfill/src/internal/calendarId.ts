import { requireString } from './cast'
import {
  resolveExternalCalendarId,
  throwExternalCalendarError,
} from './externalCalendar'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

export function refineCalendarId(id: string): string {
  return resolveCalendarId(requireString(id))
}

export function resolveCalendarId(id: string): string {
  id = id.toLowerCase() // normalize

  if (id === isoCalendarId || id === gregoryCalendarId) {
    return id
  }

  const externalId = resolveExternalCalendarId(id)
  if (externalId !== undefined) {
    return externalId
  }

  throwExternalCalendarError()
}

export function computeCalendarIdBase(id: string): string {
  if (id === 'islamicc') {
    id = 'islamic'
  }
  return id.split('-')[0]
}
