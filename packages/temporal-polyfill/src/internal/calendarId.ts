import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { queryFormatForCalendar } from './intlMath'

export function resolveCalendarId(calendarId: string): string {
  calendarId = normalizeCalendarId(calendarId)

  if (calendarId !== isoCalendarId && calendarId !== gregoryCalendarId) {
    if (
      computeCalendarIdBase(calendarId) !==
      computeCalendarIdBase(
        queryFormatForCalendar(calendarId).resolvedOptions().calendar,
      )
    ) {
      throw new RangeError(errorMessages.invalidCalendar(calendarId))
    }
  }

  return calendarId
}

function normalizeCalendarId(calendarId: string): string {
  calendarId = calendarId.toLocaleLowerCase()

  if (calendarId === 'islamicc') {
    calendarId = 'islamic-civil'
  }

  return calendarId
}

export function computeCalendarIdBase(calendarId: string): string {
  return calendarId.split('-')[0]
}
