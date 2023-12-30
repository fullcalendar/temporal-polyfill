import { isoCalendarId } from './calendarConfig'
import { isoEpochFirstLeapYear } from './calendarIso'
import { checkIsoDateFields, checkIsoDateTimeFields, constrainIsoTimeFields } from './calendarIso'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { bigIntToDayTimeNano } from './dayTimeNano'
import { checkDurationFields } from './durationMath'
import { checkEpochNanoInBounds, checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds } from './epochAndTime'
import { Overflow } from './options'
import { DurationBranding, DurationSlots, InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from './slots'
import { isoDateFieldNamesAsc, isoDateTimeFieldNamesAsc, isoTimeFieldNamesAsc } from './calendarIsoFields'
import { durationFieldNamesAsc } from './durationFields'

export function createInstantSlots(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}

export function createZonedDateTimeSlots<CA, C, TA, T>(
  refineCalendarArg: (calendarArg: CA) => C,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  epochNano: bigint,
  timeZoneArg: TA,
  calendarArg: CA = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return {
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    timeZone: refineTimeZoneArg(timeZoneArg),
    calendar: refineCalendarArg(calendarArg),
    branding: ZonedDateTimeBranding,
  }
}

export function createPlainDateTimeSlots<CA, C>(
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
  return {
    ...checkIsoDateTimeInBounds(
      checkIsoDateTimeFields(
        zipProps(isoDateTimeFieldNamesAsc, [
          isoYear, isoMonth, isoDay,
          isoHour, isoMinute, isoSecond,
          isoMillisecond, isoMicrosecond, isoNanosecond,
        ])
      )
    ),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateTimeBranding,
  }
}

export function createPlainDateSlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarArg: CA = isoCalendarId as any,
): PlainDateSlots<C> {
  return {
    ...checkIsoDateInBounds(
      checkIsoDateFields(
        zipProps(isoDateFieldNamesAsc, [isoYear, isoMonth, isoDay])
      )
    ),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateBranding,
  }
}

export function createPlainYearMonthSlots<CA, C>(
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

  return {
    ...checkIsoYearMonthInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function createPlainMonthDaySlots<CA, C>(
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

  return {
    ...checkIsoDateInBounds(
      checkIsoDateFields({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}

export function createPlainTimeSlots(
  isoHour: number = 0,
  isoMinute: number = 0,
  isoSecond: number = 0,
  isoMillisecond: number = 0,
  isoMicrosecond: number = 0,
  isoNanosecond: number = 0,
): PlainTimeSlots {
  return {
    ...constrainIsoTimeFields(
      zipProps(isoTimeFieldNamesAsc, [
        isoHour, isoMinute, isoSecond,
        isoMillisecond, isoMicrosecond, isoNanosecond,
      ]),
      Overflow.Reject,
    ),
    branding: PlainTimeBranding,
  }
}

export function createDurationSlots(
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
  return {
    ...checkDurationFields(
      zipProps(durationFieldNamesAsc, [
        years, months, weeks, days,
        hours, minutes, seconds,
        milliseconds, microseconds, nanoseconds,
      ], toStrictInteger)
    ),
    branding: DurationBranding,
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

// TODO: more reusable?
// TODO: better types
function zipProps(
  propNames: any[],
  propValues: any[],
  propValueTransform: any = toInteger,
) {
  const res = {} as any
  const len = propNames.length

  for (let i = 0; i < len; i++) {
    res[propNames[len - 1 - i]] = propValueTransform(propValues[i])
  }

  return res
}
