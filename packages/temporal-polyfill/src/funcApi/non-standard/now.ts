import { refineCalendarId } from '../../internal/calendarId'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../../internal/current'
import { getInternalCalendar } from '../../internal/externalCalendar'
import {
  createDateSlots,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from '../../internal/slots'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainTimeFns from './plainTime'
import * as ZonedDateTimeFns from './zonedDateTime'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantFns.Record {
  return createEpochNanoSlots(getCurrentEpochNano())
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  return createZonedEpochNanoSlots(
    getCurrentEpochNano(),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeFns.Record {
  // Omitting calendar constructs ISO-calendar slots.
  return createZonedEpochNanoSlots(
    getCurrentEpochNano(),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createDateTimeSlots(
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
  // Omitting calendar constructs ISO-calendar slots.
  return createDateTimeSlots(isoDateTime)
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createDateSlots(
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
  // Omitting calendar constructs ISO-calendar slots.
  return createDateSlots(isoDateTime)
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainTimeFns.Record {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createTimeSlots(isoDateTime)
}
