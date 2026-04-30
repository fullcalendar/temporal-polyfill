import { getCalendarFieldNames } from './calendarFields'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAlpha,
} from './durationFields'
import { checkDurationUnits } from './durationMath'
import { resolveTimeFields } from './fieldConvert'
import { timeFieldDefaults } from './fieldNames'
import {
  dateFieldNamesAlpha,
  dateFieldNamesAlphaWithEra,
  dateTimeAndZoneFieldNamesAlpha,
  dateTimeAndZoneFieldNamesAlphaWithEra,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesAlphaWithEra,
  dayFieldNames,
  timeFieldNamesAlpha,
  timeZoneFieldNames,
  yearMonthFieldNames,
  yearMonthFieldNamesWithEra,
} from './fieldNames'
import { readAndRefineBagFields } from './fieldRefine'
import type {
  ZonedDateTimeLikeObject,
  ZonedDateTimeRefinedObject,
} from './fieldTypes'
import {
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { isoEpochFirstLeapYear } from './isoMath'
import {
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsFieldRefine'
import { OverflowOptions, ZonedFieldOptions } from './optionsModel'
import { RelativeToSlotsNoCalendar } from './relativeMath'
import {
  DurationSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createDurationSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  createPlainDateFromFields,
  createPlainDateFromFieldsWithOptionsRefiner,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from './slotsFromRefinedFields'
import { checkIsoDateTimeInBounds } from './timeMath'
import { queryTimeZone } from './timeZoneImpl'
import { getMatchingInstantFor } from './timeZoneMath'

/*
Top-level Temporal object-like entrypoints.

These functions take user-provided object-like inputs, read/refine their fields in the
observable order required by Temporal, resolve calendar/time-zone pieces
through the built-in calendar/time-zone implementation, and return slots.
*/

// High-Level Refining
// -----------------------------------------------------------------------------

// Input could be ZonedDateTime OR PlainDate fields (for relativeTo).
export function refineMaybeZonedDateTimeObjectLike(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendarId: string,
  bag: ZonedDateTimeLikeObject, // i think this needs type change
): RelativeToSlotsNoCalendar {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesAlphaWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ [],
  ) as ZonedDateTimeRefinedObject

  if (fields.timeZone !== undefined) {
    const isoDateFields = createPlainDateFromFields(calendarId, fields as any)
    const isoTimeFields = resolveTimeFields(fields)

    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const timeZoneImpl = queryTimeZone(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneImpl,
      { ...isoDateFields, ...isoTimeFields },
      // After readAndRefineBagFields(), the public "offset" field is stored
      // internally as offset nanoseconds.
      fields.offset,
    )

    return { epochNanoseconds, timeZone: timeZoneId }
  }

  const isoDateInternals = createPlainDateFromFields(calendarId, fields as any)
  return { ...isoDateInternals, ...timeFieldDefaults }
}

export function refineZonedDateTimeObjectLike(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendarId: string,
  bag: ZonedDateTimeLikeObject,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesAlphaWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ timeZoneFieldNames,
  ) as ZonedDateTimeRefinedObject

  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    createPlainDateFromFieldsWithOptionsRefiner(calendarId, fields as any, () =>
      refineZonedFieldOptions(options),
    )
  const isoTimeFields = resolveTimeFields(fields, overflow)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneImpl,
    { ...isoDateFields, ...isoTimeFields },
    // After readAndRefineBagFields(), the public "offset" field is stored
    // internally as offset nanoseconds.
    fields.offset,
    offsetDisambig,
    epochDisambig,
  )

  return createZonedDateTimeSlots(epochNanoseconds, timeZoneId, calendarId)
}

export function refinePlainDateTimeObjectLike(
  calendarId: string,
  bag: Partial<DateTimeFields>,
  options: OverflowOptions | undefined,
): PlainDateTimeSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesAlphaWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ [],
  ) as Partial<DateTimeFields>

  const [isoDateInternals, overflow] =
    createPlainDateFromFieldsWithOptionsRefiner(
      calendarId,
      fields as any,
      () => [refineOverflowOptions(options)],
    )
  const isoTimeFields = resolveTimeFields(fields, overflow)

  const isoFields = checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })

  return createPlainDateTimeSlots(isoFields)
}

export function refinePlainDateObjectLike(
  calendarId: string,
  bag: Partial<DateFields>,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): PlainDateSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ requireFields,
  )

  return createPlainDateFromFields(calendarId, fields as any, options)
}

export function refinePlainYearMonthObjectLike(
  calendarId: string,
  bag: Partial<YearMonthFields>,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthFieldNames,
    yearMonthFieldNamesWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ requireFields,
  )

  return createPlainYearMonthFromFields(calendarId, fields as any, options)
}

export function refinePlainMonthDayObjectLike(
  calendarId: string,
  calendarAbsent: boolean,
  bag: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ dayFieldNames,
  ) as Partial<DateFields>

  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = isoEpochFirstLeapYear
  }

  return createPlainMonthDayFromFields(calendarId, fields, options)
}

export function refinePlainTimeObjectLike(
  bag: Partial<TimeFields>,
  options?: OverflowOptions, // optional b/c func API can use directly
): PlainTimeSlots {
  // disallowEmpty
  const fields = readAndRefineBagFields(
    bag,
    timeFieldNamesAlpha,
    [],
    true,
  ) as Partial<TimeFields>

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  return createPlainTimeSlots(resolveTimeFields(fields, overflow))
}

export function refineDurationObjectLike(
  bag: Partial<DurationFields>,
): DurationSlots {
  // refine in 'partial' mode
  const durationFields = readAndRefineBagFields(
    bag,
    durationFieldNamesAlpha,
  ) as Partial<DurationFields>

  return createDurationSlots(
    checkDurationUnits({
      ...durationFieldDefaults,
      ...durationFields,
    }),
  )
}
