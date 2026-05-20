import { toBigInt, toInteger } from '../../internal/cast'
import { type InternalCalendar } from '../../internal/externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import {
  checkIsoDateFields,
  isoEpochFirstLeapYear,
} from '../../internal/isoCalendarMath'
import {
  ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createMonthDaySlots,
  createYearMonthSlots,
  createZonedEpochNanoSlots,
} from '../../internal/slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from '../../internal/temporalLimits'
import { checkTimeFields } from '../../internal/timeFieldMath'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import { CalendarShimRecord, refineCalendarShimArg } from './calendar'

export function constructZonedEpochNanoSlots(
  epochNano: bigint,
  timeZoneId: string,
  calendar?: CalendarShimRecord,
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  const epochNanoBigInt = toBigInt(epochNano)
  const refinedTimeZoneId = refineTimeZoneId(timeZoneId)
  return createZonedEpochNanoSlots(
    checkEpochNanoInBounds(epochNanoBigInt),
    queryTimeZone(refinedTimeZoneId),
    refineCalendarShimArg(calendar),
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
  calendar?: CalendarShimRecord,
): CalendarDateTimeFields & { calendar: InternalCalendar } {
  const isoDate = checkIsoDateFields({
    year: toInteger(isoYear),
    month: toInteger(isoMonth),
    day: toInteger(isoDay),
  })
  const time = checkTimeFields({
    hour: toInteger(hour),
    minute: toInteger(minute),
    second: toInteger(second),
    millisecond: toInteger(millisecond),
    microsecond: toInteger(microsecond),
    nanosecond: toInteger(nanosecond),
  })
  const isoDateTime = combineDateAndTime(isoDate, time)
  checkIsoDateTimeInBounds(isoDateTime)
  return createDateTimeSlots(isoDateTime, refineCalendarShimArg(calendar))
}

export function constructDateSlots(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
): CalendarDateFields & { calendar: InternalCalendar } {
  return createDateSlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: toInteger(isoYear),
        month: toInteger(isoMonth),
        day: toInteger(isoDay),
      }),
    ),
    refineCalendarShimArg(calendar),
  )
}

export function constructYearMonthSlots(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarShimRecord,
  referenceIsoDay = 1,
): CalendarDateFields & { calendar: InternalCalendar } {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const internalCalendar = refineCalendarShimArg(calendar)
  const isoDayInt = toInteger(referenceIsoDay)
  return createYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    internalCalendar,
  )
}

export function constructMonthDaySlots(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
  referenceIsoYear: number = isoEpochFirstLeapYear,
): CalendarDateFields & { calendar: InternalCalendar } {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const internalCalendar = refineCalendarShimArg(calendar)
  const isoYearInt = toInteger(referenceIsoYear)
  return createMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    internalCalendar,
  )
}
