import type { Temporal } from 'temporal-spec'
import { bigNanoInMilli } from './bigNano'
import { getCalendarFieldNames } from './calendarFields'
import { type CalendarImpl } from './calendarImpl'
import { requireObjectLike, toBigInt, toStrictInteger } from './cast'
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
import { TimeZone, queryTimeZone } from './timeZone'
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
  timeZone: TimeZone,
  calendar?: CalendarImpl, // omitting means isoCalendarImpl (undefined)
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  return createZonedEpochNanoSlots(
    instantSlots.epochNanoseconds,
    timeZone,
    calendar,
  )
}

// ZonedDateTime -> *
// -----------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
): EpochNanoFields {
  return createEpochNanoSlots(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  return createDateTimeSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainDate(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
): CalendarDateFields & { calendar: CalendarImpl } {
  return createDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0),
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainTime(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
): TimeFields {
  return createTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: CalendarImpl },
  timeZone: TimeZone,
  options?: Temporal.DisambiguationOptions,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const epochNano = dateToEpochNano(timeZone, plainDateTimeSlots, options)
  return createZonedEpochNanoSlots(
    checkEpochNanoInBounds(epochNano),
    timeZone,
    plainDateTimeSlots.calendar,
  )
}

function dateToEpochNano(
  timeZone: TimeZone,
  isoDateTime: CalendarDateTimeFields,
  options?: Temporal.DisambiguationOptions,
): bigint {
  const epochDisambig = refineEpochDisambigOptions(options)
  return getSingleInstantFor(timeZone, isoDateTime, epochDisambig)
}

// PlainDate -> *
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainTimeArg: (plainTimeArg: PA) => TimeFields,
  plainDateSlots: CalendarDateFields & { calendar: CalendarImpl },
  options: { timeZone: string; plainTime?: PA },
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const timeZoneId = refineTimeZoneString(options.timeZone)
  const plainTimeArg = options.plainTime
  const timeFields =
    plainTimeArg !== undefined ? refinePlainTimeArg(plainTimeArg) : undefined

  const timeZone = queryTimeZone(timeZoneId)
  let epochNano: bigint

  if (timeFields) {
    epochNano = getSingleInstantFor(
      timeZone,
      combineDateAndTime(plainDateSlots, timeFields),
    )
  } else {
    epochNano = getStartOfDayInstantFor(
      timeZone,
      combineDateAndTime(plainDateSlots, timeFieldDefaults),
    )
  }

  return createZonedEpochNanoSlots(epochNano, timeZone, plainDateSlots.calendar)
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
  calendar: CalendarImpl,
  input: YearMonthFields,
  bag: DayFields,
): CalendarDateFields & { calendar: CalendarImpl } {
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
  calendar: CalendarImpl,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): CalendarDateFields & { calendar: CalendarImpl } {
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
  calendar: CalendarImpl,
  input: { monthCode: string; day: number }, // TODO: better type for this?
): CalendarDateFields & { calendar: CalendarImpl } {
  const fields = readAndRefineBagFields(
    /* bag */ input,
    /* validFieldNames */ monthCodeDayFieldNamesAlpha,
    /* fieldRefiners */ dateFieldRefiners,
  )
  return createPlainMonthDayFromFields(calendar, fields as Partial<DateFields>)
}

export function convertToPlainYearMonth(
  calendar: CalendarImpl,
  input: { year: number; monthCode: string },
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
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
  calendar: CalendarImpl,
  inputFields: Record<string, unknown>,
  extraFields: Record<string, unknown>,
): CalendarDateFields & { calendar: CalendarImpl } {
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
  ) => CalendarDateFields & { calendar: CalendarImpl },
  slots: TimeFields,
  options: { timeZone: string; plainDate: PA },
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneId = refineTimeZoneString(refinedOptions.timeZone)
  const timeZone = queryTimeZone(timeZoneId)

  return createZonedEpochNanoSlots(
    getSingleInstantFor(timeZone, combineDateAndTime(plainDateSlots, slots)),
    timeZone,
    plainDateSlots.calendar,
  )
}

// Epoch-* -> Instant
// -----------------------------------------------------------------------------

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
Almost public-facing, does input validation
*/
export function epochNanoToInstant(epochNano: bigint): EpochNanoFields {
  return createEpochNanoSlots(checkEpochNanoInBounds(toBigInt(epochNano)))
}
