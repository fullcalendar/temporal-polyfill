import { isoCalendarId } from '../internal/calendarConfig'
import { ensureString } from '../internal/cast'
import { IdLike, isIdLikeEqual, getId } from '../internal/idLike'
import { parseCalendarId, realizeCalendarId } from '../internal/isoParse'

export function getCommonCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (!isIdLikeEqual(a, b)) {
    throw new RangeError('Calendars must be the same')
  }

  return a
}

export function getPreferredCalendarSlot<C extends IdLike>(a: C, b: C): C {
  // fast path. doesn't read IDs
  // similar to isIdLikeEqual
  if (a === b) {
    return a
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId || aId === isoCalendarId) {
    return b
  } else if (bId === isoCalendarId) {
    return a
  }

  throw new RangeError('Incompatible calendars')
}

export function refineCalendarSlotString(calendarArg: string): string {
  return realizeCalendarId(parseCalendarId(ensureString(calendarArg)))
}

// bag
// ---

export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

export function extractCalendarIdFromBag(bag: { calendar?: string }): string | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlotString(calendar)
  }
}
