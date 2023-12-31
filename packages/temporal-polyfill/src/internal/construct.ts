import { isoCalendarId } from './calendarConfig'
import { isoEpochFirstLeapYear } from './calendarIso'
import { checkIsoDateFields, checkIsoDateTimeFields, constrainIsoTimeFields } from './calendarIso'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { bigIntToDayTimeNano } from './dayTimeNano'
import { checkDurationFields } from './durationMath'
import { checkEpochNanoInBounds, checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds } from './epochAndTime'
import { Overflow } from './options'
import { DurationSlots, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, createDurationSlots, createInstantSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainMonthDaySlots, createPlainTimeSlots, createPlainYearMonthSlots, createZonedDateTimeSlots } from './slots'
import { isoDateFieldNamesAsc, isoDateTimeFieldNamesAsc, isoTimeFieldNamesAsc } from './calendarIsoFields'
import { durationFieldNamesAsc } from './durationFields'

export function constructInstantSlots(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  )
}

export function constructZonedDateTimeSlots<CA, C, TA, T>(
  refineCalendarArg: (calendarArg: CA) => C,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  epochNano: bigint,
  timeZoneArg: TA,
  calendarArg: CA = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    refineTimeZoneArg(timeZoneArg),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainDateTimeSlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour: number = 0,
  isoMinute: number = 0,
  isoSecond: number = 0,
  isoMillisecond: number = 0,
  isoMicrosecond: number = 0,
  isoNanosecond: number = 0,
  calendarArg: CA = isoCalendarId as any,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds(
      checkIsoDateTimeFields(
        zipProps(isoDateTimeFieldNamesAsc, [
          isoYear, isoMonth, isoDay,
          isoHour, isoMinute, isoSecond,
          isoMillisecond, isoMicrosecond, isoNanosecond,
        ])
      )
    ),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainDateSlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarArg: CA = isoCalendarId as any,
): PlainDateSlots<C> {
  return createPlainDateSlots(
    checkIsoDateInBounds(
      checkIsoDateFields(
        zipProps(isoDateFieldNamesAsc, [isoYear, isoMonth, isoDay])
      )
    ),
    refineCalendarArg(calendarArg),
  )
}

export function constructPlainYearMonthSlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  calendar: CA = isoCalendarId as any,
  referenceIsoDay: number = 1,
): PlainYearMonthSlots<C> {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const calendarSlot = refineCalendarArg(calendar)
  const isoDayInt = toInteger(referenceIsoDay)

  return createPlainYearMonthSlots(
    checkIsoYearMonthInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendarSlot,
  )
}

export function constructPlainMonthDaySlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoMonth: number,
  isoDay: number,
  calendar: CA = isoCalendarId as any,
  referenceIsoYear: number = isoEpochFirstLeapYear
): PlainMonthDaySlots<C> {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendarSlot = refineCalendarArg(calendar)
  const isoYearInt = toInteger(referenceIsoYear)

  return createPlainMonthDaySlots(
    checkIsoDateInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendarSlot,
  )
}

export function constructPlainTimeSlots(
  isoHour: number = 0,
  isoMinute: number = 0,
  isoSecond: number = 0,
  isoMillisecond: number = 0,
  isoMicrosecond: number = 0,
  isoNanosecond: number = 0,
): PlainTimeSlots {
  return createPlainTimeSlots(
    constrainIsoTimeFields(
      zipProps(isoTimeFieldNamesAsc, [
        isoHour, isoMinute, isoSecond,
        isoMillisecond, isoMicrosecond, isoNanosecond,
      ]),
      Overflow.Reject,
    )
  )
}

export function constructDurationSlots(
  years: number = 0,
  months: number = 0,
  weeks: number = 0,
  days: number = 0,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0,
  milliseconds: number = 0,
  microseconds: number = 0,
  nanoseconds: number = 0,
): DurationSlots {
  return createDurationSlots(
    checkDurationFields(
      zipProps(durationFieldNamesAsc, [
        years, months, weeks, days,
        hours, minutes, seconds,
        milliseconds, microseconds, nanoseconds,
      ], toStrictInteger)
    ),
  )
}

// Utils
// -------------------------------------------------------------------------------------------------

// TODO: more reusable?
// TODO: better types
function zipProps(
  propNames: any[],
  propValues: any[],
  propValueTransform: ((val: any, entityName?: string) => any) = toInteger,
) {
  const res = {} as any
  const len = propNames.length

  for (let i = 0; i < len; i++) {
    const propName = propNames[len - 1 - i]
    res[propName] = propValueTransform(propValues[i], propName)
  }

  return res
}
