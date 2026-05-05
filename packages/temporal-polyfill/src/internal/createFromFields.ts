import { getCalendarFieldNames } from './calendarFields'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAlpha,
} from './durationFields'
import { checkDurationUnits } from './durationMath'
import {
  type InternalCalendar,
  getInternalCalendarId,
} from './externalCalendar'
import { resolveTimeFields } from './fieldConvert'
import {
  dateFieldNamesAlpha,
  dateFieldNamesWithEraAlpha,
  dateTimeAndZoneFieldNamesAlpha,
  dateTimeAndZoneFieldNamesWithEraAlpha,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesWithEraAlpha,
  dayFieldNamesAsc,
  timeFieldNamesAlpha,
  timeZoneFieldNames,
  yearMonthFieldNamesAlpha,
  yearMonthFieldNamesWithEraAlpha,
} from './fieldNames'
import {
  dateFieldRefiners,
  dateTimeFieldRefiners,
  durationFieldRefiners,
  readAndRefineBagFields,
  timeFieldRefiners,
  zonedDateTimeFieldRefiners,
} from './fieldRefine'
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
import { combineDateAndTime } from './fieldUtils'
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
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  createPlainDateFromFields,
  createPlainDateFromFieldsWithOptionsRefiner,
  createPlainDateTimeFromRefinedFields,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from './slotsFromRefinedFields'
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
  calendar: InternalCalendar,
  bag: ZonedDateTimeLikeObject, // i think this needs type change
): RelativeToSlotsNoCalendar {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ zonedDateTimeFieldRefiners,
    /* requiredFieldNames */ [],
    /* disallowEmpty */ false,
  ) as ZonedDateTimeRefinedObject

  if (fields.timeZone !== undefined) {
    const isoDateFields = createPlainDateFromFields(calendar, fields as any)
    const timeFields = resolveTimeFields(fields)

    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const timeZoneImpl = queryTimeZone(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneImpl,
      combineDateAndTime(isoDateFields, timeFields),
      // After readAndRefineBagFields(), the public "offset" field is stored
      // internally as offset nanoseconds.
      fields.offset,
    )

    return { epochNanoseconds, timeZoneId: timeZoneId }
  }

  return createPlainDateFromFields(calendar, fields as any)
}

export function refineZonedDateTimeObjectLike(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendar: InternalCalendar,
  bag: ZonedDateTimeLikeObject,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots {
  const calendarId = getInternalCalendarId(calendar)
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ zonedDateTimeFieldRefiners,
    /* requiredFieldNames */ timeZoneFieldNames,
    /* disallowEmpty */ false,
  ) as ZonedDateTimeRefinedObject

  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    createPlainDateFromFieldsWithOptionsRefiner(calendar, fields as any, () =>
      refineZonedFieldOptions(options),
    )
  const timeFields = resolveTimeFields(fields, overflow)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneImpl,
    combineDateAndTime(isoDateFields, timeFields),
    // After readAndRefineBagFields(), the public "offset" field is stored
    // internally as offset nanoseconds.
    fields.offset,
    offsetDisambig,
    epochDisambig,
  )

  return createZonedDateTimeSlots(epochNanoseconds, timeZoneId, calendarId)
}

export function refinePlainDateTimeObjectLike(
  calendar: InternalCalendar,
  bag: Partial<DateTimeFields>,
  options: OverflowOptions | undefined,
): PlainDateTimeSlots {
  const calendarId = getInternalCalendarId(calendar)
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ dateTimeFieldRefiners,
    /* requiredFieldNames */ [],
    /* disallowEmpty */ false,
  ) as Partial<DateTimeFields>

  const [isoDateInternals, overflow] =
    createPlainDateFromFieldsWithOptionsRefiner(calendar, fields as any, () => [
      refineOverflowOptions(options),
    ])
  const timeFields = resolveTimeFields(fields, overflow)

  return createPlainDateTimeFromRefinedFields(
    isoDateInternals,
    timeFields,
    calendarId,
  )
}

export function refinePlainDateObjectLike(
  calendar: InternalCalendar,
  bag: Partial<DateFields>,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): PlainDateSlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ dateFieldRefiners,
    /* requiredFieldNames */ requireFields,
  )

  return createPlainDateFromFields(calendar, fields as any, options)
}

export function refinePlainYearMonthObjectLike(
  calendar: InternalCalendar,
  bag: Partial<YearMonthFields>,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    yearMonthFieldNamesAlpha,
    yearMonthFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ dateFieldRefiners,
    /* requiredFieldNames */ requireFields,
  )

  return createPlainYearMonthFromFields(calendar, fields as any, options)
}

export function refinePlainMonthDayObjectLike(
  calendar: InternalCalendar,
  calendarAbsent: boolean,
  bag: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )
  const fields = readAndRefineBagFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* fieldRefiners */ dateFieldRefiners,
    /* requiredFieldNames */ dayFieldNamesAsc,
    /* disallowEmpty */ false,
  ) as Partial<DateFields>

  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = isoEpochFirstLeapYear
  }

  return createPlainMonthDayFromFields(calendar, fields, options)
}

export function refinePlainTimeObjectLike(
  bag: Partial<TimeFields>,
  options?: OverflowOptions, // optional b/c func API can use directly
): PlainTimeSlots {
  // disallowEmpty
  const fields = readAndRefineBagFields(
    bag,
    timeFieldNamesAlpha,
    timeFieldRefiners,
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
    durationFieldRefiners,
  ) as Partial<DurationFields>

  return createDurationSlots(
    checkDurationUnits({
      ...durationFieldDefaults,
      ...durationFields,
    }),
  )
}
