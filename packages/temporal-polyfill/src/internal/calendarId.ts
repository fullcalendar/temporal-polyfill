import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import { requireString } from './cast'
import * as errorMessages from './errorMessages'
import { queryCalendarIntlFormat } from './intlMath'

const deprecatedCalendarIdMap = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
} as const

export function refineCalendarId(id: string): string {
  return resolveCalendarId(requireString(id))
}

export function resolveCalendarId(id: string): string {
  id = id.toLowerCase() // normalize

  if (id === 'islamic' || id === 'islamic-rgsa') {
    throw new RangeError(errorMessages.invalidCalendar(id))
  }

  const deprecatedId =
    deprecatedCalendarIdMap[id as keyof typeof deprecatedCalendarIdMap]
  if (deprecatedId) {
    return deprecatedId
  }

  if (id !== isoCalendarId && id !== gregoryCalendarId) {
    if (queryCalendarIntlFormat(id).resolvedOptions().calendar !== id) {
      throw new RangeError(errorMessages.invalidCalendar(id))
    }
  }

  return id
}

export function computeCalendarIdBase(id: string): string {
  if (id === 'islamicc') {
    id = 'islamic'
  }
  return id.split('-')[0]
}
