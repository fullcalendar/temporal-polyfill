import { isoCalendarId } from './calendarConfig'
import { isoEpochFirstLeapYear } from './calendarIso'
import { checkIsoDateFields, checkIsoDateTimeFields, constrainIsoTimeFields } from './calendarIso'
import { toBigInt, toInteger, toStrictInteger } from './cast'
import { bigIntToDayTimeNano } from './dayTimeNano'
import { checkDurationFields } from './durationMath'
import { checkEpochNanoInBounds, checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds } from './epochAndTime'
import { Overflow } from './options'
import { DurationBranding, DurationSlots, InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from './slots'
import { IsoDateFields, IsoDateTimeFields } from './calendarIsoFields'

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
    ...checkDurationFields({
      years: toStrictInteger(years),
      months: toStrictInteger(months),
      weeks: toStrictInteger(weeks),
      days: toStrictInteger(days),
      hours: toStrictInteger(hours),
      minutes: toStrictInteger(minutes),
      seconds: toStrictInteger(seconds),
      milliseconds: toStrictInteger(milliseconds),
      microseconds: toStrictInteger(microseconds),
      nanoseconds: toStrictInteger(nanoseconds),
    }),
    branding: DurationBranding,
  }
}

export function createInstantSlots(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
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
    ...refineIsoDateArgs(isoYear, isoMonth, isoDay),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateBranding,
  }
}

export function createPlainDateTimeSlots<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour: number = 0, isoMinute: number = 0, isoSecond: number = 0,
  isoMillisecond: number = 0, isoMicrosecond: number = 0, isoNanosecond: number = 0,
  calendarArg: CA = isoCalendarId as any,
): PlainDateTimeSlots<C> {
  return {
    ...refineIsoDateTimeArgs(
      isoYear, isoMonth, isoDay,
      isoHour, isoMinute, isoSecond,
      isoMillisecond, isoMicrosecond, isoNanosecond,
    ),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateTimeBranding,
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
      {
        isoHour: toInteger(isoHour),
        isoMinute: toInteger(isoMinute),
        isoSecond: toInteger(isoSecond),
        isoMillisecond: toInteger(isoMillisecond),
        isoMicrosecond: toInteger(isoMicrosecond),
        isoNanosecond: toInteger(isoNanosecond),
      },
      Overflow.Reject,
    ),
    branding: PlainTimeBranding,
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

// Utils
// -------------------------------------------------------------------------------------------------

function refineIsoDateArgs(isoYear: number, isoMonth: number, isoDay: number): IsoDateFields {
  return checkIsoDateInBounds(
    checkIsoDateFields({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
    })
  )
}

function refineIsoDateTimeArgs(
  isoYear: number, isoMonth: number, isoDay: number,
  isoHour: number, isoMinute: number, isoSecond: number,
  isoMillisecond: number, isoMicrosecond: number, isoNanosecond: number,
): IsoDateTimeFields {
  return checkIsoDateTimeInBounds(
    checkIsoDateTimeFields({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
      isoHour: toInteger(isoHour),
      isoMinute: toInteger(isoMinute),
      isoSecond: toInteger(isoSecond),
      isoMillisecond: toInteger(isoMillisecond),
      isoMicrosecond: toInteger(isoMicrosecond),
      isoNanosecond: toInteger(isoNanosecond),
    })
  )
}
