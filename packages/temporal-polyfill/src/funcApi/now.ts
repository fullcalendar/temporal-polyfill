import { getCurrentEpochNanoseconds, getCurrentIsoDateTime, getCurrentTimeZoneId } from '../internal/current'
import { InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots, createInstantSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainTimeSlots, createZonedDateTimeSlots, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { isoCalendarId } from '../internal/calendarConfig'
import { queryNativeTimeZone } from '../internal/timeZoneNative'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantSlots {
  return createInstantSlots(
    getCurrentEpochNanoseconds(),
  )
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeSlots(
    getCurrentEpochNanoseconds(),
    refineTimeZoneSlotString(timeZoneId),
    refineCalendarSlotString(calendarId),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeSlots(
    getCurrentEpochNanoseconds(),
    refineTimeZoneSlotString(timeZoneId),
    isoCalendarId,
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    refineCalendarSlotString(calendarId),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    isoCalendarId,
  )
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    refineCalendarSlotString(calendarId),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
    isoCalendarId,
  )
}

export function plainTimeISO(timeZoneId: string): PlainTimeSlots {
  return createPlainTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneSlotString(timeZoneId))),
  )
}
