import { requireString } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import { parseTimeZoneId } from '../internal/isoParse'
import { resolveTimeZoneId } from '../internal/timeZoneId'
import type { TimeZoneImpl } from '../internal/timeZoneImpl'
import { isObjectLike } from '../internal/utils'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type TimeZoneArg = string | ZonedDateTime

/*
Returns a timeZoneId
*/
export function refineTimeZoneArg(arg: TimeZoneArg): string {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)
    if (!slots || !('timeZone' in slots)) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidTimeZone(arg as any)) // !!!
    }
    return (slots as { timeZone: TimeZoneImpl }).timeZone.id
  }
  return refineTimeZoneString(arg)
}

/*
Like refineTimeZoneId, but allows different string formats, like datetime string
*/
function refineTimeZoneString(arg: string): string {
  return resolveTimeZoneId(parseTimeZoneId(requireString(arg)))
}
