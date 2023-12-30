import { getCurrentEpochNanoseconds, getCurrentIsoDateTime, getCurrentTimeZoneId } from '../internal/current'
import { InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeBranding, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createInstantX, createPlainDateTimeX, createPlainDateX, createPlainTimeX, createZonedDateTimeX, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { isoCalendarId } from '../internal/calendarConfig'
import { queryNativeTimeZone } from '../internal/timeZoneNative'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantSlots {
  return createInstantX(
    getCurrentEpochNanoseconds(),
  )
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeX(
    getCurrentEpochNanoseconds(),
    refineTimeZoneSlotString(timeZoneId),
    refineCalendarSlotString(calendarId),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeX(
    getCurrentEpochNanoseconds(),
    refineTimeZoneSlotString(timeZoneId),
    isoCalendarId,
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeX(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    refineCalendarSlotString(calendarId),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeX(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    isoCalendarId,
  )
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateX(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    refineCalendarSlotString(calendarId),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateX(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    isoCalendarId,
  )
}

export function plainTimeISO(timeZoneId: string): PlainTimeSlots {
  return createPlainTimeX(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
  )
}
