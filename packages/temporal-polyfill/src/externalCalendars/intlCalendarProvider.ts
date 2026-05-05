import * as errorMessages from '../internal/errorMessages'
import type { ExternalCalendarProvider } from '../internal/externalCalendar'
import { getCalendarIntlFormat, getIntlCalendar } from './intlCalendar'
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

export const intlCalendarProvider: ExternalCalendarProvider = {
  resolveCalendarId(id) {
    // Distinguish deprecated aliases from fallback-only IDs. Temporal accepts
    // true aliases like `islamicc`, but rejects broad Intl fallbacks.
    if (id === 'islamic' || id === 'islamic-rgsa') {
      throw new RangeError(errorMessages.invalidCalendar(id))
    }

    const deprecatedId =
      deprecatedCalendarIdMap[id as keyof typeof deprecatedCalendarIdMap]
    if (deprecatedId) {
      return deprecatedId
    }

    if (getCalendarIntlFormat(id).resolvedOptions().calendar !== id) {
      throw new RangeError(errorMessages.invalidCalendar(id))
    }

    return id
  },

  getCalendar(id) {
    return isIsoDerivedCalendarId(id)
      ? getIsoDerivedCalendar(id)
      : getIntlCalendar(id)
  },
}
