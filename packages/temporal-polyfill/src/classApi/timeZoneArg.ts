import { requireString } from '../internal/cast'
import { parseTimeZoneId } from '../internal/isoParse'
import { resolveTimeZoneId } from '../internal/timeZoneId'
import { isObjectLike } from '../internal/utils'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type TimeZoneArg = string | ZonedDateTime

/*
Returns a timeZoneId
*/
export function refineTimeZoneArg(arg: TimeZoneArg): string {
  if (isObjectLike(arg)) {
    const { timeZone } = (getSlots(arg) || {}) as { timeZone?: string }
    if (!timeZone) {
      throw new TypeError('BAD!') // TODO: improve!
    }
    return timeZone
  }
  return refineTimeZoneString(arg)
}

/*
Like refineTimeZoneId, but allows different string formats, like datetime string
*/
function refineTimeZoneString(arg: string): string {
  return resolveTimeZoneId(parseTimeZoneId(requireString(arg)))
}
