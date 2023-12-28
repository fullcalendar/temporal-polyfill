import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoDateFieldNamesDesc, isoDateTimeFieldNamesDesc, isoTimeFieldNamesDesc } from "./calendarIsoFields"
import { DayTimeNano } from './dayTimeNano'
import { epochMilliToNano } from './epochAndTime'
import { OrigDateTimeFormat } from './formatIntl'
import { SimpleTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { pluckProps } from './utils'

export function getCurrentIsoDateTime(timeZoneOps: SimpleTimeZoneOps): IsoDateTimeFields {
  const zonedSlots = { epochNanoseconds: getCurrentEpochNanoseconds() }
  return pluckProps(isoDateTimeFieldNamesDesc, zonedInternalsToIso(zonedSlots, timeZoneOps))
}

export function getCurrentIsoDate(timeZoneOps: SimpleTimeZoneOps): IsoDateFields {
  const zonedSlots = { epochNanoseconds: getCurrentEpochNanoseconds() }
  return pluckProps(isoDateFieldNamesDesc, zonedInternalsToIso(zonedSlots, timeZoneOps))
}

export function getCurrentIsoTime(timeZoneOps: SimpleTimeZoneOps): IsoTimeFields {
  const zonedSlots = { epochNanoseconds: getCurrentEpochNanoseconds() }
  return pluckProps(isoTimeFieldNamesDesc, zonedInternalsToIso(zonedSlots, timeZoneOps))
}

export function getCurrentEpochNanoseconds(): DayTimeNano {
  return epochMilliToNano(Date.now())
}

// -------------------------------------------------------------------------------------------------

let currentTimeZoneId: string | undefined

export function getCurrentTimeZoneId(): string {
  return currentTimeZoneId ?? (currentTimeZoneId = computeCurrentTimeZoneId())
}

function computeCurrentTimeZoneId(): string {
  return new OrigDateTimeFormat().resolvedOptions().timeZone
}

