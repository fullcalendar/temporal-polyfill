import { epochMilliToNano, epochNanoAndOffsetToIsoDateTime } from './epochMath'
import { CalendarDateTimeFields } from './fieldTypes'
import { RawDateTimeFormat } from './intlFormatUtils'
import { TimeZone } from './timeZone'

export function getCurrentIsoDateTime(
  timeZone: TimeZone,
): CalendarDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
  return epochNanoAndOffsetToIsoDateTime(epochNano, offsetNano)
}

export function getCurrentEpochNano(): bigint {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
