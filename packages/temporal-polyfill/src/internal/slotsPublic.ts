import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoDateTimeFieldNamesAlpha } from './calendarIsoFields'
import { SimpleTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { pluckProps } from './utils'
import { formatOffsetNano } from './formatIso'
import { ZonedDateTimeSlots } from './slots'
import { CalendarSlot } from '../classApi/calendarSlot'

export type PublicDateSlots = IsoDateFields & { calendar: CalendarSlot }
export type PublicDateTimeSlots = PublicDateSlots & IsoTimeFields
export type PublicZonedDateTimeSlots<C, T> = IsoDateTimeFields & { calendar: C, timeZone: T, offset: string }

export function getPublicZonedDateTimeFields<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>
): PublicZonedDateTimeSlots<C, T> {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots as any, getTimeZoneOps(zonedDateTimeSlots.timeZone))

  return {
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds),
    timeZone: zonedDateTimeSlots.timeZone,
  }
}
