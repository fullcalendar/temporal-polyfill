import type { Temporal } from 'temporal-spec'
import { getCalendarFieldNames } from './calendarFields'
import { type CalendarImpl } from './calendarImpl'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAlpha,
} from './durationFields'
import { validateDurationFields } from './durationMath'
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
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
  ZonedDateTimeLikeObject,
  ZonedDateTimeRefinedObject,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { isoEpochFirstLeapYear } from './isoCalendarMath'
import {
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsFieldRefine'
import { RelativeToSlots } from './relativeMath'
import {
  ZonedEpochNanoFields,
  createDurationSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  createPlainDateFromFields,
  createPlainDateFromFieldsWithOptionsRefiner,
  createPlainDateTimeFromRefinedFields,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from './slotsFromRefinedFields'
import { queryTimeZone } from './timeZone'
import { getMatchingInstantFor } from './timeZoneMath'
import { NumberSign } from './utils'

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
  calendar: CalendarImpl,
  bag: ZonedDateTimeLikeObject, // i think this needs type change
): RelativeToSlots {
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
    const timeZone = queryTimeZone(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZone,
      combineDateAndTime(isoDateFields, timeFields),
      // After readAndRefineBagFields(), the public "offset" field is stored
      // internally as offset nanoseconds.
      fields.offset,
    )

    return { epochNanoseconds, timeZone, calendar }
  }

  return createPlainDateFromFields(calendar, fields as any)
}

export function refineZonedDateTimeObjectLike(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendar: CalendarImpl,
  bag: ZonedDateTimeLikeObject,
  options: Temporal.ZonedDateTimeFromOptions | undefined,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
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
  const timeZone = queryTimeZone(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    combineDateAndTime(isoDateFields, timeFields),
    // After readAndRefineBagFields(), the public "offset" field is stored
    // internally as offset nanoseconds.
    fields.offset,
    offsetDisambig,
    epochDisambig,
  )

  return createZonedEpochNanoSlots(epochNanoseconds, timeZone, calendar)
}

export function refinePlainDateTimeObjectLike(
  calendar: CalendarImpl,
  bag: Partial<DateTimeFields>,
  options: Temporal.OverflowOptions | undefined,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
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
    calendar,
  )
}

export function refinePlainDateObjectLike(
  calendar: CalendarImpl,
  bag: Partial<DateFields>,
  options: Temporal.OverflowOptions | undefined,
  requireFields: string[] = [],
): CalendarDateFields & { calendar: CalendarImpl } {
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
  calendar: CalendarImpl,
  bag: Partial<YearMonthFields>,
  options: Temporal.OverflowOptions | undefined,
  requireFields?: string[],
): CalendarDateFields & { calendar: CalendarImpl } {
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
  calendar: CalendarImpl,
  calendarAbsent: boolean,
  bag: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
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
  options?: Temporal.OverflowOptions, // optional b/c func API can use directly
): TimeFields {
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

  // result is guaranteed exact TimeFields shape
  return resolveTimeFields(fields, overflow)
}

export function refineDurationObjectLike(
  bag: Partial<DurationFields>,
): DurationFields & { sign: NumberSign } {
  // refine in 'partial' mode
  const durationFields = readAndRefineBagFields(
    bag,
    durationFieldNamesAlpha,
    durationFieldRefiners,
  ) as Partial<DurationFields>

  return createDurationSlots(
    validateDurationFields({
      ...durationFieldDefaults,
      ...durationFields,
    }),
  )
}
