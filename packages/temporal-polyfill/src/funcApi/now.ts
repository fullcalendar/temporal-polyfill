import { refineCalendarId } from '../internal/calendarId'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import { isoCalendarId } from '../internal/intlCalendarConfig'
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
  const { isoDate, time } = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZone)),
  )
  return createPlainDateTimeSlots(isoDate, time, refineCalendarId(calendar))
}

export function plainDateTimeISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateTimeFns.Record {
  const { isoDate, time } = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZone)),
  )
  return createPlainDateTimeSlots(isoDate, time, isoCalendarId)
}

export function plainDate(
  calendar: string,
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  const { isoDate } = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZone)),
  )
  return createPlainDateSlots(isoDate, refineCalendarId(calendar))
}

export function plainDateISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainDateFns.Record {
  const { isoDate } = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZone)),
  )
  return createPlainDateSlots(isoDate, isoCalendarId)
}

export function plainTimeISO(
  timeZone: string = getCurrentTimeZoneId(),
): PlainTimeFns.Record {
  const { time } = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZone)),
  )
  return createPlainTimeSlots(time)
}
