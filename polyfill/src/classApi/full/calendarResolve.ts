import { getExoticCalendarById } from '../../exoticCalendars/index'
import {
  gregoryCalendarImpl,
  isoCalendarImpl,
} from '../../internal/calendarImpl'
import type { CalendarImpl } from '../../internal/calendarImpl'
import { requireString } from '../../internal/cast'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'

export function resolveAnyCalendarId(rawCalendarId: string): CalendarImpl {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendarImpl
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendarImpl
  }

  return getExoticCalendarById(lowerRawCalendarId)
}

// Allows an undefined calendar argument, which defaults to ISO.
export function resolveAnyCalendarArg(
  rawCalendarId = isoCalendarId,
): CalendarImpl {
  return resolveAnyCalendarId(rawCalendarId)
}
