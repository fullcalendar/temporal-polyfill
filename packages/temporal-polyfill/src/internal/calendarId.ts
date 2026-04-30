import { requireString } from './cast'
import * as errorMessages from './errorMessages'
import { queryCalendarIntlFormat } from './intlCalendar'
import { gregoryCalendarId, isoCalendarId } from './intlCalendarConfig'

// Temporal accepts a small set of deprecated calendar aliases and
// canonicalizes them up front. `ethiopic-amete-alem` is included because
// current test262 expects it to canonicalize to `ethioaa`, although that
// legacy alias may be removed in the future; see
// https://github.com/tc39/ecma402/issues/285.
const deprecatedCalendarIdMap = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
} as const

export function refineCalendarId(id: string): string {
  return resolveCalendarId(requireString(id))
}

export function resolveCalendarId(id: string): string {
  id = id.toLowerCase() // normalize

  // Distinguish deprecated aliases from fallback-only IDs. Temporal accepts and
  // canonicalizes true aliases like `islamicc`, but `islamic` and
  // `islamic-rgsa` are Intl fallback inputs that Temporal should reject.
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
