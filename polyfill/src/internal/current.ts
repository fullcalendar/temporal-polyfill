import { epochMilliToNano, epochNanoToIsoDateTime } from './epochMath'
import { CalendarDateTimeFields } from './fieldTypes'
import { RawDateTimeFormat } from './intlFormatUtils'
import { TimeZone } from './timeZone'
import { utcTimeZoneId } from './timeZoneConfig'

export function getCurrentIsoDateTime(
  timeZone: TimeZone,
): CalendarDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIsoDateTime(epochNano + BigInt(offsetNano))
}

export function getCurrentEpochNano(): bigint {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

// Some hosts report no system time zone through Intl. UTC is what the spec's
// SystemTimeZoneIdentifier returns when a host has no time zone support to speak of.
export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone || utcTimeZoneId
}
