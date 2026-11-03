import * as errorMessages from '../../internal/errorMessages'
import { throwRangeError } from '../../internal/utils'

/*
The function API takes a time zone identifier, while most of the native methods also
accept any Temporal string that mentions a time zone. The shim branch only takes an
identifier, because it keeps the ISO parser out of these exports. This catches the likely
mistake of passing a ZonedDateTime string, without the cost of fully validating. A string
with only a Z or an offset still gets through here, and native still accepts it.
*/
export function requireTimeZoneId<S>(timeZoneId: S): S {
  if (typeof timeZoneId === 'string' && timeZoneId.includes('[')) {
    throwRangeError(errorMessages.invalidTimeZone(timeZoneId))
  }
  return timeZoneId
}
