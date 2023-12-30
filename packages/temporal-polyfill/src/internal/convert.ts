import { convertPlainMonthDayToDate, convertPlainYearMonthToDate, convertToPlainMonthDay, convertToPlainYearMonth } from './bag'
import { isoCalendarId } from './calendarConfig'
import { DateBag, MonthDayFields, YearFields, YearMonthFieldsIntl } from './calendarFields'
import { IsoDateTimeFields, IsoTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { DateModOps, MonthDayRefineOps, YearMonthRefineOps } from './calendarOps'
import { toBigInt } from './cast'
import { DayTimeNano, bigIntToDayTimeNano, numberToDayTimeNano } from './dayTimeNano'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds } from './epochAndTime'
import { EpochDisambigOptions, refineEpochDisambigOptions } from './optionsRefine'
import { InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createInstantX, createPlainDateTimeX, createPlainDateX, createPlainMonthDayX, createPlainTimeX, createPlainYearMonthX, createZonedDateTimeX } from './slots'
import { SimpleTimeZoneOps, TimeZoneOps, getSingleInstantFor, zonedInternalsToIso } from './timeZoneOps'
import { nanoInMicro, nanoInMilli, nanoInSec } from './units'

// Instant -> *
// -------------------------------------------------------------------------------------------------

export function instantToZonedDateTime<C, T>(
  instantSlots: InstantSlots,
  timeZoneSlot: T,
  calendarSlot: C = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return createZonedDateTimeX(
    instantSlots.epochNanoseconds,
    timeZoneSlot,
    calendarSlot,
  )
}

// ZonedDateTime -> *
// -------------------------------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>
): InstantSlots {
  return createInstantX(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeX(
    zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainDate<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateSlots<C> {
  return createPlainDateX(
    zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return convertToPlainYearMonth(calendarOps, zonedDateTimeFields)
}

export function zonedDateTimeToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return convertToPlainMonthDay(calendarOps, zonedDateTimeFields)
}

export function zonedDateTimeToPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainTimeSlots {
  return createPlainTimeX(
    zonedInternalsToIso(
      zonedDateTimeSlots0 as any, // !!!
      getTimeZoneOps(zonedDateTimeSlots0.timeZone)
    ),
  )
}

// PlainDateTime -> *
// -------------------------------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime<C, TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  timeZoneSlot: TZ,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<C, TZ> {
  return createZonedDateTimeX(
    dateToEpochNano(getTimeZoneOps, timeZoneSlot, plainDateTimeSlots, options),
    timeZoneSlot,
    plainDateTimeSlots.calendar,
  )
}

export function plainDateTimeToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return createPlainYearMonthX({
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
  })
}

export function plainDateTimeToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return convertToPlainMonthDay(calendarOps, plainDateFields)
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

  return createZonedDateTimeX(
    getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...isoTimeFields }),
    timeZoneSlot,
    plainDateSlots.calendar,
  )
}

export function plainDateToPlainDateTime<C>(
  plainDateSlots: PlainDateSlots<C>,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeX(
    checkIsoDateTimeInBounds({
      ...plainDateSlots,
      ...plainTimeFields,
    }),
  )
}

export function plainDateToPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return convertToPlainYearMonth(calendarOps, plainDateFields)
}

export function plainDateToPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return convertToPlainMonthDay(calendarOps, plainDateFields)
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

  return convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag)
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

  return convertPlainMonthDayToDate(calendarOps, plainMonthDayFields, bag)
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

  return createZonedDateTimeX(
    getSingleInstantFor(
      timeZoneOps,
      { ...plainDateSlots, ...slots },
    ),
    timeZoneSlot,
    plainDateSlots.calendar,
  )
}

export function plainTimeToPlainDateTime<C>(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots<C>,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeX(
    checkIsoDateTimeInBounds({
      ...plainTimeSlots0,
      ...plainDateSlots1,
    }),
  )
}

// Epoch-* -> Instant
// -------------------------------------------------------------------------------------------------

export function epochSecToInstant(epochSec: number): InstantSlots {
  return createInstantX(
    checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec))
  )
}

export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return createInstantX(
    checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
  )
}

export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return createInstantX(
    checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro))
  )
}

export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return createInstantX(
    checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  )
}
