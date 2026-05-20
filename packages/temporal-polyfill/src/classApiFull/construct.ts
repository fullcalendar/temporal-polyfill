import {
  constructDateSlotsWithCalendar,
  constructDateTimeSlotsWithCalendar,
  constructDurationSlots,
  constructEpochNanoSlots,
  constructMonthDaySlotsWithCalendar,
  constructTimeSlots,
  constructYearMonthSlotsWithCalendar,
  constructZonedEpochNanoSlotsWithCalendar,
} from '../internal/construct'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { resolveFullCalendar } from './calendarArg'

export { constructDurationSlots, constructEpochNanoSlots, constructTimeSlots }

export function constructZonedEpochNanoSlots(
  epochNano: bigint,
  timeZoneId: string,
  calendarId = isoCalendarId,
) {
  return constructZonedEpochNanoSlotsWithCalendar(
    epochNano,
    timeZoneId,
    resolveFullCalendar(calendarId),
  )
}

export function constructDateTimeSlots(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
  calendarId = isoCalendarId,
) {
  return constructDateTimeSlotsWithCalendar(
    isoYear,
    isoMonth,
    isoDay,
    resolveFullCalendar(calendarId),
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  )
}

export function constructDateSlots(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
) {
  return constructDateSlotsWithCalendar(
    isoYear,
    isoMonth,
    isoDay,
    resolveFullCalendar(calendarId),
  )
}

export function constructYearMonthSlots(
  isoYear: number,
  isoMonth: number,
  calendarId = isoCalendarId,
  referenceIsoDay = 1,
) {
  return constructYearMonthSlotsWithCalendar(
    isoYear,
    isoMonth,
    resolveFullCalendar(calendarId),
    referenceIsoDay,
  )
}

export function constructMonthDaySlots(
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
  referenceIsoYear?: number,
) {
  return constructMonthDaySlotsWithCalendar(
    isoMonth,
    isoDay,
    resolveFullCalendar(calendarId),
    referenceIsoYear,
  )
}
