import { bigNanoInMicro, bigNanoInMilli, bigNanoInSec } from './bigNano'
import { getCalendarFieldNames } from './calendarFields'
import { requireObjectLike, toBigInt, toStrictInteger } from './cast'
import { type InternalCalendar, isoCalendar } from './externalCalendar'
import {
  dayFieldNamesAsc,
  monthCodeDayFieldNamesAlpha,
  timeFieldDefaults,
  yearFieldNamesAsc,
  yearFieldNamesWithEraAlpha,
  yearMonthCodeDayFieldNamesAlpha,
  yearMonthCodeDayFieldNamesWithEraAlpha,
  yearMonthCodeFieldNamesAlpha,
  yearMonthCodeFieldNamesWithEraAlpha,
} from './fieldNames'
import { dateFieldRefiners, readAndRefineBagFields } from './fieldRefine'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateFields,
  DayFields,
  EraYearOrYear,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { mergeCalendarFields } from './merge'
import { refineEpochDisambigOptions } from './optionsFieldRefine'
import { EpochDisambigOptions, OverflowOptions } from './optionsModel'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  createPlainDateFromFields,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from './slotsFromRefinedFields'
import { checkEpochNanoInBounds } from './temporalLimits'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import {
  getSingleInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'
import { pluckProps } from './utils'

// Instant -> *
// -----------------------------------------------------------------------------

export function instantToZonedDateTime(
  instantSlots: EpochNanoFields,
  timeZone: TimeZoneImpl,
  calendar: InternalCalendar = isoCalendar,
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  return createZonedEpochNanoSlots(
    instantSlots.epochNanoseconds,
    timeZone,
    calendar,
  )
}

// ZonedDateTime -> *
// -----------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: InternalCalendar },
): EpochNanoFields {
  return createEpochNanoSlots(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: InternalCalendar },
): CalendarDateTimeFields & { calendar: InternalCalendar } {
  return createDateTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainDate(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: InternalCalendar },
): CalendarDateFields & { calendar: InternalCalendar } {
  return createDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainTime(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: InternalCalendar },
): TimeFields {
  return createTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: InternalCalendar },
  timeZone: TimeZoneImpl,
  options?: EpochDisambigOptions,
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  const epochNano = dateToEpochNano(timeZone, plainDateTimeSlots, options)
  return createZonedEpochNanoSlots(
    checkEpochNanoInBounds(epochNano),
    timeZone,
    plainDateTimeSlots.calendar,
  )
}

function dateToEpochNano(
  timeZoneImpl: TimeZoneImpl,
  isoDateTime: CalendarDateTimeFields,
  options?: EpochDisambigOptions,
): bigint | undefined {
  const epochDisambig = refineEpochDisambigOptions(options)
  return getSingleInstantFor(timeZoneImpl, isoDateTime, epochDisambig)
}

// PlainDate -> *
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainTimeArg: (plainTimeArg: PA) => TimeFields,
  plainDateSlots: CalendarDateFields & { calendar: InternalCalendar },
  options: { timeZone: string; plainTime?: PA },
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  const timeZoneId = refineTimeZoneString(options.timeZone)
  const plainTimeArg = options.plainTime
  const timeFields =
    plainTimeArg !== undefined ? refinePlainTimeArg(plainTimeArg) : undefined

  const timeZoneImpl = queryTimeZone(timeZoneId)
  let epochNano: bigint

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

  return createZonedEpochNanoSlots(
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
): CalendarDateFields & { calendar: InternalCalendar } {
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
): CalendarDateFields & { calendar: InternalCalendar } {
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
): CalendarDateFields & { calendar: InternalCalendar } {
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
): CalendarDateFields & { calendar: InternalCalendar } {
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
): CalendarDateFields & { calendar: InternalCalendar } {
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
  refinePlainDateArg: (
    plainDateArg: PA,
  ) => CalendarDateFields & { calendar: InternalCalendar },
  slots: TimeFields,
  options: { timeZone: string; plainDate: PA },
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneId = refineTimeZoneString(refinedOptions.timeZone)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  return createZonedEpochNanoSlots(
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
export function epochSecToInstant(epochSec: number): EpochNanoFields {
  return createEpochNanoSlots(
    checkEpochNanoInBounds(BigInt(toStrictInteger(epochSec)) * bigNanoInSec),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochMilliToInstant(epochMilli: number): EpochNanoFields {
  return createEpochNanoSlots(
    checkEpochNanoInBounds(
      BigInt(toStrictInteger(epochMilli)) * bigNanoInMilli,
    ),
  )
}

/*
Only used by funcApi
Almost public-facing, does input validation
*/
export function epochMicroToInstant(epochMicro: bigint): EpochNanoFields {
  return createEpochNanoSlots(
    checkEpochNanoInBounds(toBigInt(epochMicro) * bigNanoInMicro),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochNanoToInstant(epochNano: bigint): EpochNanoFields {
  return createEpochNanoSlots(checkEpochNanoInBounds(toBigInt(epochNano)))
}
