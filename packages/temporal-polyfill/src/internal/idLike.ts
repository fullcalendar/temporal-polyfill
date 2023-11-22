import { isoCalendarId } from './calendarConfig'
import { ensureString } from './cast'
import { parseMaybeOffsetNano } from './isoParse'

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : ensureString(idLike.id)
}

export function isIdLikeEqual(
  calendarSlot0: IdLike,
  calendarSlot1: IdLike,
): boolean {
  return calendarSlot0 === calendarSlot1 || getId(calendarSlot0) === getId(calendarSlot1)
}

// calendar
// --------

export function getCommonCalendarSlot<C extends IdLike>(
  calendarSlot0: C,
  calendarSlot1: C,
): C {
  if (!isIdLikeEqual(calendarSlot0, calendarSlot1)) {
    throw new RangeError('Calendars must be the same')
  }

  return calendarSlot0
}

export function getPreferredCalendarSlot<C extends IdLike>(
  a: C,
  b: C
): C {
  // fast path. doesn't read IDs
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

// timezone
// --------

export function isTimeZoneSlotsEqual(a: IdLike, b: IdLike, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: IdLike, loose?: boolean): string | number {
  const id = getId(slot)

  if (loose && id === 'UTC') {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}
