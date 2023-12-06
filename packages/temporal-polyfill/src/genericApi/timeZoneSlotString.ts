import { ensureString } from '../internal/cast'
import { parseTimeZoneId } from '../internal/isoParse'

export function refineTimeZoneSlotString(arg: string): string {
  return parseTimeZoneId(ensureString(arg));
}
