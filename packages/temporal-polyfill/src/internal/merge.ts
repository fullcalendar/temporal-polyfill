import {
  computeCalendarDateFields,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import { getCalendarEraOrigins, getCalendarFieldNames } from './calendarFields'
import { formatMonthCode } from './calendarMonthCode'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { checkDurationUnits } from './durationMath'
import {
  type InternalCalendar,
  getInternalCalendarId,
} from './externalCalendar'
import { resolveTimeFields } from './fieldConvert'
import {
  allYearFieldNames,
  dateFieldNamesAlpha,
  dateFieldNamesWithEraAlpha,
  dateTimeAndOffsetFieldNamesAlpha,
  dateTimeAndOffsetFieldNamesWithEraAlpha,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesWithEraAlpha,
  eraYearFieldNames,
  monthDayFieldNames,
  monthFieldNames,
  timeFieldNamesAlpha,
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
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { japaneseCalendarId } from './intlCalendarConfig'
import { constrainTimeFields } from './isoMath'
import {
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsFieldRefine'
import { OffsetDisambig } from './optionsModel'
import { OverflowOptions, ZonedFieldOptions } from './optionsModel'
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
import { getMatchingInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { pluckProps } from './utils'

export function mergeCalendarFields(
  calendar: InternalCalendar,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const calendarId = getInternalCalendarId(calendar)
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  const eraOrigins = getCalendarEraOrigins(calendar)

  if (eraOrigins) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // Japanese eras can begin mid-year. When month/day are supplied, era fields
    // from the original object can become stale, so the replacement year path
    // must be resolved without them.
    if (calendarId === japaneseCalendarId) {
      spliceFields(
        merged,
        additionalFields,
        monthDayFieldNames, // any found?
        eraYearFieldNames, // then, delete these
      )
    }
  }

  return merged
}

/*
Splices props with names `allPropNames` from `additional` to `dest`.
If ANY of these props exists on additional, replaces ALL dest with them.
*/
function spliceFields(
  dest: any,
  additional: any,
  allPropNames: string[],
  deletablePropNames?: string[],
): void {
  let anyMatching = false
  const nonMatchingPropNames: string[] = []

  for (const propName of allPropNames) {
    if (additional[propName] !== undefined) {
      anyMatching = true
    } else {
      nonMatchingPropNames.push(propName)
    }
  }

  Object.assign(dest, additional)

  if (anyMatching) {
    for (const deletablePropName of deletablePropNames ||
      nonMatchingPropNames) {
      delete dest[deletablePropName]
    }
  }
}

// High-Level Mod
// -----------------------------------------------------------------------------

export function mergeZonedDateTimeFields(
  calendar: InternalCalendar,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const calendarId = getInternalCalendarId(calendar)
  const { timeZoneId } = zonedDateTimeSlots
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeAndOffsetFieldNamesAlpha,
    dateTimeAndOffsetFieldNamesWithEraAlpha,
  )

  const isoDateTime = zonedEpochSlotsToIso(zonedDateTimeSlots)
  const {
    offsetNanoseconds,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  } = isoDateTime
  // The receiver's slots are projected into the same refined field shape that
  // readAndRefineBagFields() produces for the user's .with() bag below. This
  // keeps calendar merging and later date/time resolution on one representation.
  const { year, month, day } = computeCalendarDateFields(calendar, isoDateTime)
  const origFields = {
    year,
    monthCode: computeMonthCode(calendar, year, month),
    day,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
    // readAndRefineBagFields() refines the public offset string to nanoseconds,
    // so the copied receiver value must use that same internal representation.
    offset: offsetNanoseconds,
  }
  const partialFields = readAndRefineBagFields(
    modFields,
    validFieldNames,
    zonedDateTimeFieldRefiners,
  )
  const mergedCalendarFields = mergeCalendarFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    createPlainDateFromFieldsWithOptionsRefiner(
      calendar,
      mergedCalendarFields as any,
      () => refineZonedFieldOptions(options, OffsetDisambig.Prefer),
    )
  const timeFields = constrainTimeFields(
    pluckProps(timeFieldNamesAlpha, mergedAllFields),
    overflow,
  )

  return createZonedDateTimeSlots(
    getMatchingInstantFor(
      timeZoneImpl,
      combineDateAndTime(isoDateFields, timeFields),
      // Existing fields and user .with() fields are both past the first bag
      // refinement phase, so "offset" is the offset in nanoseconds here.
      mergedAllFields.offset,
      offsetDisambig,
      epochDisambig,
    ),
    timeZoneId,
    calendarId,
  )
}

export function mergePlainDateTimeFields(
  calendar: InternalCalendar,
  plainDateTimeSlots: PlainDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = getInternalCalendarId(calendar)

  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesWithEraAlpha,
  )

  const { year, month, day } = computeCalendarDateFields(
    calendar,
    plainDateTimeSlots,
  )
  const origFields = {
    year,
    monthCode: computeMonthCode(calendar, year, month),
    day,
    hour: plainDateTimeSlots.hour,
    minute: plainDateTimeSlots.minute,
    second: plainDateTimeSlots.second,
    millisecond: plainDateTimeSlots.millisecond,
    microsecond: plainDateTimeSlots.microsecond,
    nanosecond: plainDateTimeSlots.nanosecond,
  }
  const partialFields = readAndRefineBagFields(
    modFields,
    validFieldNames,
    dateTimeFieldRefiners,
  )
  const mergedCalendarFields = mergeCalendarFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [plainDateSlots, overflow] =
    createPlainDateFromFieldsWithOptionsRefiner(
      calendar,
      mergedCalendarFields as any,
      () => [refineOverflowOptions(options)],
    )
  const isoDateFields = plainDateSlots

  const timeFields = constrainTimeFields(
    pluckProps(timeFieldNamesAlpha, mergedAllFields),
    overflow,
  )

  return createPlainDateTimeFromRefinedFields(
    isoDateFields,
    timeFields,
    calendarId,
  )
}

export function mergePlainDateFields(
  calendar: InternalCalendar,
  plainDateSlots: PlainDateSlots,
  modFields: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateSlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )

  const { year, month, day } = computeCalendarDateFields(
    calendar,
    plainDateSlots,
  )
  const origFields = {
    year,
    monthCode: computeMonthCode(calendar, year, month),
    day,
  }
  const partialFields = readAndRefineBagFields(
    modFields,
    validFieldNames,
    dateFieldRefiners,
  )
  const mergedFields = mergeCalendarFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainDateFromFields(calendar, mergedFields as any, options)
}

export function mergePlainYearMonthFields(
  calendar: InternalCalendar,
  plainYearMonthSlots: PlainYearMonthSlots,
  modFields: Partial<YearMonthFields>,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    yearMonthFieldNamesAlpha,
    yearMonthFieldNamesWithEraAlpha,
  )

  const { year, month } = computeCalendarDateFields(
    calendar,
    plainYearMonthSlots,
  )
  const origFields = {
    year,
    monthCode: computeMonthCode(calendar, year, month),
  }
  const partialFields = readAndRefineBagFields(
    modFields,
    validFieldNames,
    dateFieldRefiners,
  )
  const mergedFields = mergeCalendarFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainYearMonthFromFields(calendar, mergedFields as any, options)
}

export function mergePlainMonthDayFields(
  calendar: InternalCalendar,
  plainMonthDaySlots: PlainMonthDaySlots,
  modFields: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )

  const { year, month, day } = computeCalendarDateFields(
    calendar,
    plainMonthDaySlots,
  )
  const origFields = {
    monthCode: computeMonthCode(calendar, year, month),
    day,
  }
  const partialFields = readAndRefineBagFields(
    modFields,
    validFieldNames,
    dateFieldRefiners,
  )
  const mergedFields = mergeCalendarFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainMonthDayFromFields(calendar, mergedFields as any, options)
}

export function mergePlainTimeFields(
  initialFields: TimeFields,
  mod: Partial<TimeFields>,
  options?: OverflowOptions,
): PlainTimeSlots {
  return createPlainTimeSlots(mergePlainTimeBag(initialFields, mod, options))
}

export function mergeDurationFields(
  slots: DurationSlots,
  fields: Partial<DurationFields>,
): DurationSlots {
  return createDurationSlots(mergeDurationBag(slots, fields))
}

// Low-Level Mod ("merging")
// -----------------------------------------------------------------------------

function mergePlainTimeBag(
  initialFields: TimeFields,
  modFields: Partial<TimeFields>,
  options: OverflowOptions | undefined,
): TimeFields {
  const origFields = pluckProps(timeFieldNamesAlpha, initialFields)
  const newFields = readAndRefineBagFields(
    modFields,
    timeFieldNamesAlpha,
    timeFieldRefiners,
  )

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  const mergedFields = { ...origFields, ...newFields }
  return resolveTimeFields(mergedFields, overflow)
}

function mergeDurationBag(
  initialFields: DurationFields,
  modFields: Partial<DurationFields>,
): DurationFields {
  const newFields = readAndRefineBagFields(
    modFields,
    durationFieldNamesAlpha,
    durationFieldRefiners,
  )
  return checkDurationUnits({ ...initialFields, ...newFields })
}

function computeMonthCode(
  calendar: InternalCalendar,
  year: number,
  month: number,
): string {
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}
