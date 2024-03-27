import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import { requireString } from './cast'
import * as errorMessages from './errorMessages'
import { queryCalendarIntlFormat } from './intlMath'

export function refineCalendarId(id: string): string {
  return resolveCalendarId(requireString(id))
}

export function resolveCalendarId(id: string): string {
  id = id.toLowerCase() // normalize

  if (id !== isoCalendarId && id !== gregoryCalendarId) {
    if (
      computeCalendarIdBase(id) !==
      computeCalendarIdBase(
        queryCalendarIntlFormat(id).resolvedOptions().calendar,
      )
    ) {
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
