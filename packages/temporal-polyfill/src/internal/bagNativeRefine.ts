import {
  getCalendarFieldNames,
  readNativeCalendarFields,
} from './bagCalendarFields'
import { readAndCoerceBagFields } from './bagFields'
import {
  dateFromFields,
  monthDayFromFields,
  resolveDateFromFields,
  yearMonthFromFields,
} from './bagFromFields'
import { timeFieldsToIso } from './bagRefineConfig'
import type {
  CoercedZonedDateTimeBag,
  ZonedDateTimeBag,
} from './bagRefineConfig'
import {
  durationFieldDefaults,
  durationFieldNamesAlpha,
} from './durationFields'
import { checkDurationUnits } from './durationMath'
import {
  DateBag,
  DateTimeBag,
  DurationBag,
  MonthDayBag,
  TimeBag,
  YearMonthBag,
  dateFieldNamesAlpha,
  dateFieldNamesAlphaWithEra,
  dateTimeAndZoneFieldNamesAlpha,
  dateTimeAndZoneFieldNamesAlphaWithEra,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesAlphaWithEra,
  dayFieldNames,
  timeFieldDefaults,
  timeFieldNamesAlpha,
  timeZoneFieldNames,
  yearMonthFieldNames,
  yearMonthFieldNamesWithEra,
} from './fields'
import { IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { constrainIsoTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { Overflow } from './optionsModel'
import {
  OverflowOptions,
  ZonedFieldOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsRefine'
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
import { checkIsoDateTimeInBounds } from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import { getMatchingInstantFor } from './timeZoneNativeMath'

/*
Top-level Temporal property-bag entrypoints.

These functions take user-provided bags, read/coerce their fields in the
observable order required by Temporal, resolve calendar/time-zone pieces through
the built-in calendar/time-zone implementation, and return slots. "Native" here
means "using this polyfill's built-in calendar/time-zone path", not a host API
distinction. A better module name would avoid that overloaded word.
*/

// High-Level Refining
// -----------------------------------------------------------------------------

export function refineMaybeNativeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendarId: string,
  bag: ZonedDateTimeBag,
): RelativeToSlotsNoCalendar {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesAlphaWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ [],
  ) as CoercedZonedDateTimeBag

  if (fields.timeZone !== undefined) {
    const isoDateFields = dateFromFields(calendarId, fields as any)
    const isoTimeFields = resolveTimeFields(fields)

    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const nativeTimeZone = queryNativeTimeZone(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      nativeTimeZone,
      { ...isoDateFields, ...isoTimeFields },
      // After readAndCoerceBagFields(), the public "offset" field is stored
      // internally as offset nanoseconds.
      fields.offset,
    )

    return { epochNanoseconds, timeZone: timeZoneId }
  }

  const isoDateInternals = dateFromFields(calendarId, fields as any)
  return { ...isoDateInternals, ...isoTimeFieldDefaults }
}

export function refineNativeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string,
  calendarId: string,
  bag: ZonedDateTimeBag,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeAndZoneFieldNamesAlpha,
    dateTimeAndZoneFieldNamesAlphaWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ timeZoneFieldNames,
  ) as CoercedZonedDateTimeBag

  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    resolveDateFromFields(calendarId, fields as any, () =>
      refineZonedFieldOptions(options),
    )
  const isoTimeFields = resolveTimeFields(fields, overflow)
  const nativeTimeZone = queryNativeTimeZone(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    nativeTimeZone,
    { ...isoDateFields, ...isoTimeFields },
    // After readAndCoerceBagFields(), the public "offset" field is stored
    // internally as offset nanoseconds.
    fields.offset,
    offsetDisambig,
    epochDisambig,
  )

  return createZonedDateTimeSlots(epochNanoseconds, timeZoneId, calendarId)
}

export function refineNativePlainDateTimeBag(
  calendarId: string,
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): PlainDateTimeSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesAlphaWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ [],
  ) as DateTimeBag

  const [isoDateInternals, overflow] = resolveDateFromFields(
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

export function refineNativePlainDateBag(
  calendarId: string,
  bag: DateBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): PlainDateSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ requireFields,
  )

  return dateFromFields(calendarId, fields as any, options)
}

export function refineNativePlainYearMonthBag(
  calendarId: string,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthFieldNames,
    yearMonthFieldNamesWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ requireFields,
  )

  return yearMonthFromFields(calendarId, fields as any, options)
}

export function refineNativePlainMonthDayBag(
  calendarId: string,
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ bag,
    /* validFieldNames */ validFieldNames,
    /* requiredFieldNames */ dayFieldNames,
  ) as DateBag

  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = isoEpochFirstLeapYear
  }

  return monthDayFromFields(calendarId, fields, options)
}

export function refinePlainTimeBag(
  bag: TimeBag,
  options?: OverflowOptions, // optional b/c func API can use directly
): PlainTimeSlots {
  // disallowEmpty
  const fields = readAndCoerceBagFields(
    bag,
    timeFieldNamesAlpha,
    [],
    true,
  ) as TimeBag

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  return createPlainTimeSlots(resolveTimeFields(fields, overflow))
}

export function refineDurationBag(bag: DurationBag): DurationSlots {
  // refine in 'partial' mode
  const durationFields = readAndCoerceBagFields(
    bag,
    durationFieldNamesAlpha,
  ) as DurationBag

  return createDurationSlots(
    checkDurationUnits({
      ...durationFieldDefaults,
      ...durationFields,
    }),
  )
}

function resolveTimeFields(
  fields: TimeBag,
  overflow?: Overflow,
): IsoTimeFields {
  return constrainIsoTimeFields(
    timeFieldsToIso({ ...timeFieldDefaults, ...fields }),
    overflow,
  )
}
