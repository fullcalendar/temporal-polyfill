import {
  convertPlainMonthDayToDate,
  convertPlainYearMonthToDate,
  convertToPlainMonthDay,
  convertToPlainYearMonth,
} from './bagRefine'
import { BigNano, bigIntToBigNano, numberToBigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import {
  DateModOps,
  MonthDayRefineOps,
  YearMonthRefineOps,
} from './calendarOps'
import { requireObjectLike, toBigInt } from './cast'
import { EraYearOrYear, MonthDayFields, YearMonthFields } from './fields'
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

export function instantToZonedDateTime(
  instantSlots: InstantSlots,
  timeZoneId: string,
  calendarId: string = isoCalendarId,
): ZonedDateTimeSlots {
  return createZonedDateTimeSlots(
    instantSlots.epochNanoseconds,
    timeZoneId,
    calendarId,
  )
}

// ZonedDateTime -> *
// -----------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): InstantSlots {
  return createInstantSlots(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
  )
}

export function zonedDateTimeToPlainDate(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateSlots {
  return createPlainDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
  )
}

export function zonedDateTimeToPlainYearMonth(
  getCalendarOps: (calendarId: string) => YearMonthRefineOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  const calendarId = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarId)

  return convertToPlainYearMonth(calendarOps, zonedDateTimeFields)
}

export function zonedDateTimeToPlainMonthDay(
  getCalendarOps: (calendarId: string) => MonthDayRefineOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const calendarId = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarId)

  return convertToPlainMonthDay(calendarOps, zonedDateTimeFields)
}

export function zonedDateTimeToPlainTime(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainTimeSlots {
  return createPlainTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0, getTimeZoneOps),
  )
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  plainDateTimeSlots: PlainDateTimeSlots,
  timeZoneId: string,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots {
  const epochNano = dateToEpochNano(
    getTimeZoneOps,
    timeZoneId,
    plainDateTimeSlots,
    options,
  )
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano),
    timeZoneId,
    plainDateTimeSlots.calendar,
  )
}

export function plainDateTimeToPlainYearMonth(
  getCalendarOps: (calendarId: string) => YearMonthRefineOps,
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return createPlainYearMonthSlots({
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
  })
}

export function plainDateTimeToPlainMonthDay(
  getCalendarOps: (calendarId: string) => MonthDayRefineOps,
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)
  return convertToPlainMonthDay(calendarOps, plainDateFields)
}

function dateToEpochNano(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  timeZoneId: string,
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): BigNano | undefined {
  const epochDisambig = refineEpochDisambigOptions(options)
  const timeZoneOps = getTimeZoneOps(timeZoneId)
  return getSingleInstantFor(timeZoneOps, isoFields, epochDisambig)
}

// PlainDate -> *
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  plainDateSlots: PlainDateSlots,
  options: { timeZone: string; plainTime?: PA },
): ZonedDateTimeSlots {
  const timeZoneId = refineTimeZoneString(options.timeZone)
  const plainTimeArg = options.plainTime
  const isoTimeFields =
    plainTimeArg !== undefined
      ? refinePlainTimeArg(plainTimeArg)
      : isoTimeFieldDefaults

  const timeZoneOps = getTimeZoneOps(timeZoneId)

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...isoTimeFields }),
    timeZoneId,
    plainDateSlots.calendar,
  )
}

export function plainDateToPlainDateTime(
  plainDateSlots: PlainDateSlots,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...plainDateSlots,
      ...plainTimeFields,
    }),
  )
}

export function plainDateToPlainYearMonth(
  getCalendarOps: (calendarId: string) => YearMonthRefineOps,
  plainDateSlots: { calendar: string },
  plainDateFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  const calendarId = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarId)
  return convertToPlainYearMonth(calendarOps, plainDateFields)
}

export function plainDateToPlainMonthDay(
  getCalendarOps: (calendarId: string) => MonthDayRefineOps,
  plainDateSlots: { calendar: string },
  plainDateFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const calendarId = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarId)
  return convertToPlainMonthDay(calendarOps, plainDateFields)
}

// PlainYearMonth -> *
// -----------------------------------------------------------------------------

export function plainYearMonthToPlainDate(
  getCalendarOps: (calendar: string) => DateModOps,
  plainYearMonthSlots: PlainYearMonthSlots,
  plainYearMonthFields: YearMonthFields,
  bag: { day: number },
): PlainDateSlots {
  const calendarId = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag)
}

// PlainMonthDay -> *
// -----------------------------------------------------------------------------

export function plainMonthDayToPlainDate(
  getCalendarOps: (calendar: string) => DateModOps,
  plainMonthDaySlots: PlainMonthDaySlots,
  plainMonthDayFields: MonthDayFields,
  bag: EraYearOrYear,
): PlainDateSlots {
  const calendarId = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return convertPlainMonthDayToDate(calendarOps, plainMonthDayFields, bag)
}

// PlainTime -> *
// -----------------------------------------------------------------------------

export function plainTimeToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  slots: PlainTimeSlots,
  options: { timeZone: string; plainDate: PA },
): ZonedDateTimeSlots {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneId = refineTimeZoneString(refinedOptions.timeZone)
  const timeZoneOps = getTimeZoneOps(timeZoneId)

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...slots }),
    timeZoneId,
    plainDateSlots.calendar,
  )
}

export function plainTimeToPlainDateTime(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots,
): PlainDateTimeSlots {
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
    checkEpochNanoInBounds(numberToBigNano(epochSec, nanoInSec)),
  )
}

export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(numberToBigNano(epochMilli, nanoInMilli)),
  )
}

export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochMicro), nanoInMicro)),
  )
}

export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
  )
}
