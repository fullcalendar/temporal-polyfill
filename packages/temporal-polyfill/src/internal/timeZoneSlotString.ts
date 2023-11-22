import { ensureString } from './cast'
import { parseTimeZoneId } from './isoParse'

export function refineTimeZoneSlotString(arg: string): string {
  return parseTimeZoneId(ensureString(arg));
}
