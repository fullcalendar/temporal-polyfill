import { parseMaybeOffsetNano } from './isoParse'
import { createLazyGenerator } from './utils'
import { TimeZoneImpl, FixedTimeZoneImpl, IntlTimeZoneImpl } from './timeZoneImpl'
import { utcTimeZoneId } from './timeZoneConfig'

const queryCacheableTimeZoneImpl = createLazyGenerator((timeZoneId: string): TimeZoneImpl => {
  return timeZoneId === utcTimeZoneId
    ? new FixedTimeZoneImpl(0, timeZoneId) // override ID
    : new IntlTimeZoneImpl(timeZoneId)
})

export function queryTimeZoneImpl(timeZoneId: string): TimeZoneImpl {
  // normalize for cache-key. choose uppercase for 'UTC'
  timeZoneId = timeZoneId.toLocaleUpperCase()

  const offsetNano = parseMaybeOffsetNano(timeZoneId, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(offsetNano)
  }

  return queryCacheableTimeZoneImpl(timeZoneId)
}
