import { type CalendarSlot } from './calendarSlot'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { checkIsoDateFields, isoEpochFirstLeapYear } from './isoCalendarMath'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createDurationSlots,
  createEpochNanoSlots,
  createMonthDaySlots,
  createTimeSlots,
  createYearMonthSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from './temporalLimits'
import { checkTimeFields } from './timeFieldMath'
import { queryTimeZone } from './timeZone'
import { refineTimeZoneId } from './timeZoneId'
import { NumberSign, mapProps, zipPropsDesc } from './utils'

type RefineCalendarArg<C> = (calendar: C | undefined) => CalendarSlot

export function constructEpochNanoSlots(epochNano: bigint): EpochNanoFields {
  return createEpochNanoSlots(checkEpochNanoInBounds(toBigInt(epochNano)))
}

export function constructTimeSlots(
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
): TimeFields {
  const timeFields = zipPropsDesc(timeFieldNamesAsc, [
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  ])
  return createTimeSlots(checkTimeFields(mapProps(toInteger, timeFields)))
}

export function constructDurationSlots(
  years = 0,
  months = 0,
  weeks = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
  microseconds = 0,
  nanoseconds = 0,
): DurationFields & { sign: NumberSign } {
  const durationFields = zipPropsDesc(durationFieldNamesAsc, [
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  ])
  return createDurationSlots(
    checkDurationUnits(mapProps(toStrictInteger, durationFields)),
  )
}

export function constructZonedEpochNanoSlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  epochNano: bigint,
  timeZoneId: string,
  calendar?: C,
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
  const epochNanoBigInt = toBigInt(epochNano)
  const refinedTimeZoneId = refineTimeZoneId(timeZoneId)
  return createZonedEpochNanoSlots(
    checkEpochNanoInBounds(epochNanoBigInt),
    queryTimeZone(refinedTimeZoneId),
    refineCalendarArg(calendar),
  )
}

export function constructDateTimeSlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
  calendar?: C,
): CalendarDateTimeFields & { calendar: CalendarSlot } {
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

  return createDateTimeSlots(isoDateTime, refineCalendarArg(calendar))
}

export function constructDateSlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: C,
): CalendarDateFields & { calendar: CalendarSlot } {
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
    refineCalendarArg(calendar),
  )
}

export function constructYearMonthSlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  isoYear: number,
  isoMonth: number,
  calendar?: C,
  referenceIsoDay = 1,
): CalendarDateFields & { calendar: CalendarSlot } {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const calendarImpl = refineCalendarArg(calendar)
  const isoDayInt = toInteger(referenceIsoDay)
  return createYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    calendarImpl,
  )
}

export function constructMonthDaySlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  isoMonth: number,
  isoDay: number,
  calendar?: C,
  referenceIsoYear?: number,
): CalendarDateFields & { calendar: CalendarSlot } {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendarImpl = refineCalendarArg(calendar)
  const isoYearInt = toInteger(referenceIsoYear ?? isoEpochFirstLeapYear)
  return createMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    calendarImpl,
  )
}
