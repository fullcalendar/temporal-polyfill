import { isoCalendarId } from '../internal/calendarConfig'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import {
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainTimeFns from './plainTime'
import { refineCalendarIdString, refineTimeZoneIdString } from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantFns.Record {
  return createInstantSlots(getCurrentEpochNano())
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneIdString(timeZoneId),
    refineCalendarIdString(calendarId),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneIdString(timeZoneId),
    isoCalendarId,
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    refineCalendarIdString(calendarId),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    isoCalendarId,
  )
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  return createPlainDateSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    refineCalendarIdString(calendarId),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  return createPlainDateSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    isoCalendarId,
  )
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainTimeFns.Record {
  return createPlainTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
  )
}
