import { ensureString } from './cast'
import { parseMaybeOffsetNano } from './isoParse'
import { createLazyGenerator } from './utils'
import { TimeZoneImpl, FixedTimeZoneImpl, IntlTimeZoneImpl } from './timeZoneImpl'

const queryCacheableTimeZoneImpl = createLazyGenerator((timeZoneId: string): TimeZoneImpl => {
  return timeZoneId === 'UTC'
    ? new FixedTimeZoneImpl(0, timeZoneId) // override ID
    : new IntlTimeZoneImpl(timeZoneId)
})

export function queryTimeZoneImpl(timeZoneId: string): TimeZoneImpl {
  // TODO: fix double-call of ensureString
  timeZoneId = ensureString(timeZoneId)
    .toLowerCase() // whaaa... lower-then-upper?

  const offsetNano = parseMaybeOffsetNano(timeZoneId, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(offsetNano)
  }

  return queryCacheableTimeZoneImpl(
    timeZoneId.toUpperCase() // normalize IANA string using uppercase so 'UTC'
  )
}
