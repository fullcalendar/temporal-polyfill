import { ensureString } from './cast'

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
