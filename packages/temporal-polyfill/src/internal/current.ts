import { BigNano } from './bigNano'
import { RawDateTimeFormat } from './intlFormatUtils'
import { IsoDateTimeFields } from './isoFields'
import { epochMilliToNano, epochNanoToIso } from './timeMath'
import { NativeTimeZone } from './timeZoneNative'

export function getCurrentIsoDateTime(
  nativeTimeZone: NativeTimeZone,
): IsoDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = nativeTimeZone.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function getCurrentEpochNano(): BigNano {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
