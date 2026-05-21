import { getBrandingAndSlots } from '../apiHelpers/slotClass'
import { requireString } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import { parseTimeZoneId } from '../internal/isoParse'
import { resolveTimeZoneId } from '../internal/timeZoneId'
import type { TimeZoneImpl } from '../internal/timeZoneImpl'
import { isObjectLike } from '../internal/utils'

/*
The class API branches currently type their public Temporal classes as `any`.
Keep the shared default equally permissive so existing callsites that pass
TimeZoneArg through string-only internal helpers keep the same assignability.
*/
export type TimeZoneArg<ZonedDateTimeLike = any> = string | ZonedDateTimeLike

/*
Returns a timeZoneId
*/
export function refineTimeZoneArg(arg: TimeZoneArg): string {
  if (isObjectLike(arg)) {
    const slots = getBrandingAndSlots(arg)?.[1]
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
