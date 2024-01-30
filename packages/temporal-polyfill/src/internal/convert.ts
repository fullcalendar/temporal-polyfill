import {
  convertPlainMonthDayToDate,
  convertPlainYearMonthToDate,
  convertToPlainMonthDay,
  convertToPlainYearMonth,
} from './bagRefine'
import { isoCalendarId } from './calendarConfig'
import {
  DateModOps,
  MonthDayRefineOps,
  YearMonthRefineOps,
} from './calendarOps'
import { requireObjectLike, toBigInt } from './cast'
import {
  DayTimeNano,
  bigIntToDayTimeNano,
  numberToDayTimeNano,
} from './dayTimeNano'
import { DateBag, MonthDayFields, YearFields, YearMonthFields } from './fields'
import {
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import {
  EpochDisambigOptions,
  refineEpochDisambigOptions,
} from './optionsRefine'
import {
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
  createZonedDateTimeSlots,
} from './slots'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds } from './timeMath'
import {
  TimeZoneOffsetOps,
  TimeZoneOps,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
import { nanoInMicro, nanoInMilli, nanoInSec } from './units'

// Instant -> *
// -----------------------------------------------------------------------------

export function instantToZonedDateTime<C, T>(
  instantSlots: InstantSlots,
  timeZoneSlot: T,
  calendarSlot: C = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return createZonedDateTimeSlots(
    instantSlots.epochNanoseconds,
    timeZoneSlot,
    calendarSlot,
  )
}

// ZonedDateTime -> *
// -----------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>,
): InstantSlots {
  return createInstantSlots(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
  )
}

export function zonedDateTimeToPlainDate<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateSlots<C> {
  return createPlainDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
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
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainTimeSlots {
  return createPlainTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
  )
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime<C, TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  timeZoneSlot: TZ,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<C, TZ> {
  return createZonedDateTimeSlots(
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

  return createPlainYearMonthSlots({
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
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  plainDateSlots: PlainDateSlots<C>,
  options: { timeZone: TA; plainTime?: PA },
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = refineTimeZoneArg(options.timeZone)
  const plainTimeArg = options.plainTime
  const isoTimeFields =
    plainTimeArg !== undefined
      ? refinePlainTimeArg(plainTimeArg)
      : isoTimeFieldDefaults

  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...isoTimeFields }),
    timeZoneSlot,
    plainDateSlots.calendar,
  )
}

export function plainDateToPlainDateTime<C>(
  plainDateSlots: PlainDateSlots<C>,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeSlots(
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
// -----------------------------------------------------------------------------

export function plainYearMonthToPlainDate<C>(
  getCalendarOps: (calendar: C) => DateModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  plainYearMonthFields: YearMonthFields,
  bag: { day: number },
): PlainDateSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag)
}

// PlainMonthDay -> *
// -----------------------------------------------------------------------------

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
// -----------------------------------------------------------------------------

export function plainTimeToZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: PlainTimeSlots,
  options: { timeZone: TA; plainDate: PA },
): ZonedDateTimeSlots<C, T> {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneSlot = refineTimeZoneArg(refinedOptions.timeZone)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...slots }),
    timeZoneSlot,
    plainDateSlots.calendar,
  )
}

export function plainTimeToPlainDateTime<C>(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots<C>,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...plainTimeSlots0,
      ...plainDateSlots1,
    }),
  )
}

// Epoch-* -> Instant
// -----------------------------------------------------------------------------

export function epochSecToInstant(epochSec: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec)),
  )
}

export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
  )
}

export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(
      bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro),
    ),
  )
}

export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
  )
}
