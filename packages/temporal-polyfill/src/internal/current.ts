import { BigNano } from './bigNano'
import { CalendarDateTimeFields } from './fieldTypes'
import { RawDateTimeFormat } from './intlFormatUtils'
import { epochMilliToNano, epochNanoToIso } from './timeMath'
import { TimeZoneImpl } from './timeZoneImpl'

export function getCurrentIsoDateTime(
  timeZoneImpl: TimeZoneImpl,
): CalendarDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = timeZoneImpl.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function getCurrentEpochNano(): BigNano {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
