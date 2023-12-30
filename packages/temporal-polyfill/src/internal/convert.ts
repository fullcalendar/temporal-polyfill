import { convertPlainMonthDayToDate, convertPlainYearMonthToDate, convertToPlainMonthDay, convertToPlainYearMonth } from './bag'
import { isoCalendarId } from './calendarConfig'
import { DateBag, MonthDayFields, YearFields, YearMonthFieldsIntl } from './calendarFields'
import { IsoDateTimeFields, IsoTimeFields, isoDateFieldNamesAsc, isoDateTimeFieldNamesAsc, isoTimeFieldDefaults, isoTimeFieldNamesAsc } from './calendarIsoFields'
import { DateModOps, MonthDayRefineOps, YearMonthRefineOps } from './calendarOps'
import { toBigInt } from './cast'
import { DayTimeNano, bigIntToDayTimeNano, numberToDayTimeNano } from './dayTimeNano'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds } from './epochAndTime'
import { EpochDisambigOptions, refineEpochDisambigOptions } from './optionsRefine'
import { InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from './slots'
import { SimpleTimeZoneOps, TimeZoneOps, getSingleInstantFor, zonedInternalsToIso } from './timeZoneOps'
import { nanoInMicro, nanoInMilli, nanoInSec } from './units'
import { pluckProps } from './utils'

// Instant -> *
// -------------------------------------------------------------------------------------------------

export function instantToZonedDateTime<C, T>(
  instantSlots: InstantSlots,
  timeZoneSlot: T,
  calendarSlot: C = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: instantSlots.epochNanoseconds,
    timeZone: timeZoneSlot,
    calendar: calendarSlot,
  }
}

// ZonedDateTime -> *
// -------------------------------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>
): InstantSlots {
  return {
    epochNanoseconds: zonedDateTimeSlots0.epochNanoseconds,
    branding: InstantBranding,
  }
}

export function zonedDateTimeToPlainDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateTimeSlots<C> {
  return {
    ...pluckProps(
      isoDateTimeFieldNamesAsc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    calendar: zonedDateTimeSlots0.calendar,
    branding: PlainDateTimeBranding,
  }
}

export function zonedDateTimeToPlainDate<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateSlots<C> {
  return {
    ...pluckProps(
      isoDateFieldNamesAsc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    calendar: zonedDateTimeSlots0.calendar,
    branding: PlainDateBranding,
  }
}

export function zonedDateTimeToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarOps, zonedDateTimeFields),
    branding: PlainYearMonthBranding,
  }
}

export function zonedDateTimeToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarOps, zonedDateTimeFields),
    branding: PlainMonthDayBranding,
  }
}

export function zonedDateTimeToPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainTimeSlots {
  return {
    ...pluckProps(
      isoTimeFieldNamesAsc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    branding: PlainTimeBranding,
  }
}

// PlainDateTime -> *
// -------------------------------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime<C, TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  timeZoneSlot: TZ,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<C, TZ> {
  return {
    calendar: plainDateTimeSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: dateToEpochNano(getTimeZoneOps, timeZoneSlot, plainDateTimeSlots, options),
    branding: ZonedDateTimeBranding,
  }
}

export function plainDateTimeToPlainDate<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
): PlainDateSlots<C> {
  return {
    ...pluckProps([...isoDateFieldNamesAsc, 'calendar'], plainDateTimeSlots),
    branding: PlainDateBranding,
  }
}

export function plainDateTimeToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
    branding: PlainYearMonthBranding,
  }
}

export function plainDateTimeToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainMonthDay(calendarOps, plainDateFields),
    branding: PlainMonthDayBranding,
  }
}

export function plainDateTimeToPlainTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
): PlainTimeSlots {
  return {
    ...pluckProps(isoTimeFieldNamesAsc, plainDateTimeSlots),
    branding: PlainTimeBranding,
  }
}

function dateToEpochNano<TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  timeZoneSlot: TZ,
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): DayTimeNano {
  const epochDisambig = refineEpochDisambigOptions(options)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneOps, isoFields, epochDisambig),
  )
}

// PlainDate -> *
// -------------------------------------------------------------------------------------------------

export function plainDateToZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  plainDateSlots: PlainDateSlots<C>,
  options: { timeZone: TA, plainTime?: PA },
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = refineTimeZoneArg(options.timeZone)
  const plainTimeArg = options.plainTime
  const isoTimeFields = plainTimeArg !== undefined
    ? refinePlainTimeArg(plainTimeArg)
    : isoTimeFieldDefaults

  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return {
    calendar: plainDateSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...isoTimeFields }),
    branding: ZonedDateTimeBranding,
  }
}

export function plainDateToPlainDateTime<C>(
  plainDateSlots: PlainDateSlots<C>,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return {
    ...checkIsoDateTimeInBounds({
      ...plainDateSlots,
      ...plainTimeFields,
    }),
    branding: PlainDateTimeBranding,
  }
}

export function plainDateToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
    branding: PlainYearMonthBranding,
  }
}

export function plainDateToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarOps, plainDateFields),
    branding: PlainMonthDayBranding,
  }
}

// PlainYearMonth -> *
// -------------------------------------------------------------------------------------------------

export function plainYearMonthToPlainDate<C>(
  getCalendarOps: (calendar: C) => DateModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag),
    branding: PlainDateBranding,
  }
}

// PlainMonthDay -> *
// -------------------------------------------------------------------------------------------------

export function plainMonthDayToPlainDate<C>(
  getCalendarOps: (calendar: C) => DateModOps<C>,
  plainMonthDaySlots: PlainMonthDaySlots<C>,
  plainMonthDayFields: MonthDayFields,
  bag: YearFields,
): PlainDateSlots<C> {
  const calendarSlot = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertPlainMonthDayToDate(calendarOps, plainMonthDayFields, bag),
    branding: PlainDateBranding,
  }
}

// PlainTime -> *
// -------------------------------------------------------------------------------------------------

export function plainTimeToZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: PlainTimeSlots,
  options: { timeZone: TA, plainDate: PA },
): ZonedDateTimeSlots<C, T> {
  const plainDateSlots = refinePlainDateArg(options.plainDate)
  const timeZoneSlot = refineTimeZoneArg(options.timeZone)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return {
    epochNanoseconds: getSingleInstantFor(
      timeZoneOps,
      { ...plainDateSlots, ...slots },
    ),
    calendar: plainDateSlots.calendar,
    timeZone: timeZoneSlot,
    branding: ZonedDateTimeBranding,
  }
}

export function plainTimeToPlainDateTime<C>(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots<C>,
): PlainDateTimeSlots<C> {
  return {
    ...checkIsoDateTimeInBounds({
      ...plainTimeSlots0,
      ...plainDateSlots1,
    }),
    branding: PlainDateTimeBranding,
  }
}

// Epoch-* -> Instant
// -------------------------------------------------------------------------------------------------

export function epochSecToInstant(epochSec: number): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec))
  }
}

export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
  }
}

export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro))
  }
}

export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  }
}
