import { BigNano, bigIntToBigNano, numberToBigNano } from './bigNano'
import { getCalendarFieldNames } from './calendarFields'
import { requireObjectLike, toBigInt, toStrictInteger } from './cast'
import { type InternalCalendar, isoCalendar } from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import {
  dayFieldNamesAsc,
  monthCodeDayFieldNamesAlpha,
  yearFieldNamesAsc,
  yearFieldNamesWithEraAlpha,
  yearMonthCodeDayFieldNamesAlpha,
  yearMonthCodeDayFieldNamesWithEraAlpha,
  yearMonthCodeFieldNamesAlpha,
  yearMonthCodeFieldNamesWithEraAlpha,
} from './fieldNames'
import { dateFieldRefiners, readAndRefineBagFields } from './fieldRefine'
import { CalendarDateTimeFields, TimeFields } from './fieldTypes'
import {
  DateFields,
  DayFields,
  EraYearOrYear,
  YearMonthFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { mergeCalendarFields } from './merge'
import { refineEpochDisambigOptions } from './optionsFieldRefine'
import { EpochDisambigOptions, OverflowOptions } from './optionsModel'
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
  createZonedDateTimeSlots,
} from './slots'
import {
  createPlainDateFromFields,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from './slotsFromRefinedFields'
import { checkEpochNanoInBounds } from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import {
  getSingleInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'
import { nanoInMicro, nanoInMilli, nanoInSec } from './units'
import { pluckProps } from './utils'

// Instant -> *
// -----------------------------------------------------------------------------

export function instantToZonedDateTime(
  instantSlots: InstantSlots,
  timeZone: TimeZoneImpl,
  calendar: InternalCalendar = isoCalendar,
): ZonedDateTimeSlots {
  return createZonedDateTimeSlots(
    instantSlots.epochNanoseconds,
    timeZone,
    calendar,
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
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateSlots {
  return createPlainDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainTimeSlots {
  return createPlainTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  plainDateTimeSlots: PlainDateTimeSlots,
  timeZone: TimeZoneImpl,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots {
  const epochNano = dateToEpochNano(timeZone, plainDateTimeSlots, options)
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano),
    timeZone,
    plainDateTimeSlots.calendar,
  )
}

function dateToEpochNano(
  timeZoneImpl: TimeZoneImpl,
  isoDateTime: CalendarDateTimeFields,
  options?: EpochDisambigOptions,
): BigNano | undefined {
  const epochDisambig = refineEpochDisambigOptions(options)
  return getSingleInstantFor(timeZoneImpl, isoDateTime, epochDisambig)
}

// PlainDate -> *
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainTimeArg: (plainTimeArg: PA) => TimeFields,
  plainDateSlots: PlainDateSlots,
  options: { timeZone: string; plainTime?: PA },
): ZonedDateTimeSlots {
  const timeZoneId = refineTimeZoneString(options.timeZone)
  const plainTimeArg = options.plainTime
  const timeFields =
    plainTimeArg !== undefined ? refinePlainTimeArg(plainTimeArg) : undefined

  const timeZoneImpl = queryTimeZone(timeZoneId)
  let epochNano: BigNano

  if (timeFields) {
    epochNano = getSingleInstantFor(
      timeZoneImpl,
      combineDateAndTime(plainDateSlots, timeFields),
    )
  } else {
    epochNano = getStartOfDayInstantFor(
      timeZoneImpl,
      combineDateAndTime(plainDateSlots, timeFieldDefaults),
    )
  }

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneImpl,
    plainDateSlots.calendar,
  )
}

/*
Some public conversions are not pure slot projections. PlainMonthDay and
PlainYearMonth need to rebuild calendar fields, sometimes with an additional
object-like argument, and then run through the built-in calendar resolution
path. Keep them here with the other toX-style conversions, but preserve that
field-pipeline boundary.
*/

// PlainYearMonth -> *
// -----------------------------------------------------------------------------

export function convertPlainYearMonthToDate(
  calendar: InternalCalendar,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  const inputFieldNames = getCalendarFieldNames(
    calendar,
    yearMonthCodeFieldNamesAlpha,
    yearMonthCodeFieldNamesWithEraAlpha,
  )
  const inputFields = pluckProps(
    inputFieldNames,
    input as unknown as Record<string, unknown>,
  )
  const extraFields = readAndRefineBagFields(
    requireObjectLike(bag) as unknown as Record<string, unknown>,
    dayFieldNamesAsc,
    dateFieldRefiners,
    [],
  )

  return createPlainDateFromMergedFields(calendar, inputFields, extraFields)
}

// PlainMonthDay -> *
// -----------------------------------------------------------------------------

export function convertPlainMonthDayToDate(
  calendar: InternalCalendar,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
  const extraFieldNames = getCalendarFieldNames(
    calendar,
    yearFieldNamesAsc,
    yearFieldNamesWithEraAlpha,
  )
  const inputFields = pluckProps(
    monthCodeDayFieldNamesAlpha,
    input as Record<string, unknown>,
  )
  const extraFields = readAndRefineBagFields(
    requireObjectLike(bag) as Record<string, unknown>,
    extraFieldNames,
    dateFieldRefiners,
    [],
  )

  return createPlainDateFromMergedFields(calendar, inputFields, extraFields)
}

export function convertToPlainMonthDay(
  calendar: InternalCalendar,
  input: { monthCode: string; day: number }, // TODO: better type for this?
): PlainMonthDaySlots {
  const fields = readAndRefineBagFields(
    /* bag */ input,
    /* validFieldNames */ monthCodeDayFieldNamesAlpha,
    /* fieldRefiners */ dateFieldRefiners,
  )
  return createPlainMonthDayFromFields(calendar, fields as Partial<DateFields>)
}

export function convertToPlainYearMonth(
  calendar: InternalCalendar,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    yearMonthCodeFieldNamesAlpha,
    yearMonthCodeFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ input,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ dateFieldRefiners,
  )
  return createPlainYearMonthFromFields(
    calendar,
    fields as Partial<YearMonthFields>,
    options,
  )
}

function createPlainDateFromMergedFields(
  calendar: InternalCalendar,
  inputFields: Record<string, unknown>,
  extraFields: Record<string, unknown>,
): PlainDateSlots {
  const mergedFieldNames = getCalendarFieldNames(
    calendar,
    yearMonthCodeDayFieldNamesAlpha,
    yearMonthCodeDayFieldNamesWithEraAlpha,
  )

  let mergedFields = mergeCalendarFields(calendar, inputFields, extraFields)
  mergedFields = readAndRefineBagFields(
    mergedFields,
    mergedFieldNames,
    dateFieldRefiners,
    [],
  )

  return createPlainDateFromFields(calendar, mergedFields as any)
}

// PlainTime -> *
// -----------------------------------------------------------------------------

/*
Only used by funcApi
*/
export function plainTimeToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots,
  slots: PlainTimeSlots,
  options: { timeZone: string; plainDate: PA },
): ZonedDateTimeSlots {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneId = refineTimeZoneString(refinedOptions.timeZone)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  return createZonedDateTimeSlots(
    getSingleInstantFor(
      timeZoneImpl,
      combineDateAndTime(plainDateSlots, slots),
    ),
    timeZoneImpl,
    plainDateSlots.calendar,
  )
}

// Epoch-* -> Instant
// -----------------------------------------------------------------------------

/*
Only used by funcApi
Almost public-facing, does input validation
*/
export function epochSecToInstant(epochSec: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(
      numberToBigNano(toStrictInteger(epochSec), nanoInSec),
    ),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(
      numberToBigNano(toStrictInteger(epochMilli), nanoInMilli),
    ),
  )
}

/*
Only used by funcApi
Almost public-facing, does input validation
*/
export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochMicro), nanoInMicro)),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
  )
}
