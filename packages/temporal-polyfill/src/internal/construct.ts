import { bigIntToBigNano } from './bigNano'
import { refineCalendarId } from './calendarId'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { timeFieldNamesAsc } from './fieldNames'
import { isoCalendarId } from './intlCalendarConfig'
import { isoEpochFirstLeapYear } from './isoMath'
import { checkIsoDateFields, checkTimeFields } from './isoMath'
import {
  DurationSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createDurationSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainMonthDaySlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from './timeMath'
import { refineTimeZoneId } from './timeZoneId'
import { mapProps, zipProps } from './utils'

export function constructInstantSlots(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
  )
}

export function constructZonedDateTimeSlots(
  epochNano: bigint,
  timeZoneId: string,
  calendarId = isoCalendarId,
): ZonedDateTimeSlots {
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
    refineTimeZoneId(timeZoneId),
    refineCalendarId(calendarId),
  )
}

export function constructPlainDateTimeSlots(
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
): PlainDateTimeSlots {
  const isoDate = checkIsoDateFields(
    mapProps(toInteger, {
      year: isoYear,
      month: isoMonth,
      day: isoDay,
    }),
  )
  const time = checkTimeFields(
    mapProps(toInteger, {
      hour: hour,
      minute: minute,
      second: second,
      millisecond: millisecond,
      microsecond: microsecond,
      nanosecond: nanosecond,
    }),
  )
  checkIsoDateTimeInBounds(isoDate, time)
  return createPlainDateTimeSlots(isoDate, time, refineCalendarId(calendarId))
}

export function constructPlainDateSlots(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
): PlainDateSlots {
  return createPlainDateSlots(
    checkIsoDateInBounds(
      checkIsoDateFields(
        mapProps(toInteger, {
          year: isoYear,
          month: isoMonth,
          day: isoDay,
        }),
      ),
    ),
    refineCalendarId(calendarId),
  )
}

export function constructPlainYearMonthSlots(
  isoYear: number,
  isoMonth: number,
  calendarId = isoCalendarId,
  referenceIsoDay = 1,
): PlainYearMonthSlots {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const refinedCalendarId = refineCalendarId(calendarId)
  const isoDayInt = toInteger(referenceIsoDay)

  return createPlainYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    refinedCalendarId,
  )
}

export function constructPlainMonthDaySlots(
  isoMonth: number,
  isoDay: number,
  calendarId = isoCalendarId,
  referenceIsoYear: number = isoEpochFirstLeapYear,
): PlainMonthDaySlots {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const refinedCalendarId = refineCalendarId(calendarId)
  const isoYearInt = toInteger(referenceIsoYear)

  return createPlainMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        year: isoYearInt,
        month: isoMonthInt,
        day: isoDayInt,
      }),
    ),
    refinedCalendarId,
  )
}

export function constructPlainTimeSlots(
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
): PlainTimeSlots {
  const timeFields = zipProps(timeFieldNamesAsc, [
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  ])
  return createPlainTimeSlots(checkTimeFields(mapProps(toInteger, timeFields)))
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
): DurationSlots {
  const durationFields = zipProps(durationFieldNamesAsc, [
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
