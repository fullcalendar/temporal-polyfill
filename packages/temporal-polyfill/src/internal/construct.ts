import { bigIntToBigNano } from './bigNano'
import { refineCalendarId } from './calendarId'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { isoCalendarId } from './intlCalendarConfig'
import { isoDateTimeFieldNamesAsc, isoTimeFieldNamesAsc } from './isoFields'
import { isoEpochFirstLeapYear } from './isoMath'
import {
  checkIsoDateFields,
  checkIsoDateTimeFields,
  constrainIsoTimeFields,
} from './isoMath'
import { Overflow } from './optionsModel'
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
  isoHour = 0,
  isoMinute = 0,
  isoSecond = 0,
  isoMillisecond = 0,
  isoMicrosecond = 0,
  isoNanosecond = 0,
  calendarId = isoCalendarId,
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
    refineCalendarId(calendarId),
  )
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
          isoYear,
          isoMonth,
          isoDay,
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
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt,
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
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt,
      }),
    ),
    refinedCalendarId,
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
