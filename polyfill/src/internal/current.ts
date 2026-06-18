import { epochMilliToNano, epochNanoToIsoDateTime } from './epochMath'
import { CalendarDateTimeFields } from './fieldTypes'
import { RawDateTimeFormat } from './intlFormatUtils'
import { TimeZone } from './timeZone'

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

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
