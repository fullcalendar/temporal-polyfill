import { parseMaybeOffsetNano } from '../internal/isoParse'
import { IdLike, getId } from '../internal/idLike'

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
