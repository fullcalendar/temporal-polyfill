import { getCalendarFieldNames } from './calendarFields'
import { getCalendarEraOrigins } from './calendarQuery'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { resolveTimeFields } from './fieldConvert'
import {
  allYearFieldNamesAsc,
  dateFieldNamesAlpha,
  dateFieldNamesWithEraAlpha,
  dateTimeAndOffsetFieldNamesAlpha,
  dateTimeAndOffsetFieldNamesWithEraAlpha,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesWithEraAlpha,
  eraYearFieldNamesAsc,
  monthDayFieldNamesAsc,
  monthFieldNamesAsc,
  timeFieldNamesAlpha,
  yearMonthFieldNamesAsc,
  yearMonthFieldNamesWithEraAsc,
} from './fieldNames'
import { readAndRefineBagFields } from './fieldRefine'
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
import {
  computeDateEssentials,
  computeDateTimeEssentials,
  computeMonthDayEssentials,
  computeYearMonthEssentials,
  computeZonedDateTimeEssentials,
} from './slotsToRefinedFields'
import { queryTimeZone } from './timeZoneImpl'
import { getMatchingInstantFor } from './timeZoneMath'
import { pluckProps } from './utils'

export function mergeCalendarFields(
  calendarId: string,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNamesAsc)

  if (getCalendarEraOrigins(calendarId)) {
    spliceFields(merged, additionalFields, allYearFieldNamesAsc)

    // Japanese eras can begin mid-year. When month/day are supplied, era fields
    // from the original object can become stale, so the replacement year path
    // must be resolved without them.
    if (calendarId === japaneseCalendarId) {
      spliceFields(
        merged,
        additionalFields,
        monthDayFieldNamesAsc, // any found?
        eraYearFieldNamesAsc, // then, delete these
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
  zonedDateTimeSlots: ZonedDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const { calendarId, timeZoneId } = zonedDateTimeSlots
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeAndOffsetFieldNamesAlpha,
    dateTimeAndOffsetFieldNamesWithEraAlpha,
  )

  const origFields = computeZonedDateTimeEssentials(zonedDateTimeSlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
  const mergedCalendarFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    createPlainDateFromFieldsWithOptionsRefiner(
      calendarId,
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
  plainDateTimeSlots: PlainDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = plainDateTimeSlots.calendarId

  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesWithEraAlpha,
  )

  const origFields = computeDateTimeEssentials(plainDateTimeSlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
  const mergedCalendarFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [plainDateSlots, overflow] =
    createPlainDateFromFieldsWithOptionsRefiner(
      calendarId,
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
  plainDateSlots: PlainDateSlots,
  modFields: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateSlots {
  const calendarId = plainDateSlots.calendarId
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )

  const origFields = computeDateEssentials(plainDateSlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainDateFromFields(calendarId, mergedFields as any, options)
}

export function mergePlainYearMonthFields(
  plainYearMonthSlots: PlainYearMonthSlots,
  modFields: Partial<YearMonthFields>,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const calendarId = plainYearMonthSlots.calendarId
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthFieldNamesAsc,
    yearMonthFieldNamesWithEraAsc,
  )

  const origFields = computeYearMonthEssentials(plainYearMonthSlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainYearMonthFromFields(
    calendarId,
    mergedFields as any,
    options,
  )
}

export function mergePlainMonthDayFields(
  plainMonthDaySlots: PlainMonthDaySlots,
  modFields: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const calendarId = plainMonthDaySlots.calendarId
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesWithEraAlpha,
  )

  const origFields = computeMonthDayEssentials(plainMonthDaySlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return createPlainMonthDayFromFields(calendarId, mergedFields as any, options)
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
  const newFields = readAndRefineBagFields(modFields, timeFieldNamesAlpha)

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  const mergedFields = { ...origFields, ...newFields }
  return resolveTimeFields(mergedFields, overflow)
}

function mergeDurationBag(
  initialFields: DurationFields,
  modFields: Partial<DurationFields>,
): DurationFields {
  const newFields = readAndRefineBagFields(modFields, durationFieldNamesAlpha)
  return checkDurationUnits({ ...initialFields, ...newFields })
}
