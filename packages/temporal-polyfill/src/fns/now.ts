import { InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { getCurrentEpochNanoseconds, getCurrentIsoDate, getCurrentIsoDateTime, getCurrentIsoTime, getCurrentTimeZoneId } from '../genericApi/now'
import { InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import { isoCalendarId } from '../internal/calendarConfig'
import { queryNativeTimeZone } from '../internal/timeZoneNative'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantSlots {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    branding: InstantBranding,
  }
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    timeZone: timeZoneId,
    calendar: calendarId,
    branding: ZonedDateTimeBranding,
  }
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    timeZone: timeZoneId,
    calendar: isoCalendarId,
    branding: ZonedDateTimeBranding,
  }
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return {
    ...getCurrentIsoDateTime(queryNativeTimeZone(timeZoneId)),
    calendar: calendarId,
    branding: PlainDateTimeBranding,
  }
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return {
    ...getCurrentIsoDateTime(queryNativeTimeZone(timeZoneId)),
    calendar: isoCalendarId,
    branding: PlainDateTimeBranding,
  }
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return {
    ...getCurrentIsoDate(queryNativeTimeZone(timeZoneId)),
    calendar: calendarId,
    branding: PlainDateBranding,
  }
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return {
    ...getCurrentIsoDate(queryNativeTimeZone(timeZoneId)),
    calendar: isoCalendarId,
    branding: PlainDateBranding,
  }
}

export function plainTimeISO(timeZoneId: string): PlainTimeSlots {
  return {
    ...getCurrentIsoTime(queryNativeTimeZone(timeZoneId)),
    branding: PlainTimeBranding,
  }
}
