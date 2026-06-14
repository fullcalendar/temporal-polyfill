import { type CalendarImpl } from './calendarImpl'
import { toBigInt, toIntegerWithTruncation, toStrictInteger } from './cast'
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
  createTimeSlots,
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

type RefineCalendarArg<C> = (calendar: C | undefined) => CalendarImpl

export function constructEpochNanoSlots(epochNano: bigint): EpochNanoFields {
  return createEpochNanoSlots(checkEpochNanoInBounds(toBigInt(epochNano)))
}

export function constructTimeSlots(
  ...fieldValues: [
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    nanosecond: number,
  ]
): TimeFields {
  const timeFields = zipPropsDesc(timeFieldNamesAsc, fieldValues)
  return createTimeSlots(
    checkTimeFields(mapProps(toIntegerWithTruncation, timeFields)),
  )
}

export function constructDurationSlots(
  ...fieldValues: [
    years: number,
    months: number,
    weeks: number,
    days: number,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
    microseconds: number,
    nanoseconds: number,
  ]
): DurationFields & { sign: NumberSign } {
  const durationFields = zipPropsDesc(durationFieldNamesAsc, fieldValues)
  return createDurationSlots(
    checkDurationUnits(mapProps(toStrictInteger, durationFields)),
  )
}

export function constructZonedEpochNanoSlots<C>(
  refineCalendarArg: RefineCalendarArg<C>,
  epochNano: bigint,
  timeZoneId: string,
  calendar?: C,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
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
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  microsecond: number,
  nanosecond: number,
  calendar?: C,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const isoYearInt = toIntegerWithTruncation(isoYear)
  const isoMonthInt = toIntegerWithTruncation(isoMonth)
  const isoDayInt = toIntegerWithTruncation(isoDay)
  const hourInt = toIntegerWithTruncation(hour)
  const minuteInt = toIntegerWithTruncation(minute)
  const secondInt = toIntegerWithTruncation(second)
  const millisecondInt = toIntegerWithTruncation(millisecond)
  const microsecondInt = toIntegerWithTruncation(microsecond)
  const nanosecondInt = toIntegerWithTruncation(nanosecond)
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
): CalendarDateFields & { calendar: CalendarImpl } {
  const isoYearInt = toIntegerWithTruncation(isoYear)
  const isoMonthInt = toIntegerWithTruncation(isoMonth)
  const isoDayInt = toIntegerWithTruncation(isoDay)
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
): CalendarDateFields & { calendar: CalendarImpl } {
  const isoYearInt = toIntegerWithTruncation(isoYear)
  const isoMonthInt = toIntegerWithTruncation(isoMonth)
  const calendarImpl = refineCalendarArg(calendar)
  const isoDayInt = toIntegerWithTruncation(referenceIsoDay)
  return createDateSlots(
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
): CalendarDateFields & { calendar: CalendarImpl } {
  const isoMonthInt = toIntegerWithTruncation(isoMonth)
  const isoDayInt = toIntegerWithTruncation(isoDay)
  const calendarImpl = refineCalendarArg(calendar)
  const isoYearInt = toIntegerWithTruncation(
    referenceIsoYear ?? isoEpochFirstLeapYear,
  )
  return createDateSlots(
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
