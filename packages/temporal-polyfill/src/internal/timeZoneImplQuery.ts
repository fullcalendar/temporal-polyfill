import { parseMaybeOffsetNano } from './isoParse'
import { createLazyGenerator } from './utils'
import { TimeZoneImpl, FixedTimeZoneImpl, IntlTimeZoneImpl } from './timeZoneImpl'
import { utcTimeZoneId } from './timeZoneConfig'

const queryCacheableTimeZoneImpl = createLazyGenerator((timeZoneId: string): TimeZoneImpl => {
  return timeZoneId === utcTimeZoneId
    ? new FixedTimeZoneImpl(0, timeZoneId) // override ID
    : new IntlTimeZoneImpl(timeZoneId)
})

/*
timeZoneId must be normalized
*/
export function queryTimeZoneImpl(timeZoneId: string): TimeZoneImpl {
  const offsetNano = parseMaybeOffsetNano(timeZoneId, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(offsetNano)
  }

  return queryCacheableTimeZoneImpl(timeZoneId)
}
