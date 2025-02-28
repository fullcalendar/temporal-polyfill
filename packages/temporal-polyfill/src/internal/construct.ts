import { bigIntToBigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { isoDateTimeFieldNamesAsc, isoTimeFieldNamesAsc } from './isoFields'
import { isoEpochFirstLeapYear } from './isoMath'
import {
  checkIsoDateFields,
  checkIsoDateTimeFields,
  constrainIsoTimeFields,
} from './isoMath'
import { Overflow } from './options'
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
import { mapProps, zipProps } from './utils'

export function constructInstantSlots(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
  )
}

/*
TODO: no longer accept refineCalendarArg/refineTimeZoneArg funcs!
They're always refineCalendarId/refineTimeZoneId!
*/

export function constructZonedDateTimeSlots<CA, TA>(
  refineCalendarArg: (calendarArg: CA) => string, // to calendarId
  refineTimeZoneArg: (timeZoneArg: TA) => string,
  epochNano: bigint,
  timeZoneArg: TA,
  calendarArg: CA = isoCalendarId as any,
): ZonedDateTimeSlots {
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
    refineTimeZoneArg(timeZoneArg),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainDateTimeSlots<CA>(
  refineCalendarArg: (calendarArg: CA) => string, // to calendarId
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour = 0,
  isoMinute = 0,
  isoSecond = 0,
  isoMillisecond = 0,
  isoMicrosecond = 0,
  isoNanosecond = 0,
  calendarArg: CA = isoCalendarId as any,
): PlainDateTimeSlots {
  const isoFields = zipProps(isoDateTimeFieldNamesAsc, [
    isoYear,
    isoMonth,
    isoDay,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
    isoMicrosecond,
    isoNanosecond,
  ])
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds(
      checkIsoDateTimeFields(mapProps(toInteger, isoFields)),
    ),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainDateSlots<CA>(
  refineCalendarArg: (calendarArg: CA) => string, // to calendarId
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarArg: CA = isoCalendarId as any,
): PlainDateSlots {
  return createPlainDateSlots(
    checkIsoDateInBounds(
      checkIsoDateFields(
        mapProps(toInteger, {
          isoYear,
          isoMonth,
          isoDay,
        }),
      ),
    ),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainYearMonthSlots<CA>(
  refineCalendarArg: (calendarArg: CA) => string, // to calendarId
  isoYear: number,
  isoMonth: number,
  calendarArg: CA = isoCalendarId as any,
  referenceIsoDay = 1,
): PlainYearMonthSlots {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const calendarId = refineCalendarArg(calendarArg)
  const isoDayInt = toInteger(referenceIsoDay)

  return createPlainYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt,
      }),
    ),
    calendarId,
  )
}

export function constructPlainMonthDaySlots<CA>(
  refineCalendarArg: (calendarArg: CA) => string, // to calendarId
  isoMonth: number,
  isoDay: number,
  calendarArg: CA = isoCalendarId as any,
  referenceIsoYear: number = isoEpochFirstLeapYear,
): PlainMonthDaySlots {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendarId = refineCalendarArg(calendarArg)
  const isoYearInt = toInteger(referenceIsoYear)

  return createPlainMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt,
      }),
    ),
    calendarId,
  )
}

export function constructPlainTimeSlots(
  isoHour = 0,
  isoMinute = 0,
  isoSecond = 0,
  isoMillisecond = 0,
  isoMicrosecond = 0,
  isoNanosecond = 0,
): PlainTimeSlots {
  const isoFields = zipProps(isoTimeFieldNamesAsc, [
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
    isoMicrosecond,
    isoNanosecond,
  ])
  return createPlainTimeSlots(
    constrainIsoTimeFields(mapProps(toInteger, isoFields), Overflow.Reject),
  )
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
