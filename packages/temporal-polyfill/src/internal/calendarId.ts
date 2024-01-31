import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { queryCalendarIntlFormat } from './intlMath'

export function resolveCalendarId(id: string): string {
  id = normalizeCalendarId(id)

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

function normalizeCalendarId(id: string): string {
  id = id.toLowerCase()

  if (id === 'islamicc') {
    id = 'islamic-civil'
  }

  return id
}

export function computeCalendarIdBase(id: string): string {
  return id.split('-')[0]
}
