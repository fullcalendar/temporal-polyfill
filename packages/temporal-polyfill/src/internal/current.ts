import { BigNano } from './bigNano'
import { RawDateTimeFormat } from './intlFormatUtils'
import { IsoDateTimeFields } from './isoFields'
import { epochMilliToNano, epochNanoToIso } from './timeMath'
import { TimeZoneOffsetOps } from './timeZoneOps'

export function getCurrentIsoDateTime(
  timeZoneOps: TimeZoneOffsetOps,
): IsoDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function getCurrentEpochNano(): BigNano {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
