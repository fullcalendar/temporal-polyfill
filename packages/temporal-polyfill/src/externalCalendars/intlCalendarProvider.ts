import * as errorMessages from '../internal/errorMessages'
import type { ExternalCalendarProvider } from '../internal/externalCalendar'
import { getIntlCalendar, queryCalendarIntlFormat } from './intlCalendar'
import {
  getIsoDerivedCalendar,
  isIsoDerivedCalendarId,
} from './isoDerivedCalendar'

// These aliases are Temporal-recognized legacy calendar IDs. Keep them in the
// addon so core validation does not need to ask Intl about non-core calendars.
const deprecatedCalendarIdMap = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
} as const

export const intlCalendarProvider: ExternalCalendarProvider = (
  lowerRawCalendarId,
) => {
  // Distinguish deprecated aliases from fallback-only IDs. Temporal accepts
  // true aliases like `islamicc`, but rejects broad Intl fallbacks.
  if (
    lowerRawCalendarId === 'islamic' ||
    lowerRawCalendarId === 'islamic-rgsa'
  ) {
    throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }

  const deprecatedNormCalendarId =
    deprecatedCalendarIdMap[
      lowerRawCalendarId as keyof typeof deprecatedCalendarIdMap
    ]

  if (
    !deprecatedNormCalendarId &&
    !queryCalendarIntlFormat(lowerRawCalendarId, true)
  ) {
    throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }

  const normCalendarId = deprecatedNormCalendarId || lowerRawCalendarId
  return isIsoDerivedCalendarId(normCalendarId)
    ? getIsoDerivedCalendar(normCalendarId)
    : getIntlCalendar(normCalendarId)
}
