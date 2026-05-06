import { refineCalendarId } from '../internal/calendarId'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import { getInternalCalendar, isoCalendar } from '../internal/externalCalendar'
import {
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryTimeZone } from '../internal/timeZoneImpl'
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
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    isoCalendar,
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateTimeSlots(
    isoDateTime,
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateTimeSlots(isoDateTime, isoCalendar)
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateSlots(
    isoDateTime,
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateSlots(isoDateTime, isoCalendar)
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainTimeFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainTimeSlots(isoDateTime)
}
