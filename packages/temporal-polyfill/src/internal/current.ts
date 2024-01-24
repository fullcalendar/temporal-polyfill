import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoDateFieldNamesAsc, isoDateTimeFieldNamesAsc, isoTimeFieldNamesAsc } from "./calendarIsoFields"
import { DayTimeNano } from './dayTimeNano'
import { epochMilliToNano } from './epochAndTime'
import { OrigDateTimeFormat } from './formatIntl'
import { TimeZoneOffsetOps, zonedInternalsToIso } from './timeZoneOps'
import { pluckProps } from './utils'

export function getCurrentIsoDateTime(timeZoneOps: TimeZoneOffsetOps): IsoDateTimeFields {
  const zonedSlots = { epochNanoseconds: getCurrentEpochNanoseconds() }
  return pluckProps(isoDateTimeFieldNamesAsc, zonedInternalsToIso(zonedSlots, timeZoneOps))
}

export function getCurrentEpochNanoseconds(): DayTimeNano {
  return epochMilliToNano(Date.now())
}

// -------------------------------------------------------------------------------------------------

let currentTimeZoneId: string | undefined

export function getCurrentTimeZoneId(): string {
  return currentTimeZoneId || (currentTimeZoneId = computeCurrentTimeZoneId())
}

function computeCurrentTimeZoneId(): string {
  return new OrigDateTimeFormat().resolvedOptions().timeZone
}

