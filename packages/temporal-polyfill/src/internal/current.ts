import { BigNano } from './bigNano'
import { RawDateTimeFormat } from './intlFormatUtils'
import { IsoDateTimeFields, isoDateTimeFieldNamesAsc } from './isoFields'
import { epochMilliToNano } from './timeMath'
import { TimeZoneOffsetOps, zonedEpochNanoToIso } from './timeZoneOps'
import { pluckProps } from './utils'

export function getCurrentIsoDateTime(
  timeZoneOps: TimeZoneOffsetOps,
): IsoDateTimeFields {
  const isoFields = zonedEpochNanoToIso(
    timeZoneOps,
    getCurrentEpochNanoseconds(),
  )
  return pluckProps(isoDateTimeFieldNamesAsc, isoFields)
}

export function getCurrentEpochNanoseconds(): BigNano {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

let currentTimeZoneId: string | undefined

export function getCurrentTimeZoneId(): string {
  return currentTimeZoneId || (currentTimeZoneId = computeCurrentTimeZoneId())
}

function computeCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
