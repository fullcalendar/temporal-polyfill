import {
  type CalendarImpl,
  gregoryCalendarImpl,
  isoCalendarImpl,
} from '../../internal/calendarImpl'
import { requireString } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../../internal/intlCalendarConfig'

export function resolveBasicCalendarId(rawCalendarId: string): CalendarImpl {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendarImpl
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendarImpl
  }

  throw new RangeError(
    errorMessages.exoticCalendarRequired(
      rawCalendarId,
      'temporal-polyfill/full',
    ),
  )
}

// Allows an undefined calendar argument, which defaults to ISO.
export function resolveBasicCalendarArg(
  rawCalendarId = isoCalendarId,
): CalendarImpl {
  return resolveBasicCalendarId(rawCalendarId)
}
