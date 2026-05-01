import { BigNano, bigIntToBigNano, numberToBigNano } from './bigNano'
import { getCalendarFieldNames } from './calendarFields'
import { requireObjectLike, toBigInt, toStrictInteger } from './cast'
import { timeFieldDefaults } from './fieldNames'
import {
  dayFieldNames,
  monthCodeDayFieldNames,
  yearFieldNames,
  yearFieldNamesWithEra,
  yearMonthCodeDayFieldNamesAlpha,
  yearMonthCodeDayFieldNamesAlphaWithEra,
  yearMonthCodeFieldNames,
  yearMonthCodeFieldNamesWithEra,
} from './fieldNames'
import { readAndRefineBagFields } from './fieldRefine'
import { CalendarDateFields, TimeFields } from './fieldTypes'
import {
  DateFields,
  DayFields,
  EraYearOrYear,
  YearMonthFields,
} from './fieldTypes'
import { isoCalendarId } from './intlCalendarConfig'
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
import { queryTimeZone } from './timeZoneImpl'
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
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateTimeSlots {
  const { isoDate, time } = zonedEpochSlotsToIso(zonedDateTimeSlots0)
  return createPlainDateTimeSlots(isoDate, time, zonedDateTimeSlots0.calendar)
}

export function zonedDateTimeToPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateSlots {
  return createPlainDateSlots(
    zonedEpochSlotsToIso(zonedDateTimeSlots0).isoDate,
    zonedDateTimeSlots0.calendar,
  )
}

export function zonedDateTimeToPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainTimeSlots {
  return createPlainTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0).time)
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  plainDateTimeSlots: PlainDateTimeSlots,
  timeZoneId: string,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots {
  const epochNano = dateToEpochNano(
    timeZoneId,
    plainDateTimeSlots.isoDate,
    plainDateTimeSlots.time,
    options,
  )
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano),
    timeZoneId,
    plainDateTimeSlots.calendar,
  )
}

function dateToEpochNano(
  timeZoneId: string,
  isoDate: CalendarDateFields,
  time: TimeFields,
  options?: EpochDisambigOptions,
): BigNano | undefined {
  const epochDisambig = refineEpochDisambigOptions(options)
  const timeZoneImpl = queryTimeZone(timeZoneId)
  return getSingleInstantFor(timeZoneImpl, isoDate, time, epochDisambig)
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
      plainDateSlots.isoDate,
      timeFields,
    )
  } else {
    epochNano = getStartOfDayInstantFor(
      timeZoneImpl,
      plainDateSlots.isoDate,
      timeFieldDefaults,
    )
  }

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneId,
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
  calendarId: string,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  const inputFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeFieldNames,
    yearMonthCodeFieldNamesWithEra,
  )
  const inputFields = pluckProps(
    inputFieldNames,
    input as unknown as Record<string, unknown>,
  )
  const extraFields = readAndRefineBagFields(
    requireObjectLike(bag) as unknown as Record<string, unknown>,
    dayFieldNames,
    [],
  )

  return createPlainDateFromMergedFields(calendarId, inputFields, extraFields)
}

// PlainMonthDay -> *
// -----------------------------------------------------------------------------

export function convertPlainMonthDayToDate(
  calendarId: string,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
  const extraFieldNames = getCalendarFieldNames(
    calendarId,
    yearFieldNames,
    yearFieldNamesWithEra,
  )
  const inputFields = pluckProps(
    monthCodeDayFieldNames,
    input as Record<string, unknown>,
  )
  const extraFields = readAndRefineBagFields(
    requireObjectLike(bag) as Record<string, unknown>,
    extraFieldNames,
    [],
  )

  return createPlainDateFromMergedFields(calendarId, inputFields, extraFields)
}

export function convertToPlainMonthDay(
  calendarId: string,
  input: { monthCode: string; day: number }, // TODO: better type for this?
): PlainMonthDaySlots {
  const fields = readAndRefineBagFields(
    /* bag */ input,
    /* validFieldNames */ monthCodeDayFieldNames,
  )
  return createPlainMonthDayFromFields(
    calendarId,
    fields as Partial<DateFields>,
  )
}

export function convertToPlainYearMonth(
  calendarId: string,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeFieldNames,
    yearMonthCodeFieldNamesWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ input,
    /* validFieldNames */ validFieldNames,
  )
  return createPlainYearMonthFromFields(
    calendarId,
    fields as Partial<YearMonthFields>,
    options,
  )
}

function createPlainDateFromMergedFields(
  calendarId: string,
  inputFields: Record<string, unknown>,
  extraFields: Record<string, unknown>,
): PlainDateSlots {
  const mergedFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeDayFieldNamesAlpha,
    yearMonthCodeDayFieldNamesAlphaWithEra,
  )

  let mergedFields = mergeCalendarFields(calendarId, inputFields, extraFields)
  mergedFields = readAndRefineBagFields(mergedFields, mergedFieldNames, [])

  return createPlainDateFromFields(calendarId, mergedFields as any)
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
    getSingleInstantFor(timeZoneImpl, plainDateSlots.isoDate, slots.time),
    timeZoneId,
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
