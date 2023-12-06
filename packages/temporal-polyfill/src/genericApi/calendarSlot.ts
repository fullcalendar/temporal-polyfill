import { isoCalendarId } from '../internal/calendarConfig'
import { IdLike, isIdLikeEqual, getId } from '../internal/idLike'

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
