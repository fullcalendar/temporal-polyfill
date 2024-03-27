import { isoCalendarId } from '../internal/calendarConfig'
import { refineCalendarId } from '../internal/calendarId'
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
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainTimeFns from './plainTime'
import * as ZonedDateTimeFns from './zonedDateTime'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantFns.Record {
  return createInstantSlots(getCurrentEpochNano())
}

export function zonedDateTime(
  calendar: string,
  timeZone: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneId(timeZone),
    refineCalendarId(calendar),
  )
}

export function zonedDateTimeISO(
  timeZone: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneId(timeZone),
    isoCalendarId,
  )
}

export function plainDateTime(
  calendar: string,
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneId(timeZone))),
    refineCalendarId(calendar),
  )
}

export function plainDateTimeISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneId(timeZone))),
    isoCalendarId,
  )
}

export function plainDate(
  calendar: string,
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  return createPlainDateSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneId(timeZone))),
    refineCalendarId(calendar),
  )
}

export function plainDateISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  return createPlainDateSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneId(timeZone))),
    isoCalendarId,
  )
}

export function plainTimeISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainTimeFns.Record {
  return createPlainTimeSlots(
    getCurrentIsoDateTime(queryNativeTimeZone(refineTimeZoneId(timeZone))),
  )
}
