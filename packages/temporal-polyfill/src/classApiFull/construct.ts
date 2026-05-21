import { toBigInt, toInteger } from '../internal/cast'
import { type InternalCalendar } from '../internal/externalCalendar'
import {
  type CalendarDateFields,
  type CalendarDateTimeFields,
} from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import {
  checkIsoDateFields,
  isoEpochFirstLeapYear,
} from '../internal/isoCalendarMath'
import {
  type ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createMonthDaySlots,
  createYearMonthSlots,
  createZonedEpochNanoSlots,
} from '../internal/slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from '../internal/temporalLimits'
import { checkTimeFields } from '../internal/timeFieldMath'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { resolveFullCalendar } from './calendarResolve'

export function constructZonedEpochNanoSlots(
  epochNano: bigint,
  timeZoneId: string,
  calendarId = isoCalendarId,
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  const epochNanoBigInt = toBigInt(epochNano)
  const refinedTimeZoneId = refineTimeZoneId(timeZoneId)
  return createZonedEpochNanoSlots(
    checkEpochNanoInBounds(epochNanoBigInt),
    queryTimeZone(refinedTimeZoneId),
    refineConstructorCalendar(calendarId),
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
): CalendarDateTimeFields & { calendar: InternalCalendar } {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const hourInt = toInteger(hour)
  const minuteInt = toInteger(minute)
  const secondInt = toInteger(second)
  const millisecondInt = toInteger(millisecond)
  const microsecondInt = toInteger(microsecond)
  const nanosecondInt = toInteger(nanosecond)
  const isoDate = checkIsoDateFields({
    year: isoYearInt,
    month: isoMonthInt,
    day: isoDayInt,
  })
  const time = checkTimeFields({
    hour: hourInt,
    minute: minuteInt,
    second: secondInt,
    millisecond: millisecondInt,
    microsecond: microsecondInt,
    nanosecond: nanosecondInt,
  })
  const isoDateTime = combineDateAndTime(isoDate, time)
  checkIsoDateTimeInBounds(isoDateTime)

  return createDateTimeSlots(isoDateTime, refineConstructorCalendar(calendarId))
}

export function constructDateSlots(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
): CalendarDateFields & { calendar: InternalCalendar } {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  return createDateSlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    refineConstructorCalendar(calendarId),
  )
}

export function constructYearMonthSlots(
  isoYear: number,
  isoMonth: number,
  calendarId = isoCalendarId,
  referenceIsoDay = 1,
): CalendarDateFields & { calendar: InternalCalendar } {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const calendar = refineConstructorCalendar(calendarId)
  const isoDayInt = toInteger(referenceIsoDay)
  return createYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    calendar,
  )
}

export function constructMonthDaySlots(
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
  referenceIsoYear?: number,
): CalendarDateFields & { calendar: InternalCalendar } {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendar = refineConstructorCalendar(calendarId)
  const isoYearInt = toInteger(referenceIsoYear ?? isoEpochFirstLeapYear)
  return createMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    calendar,
  )
}

function refineConstructorCalendar(calendarId: string): InternalCalendar {
  return resolveFullCalendar(calendarId)
}
