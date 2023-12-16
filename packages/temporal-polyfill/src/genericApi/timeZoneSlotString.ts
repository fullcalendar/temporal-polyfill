import { parseMaybeOffsetNano, parseTimeZoneId, realizeTimeZoneId } from '../internal/parseIso'
import { ensureString, IdLike, getId } from '../internal/cast'
import { utcTimeZoneId } from '../internal/timeZoneNative'

export function isTimeZoneSlotsEqual(a: IdLike, b: IdLike, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: IdLike, loose?: boolean): string | number {
  const id = getId(slot)

  if (loose && id === utcTimeZoneId) {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}

export function refineTimeZoneSlotString(arg: string): string {
  return realizeTimeZoneId(parseTimeZoneId(ensureString(arg)))
}
