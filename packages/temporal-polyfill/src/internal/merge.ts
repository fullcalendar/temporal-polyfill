import { getCalendarFieldNames } from './calendarFields'
import { getCalendarEraOrigins } from './calendarQuery'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { checkDurationUnits } from './durationMath'
import { resolveTimeFields, timeFieldsToIso } from './fieldConvert'
import {
  allYearFieldNames,
  dateFieldNamesAlpha,
  dateFieldNamesAlphaWithEra,
  dateTimeAndOffsetFieldNamesAlpha,
  dateTimeAndOffsetFieldNamesAlphaWithEra,
  dateTimeFieldNamesAlpha,
  dateTimeFieldNamesAlphaWithEra,
  eraYearFieldNames,
  monthDayFieldNames,
  monthFieldNames,
  timeFieldNamesAlpha,
  yearMonthFieldNames,
  yearMonthFieldNamesWithEra,
} from './fieldNames'
import { readAndRefineBagFields } from './fieldRefine'
import {
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { japaneseCalendarId } from './intlCalendarConfig'
import { IsoTimeFields } from './isoFields'
import { constrainIsoTimeFields } from './isoMath'
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
import {
  computeDateEssentials,
  computeDateTimeEssentials,
  computeMonthDayEssentials,
  computeYearMonthEssentials,
  computeZonedDateTimeEssentials,
} from './slotsToRefinedFields'
import { checkIsoDateTimeInBounds } from './timeMath'
import { queryTimeZone } from './timeZoneImpl'
import { getMatchingInstantFor } from './timeZoneMath'
import { pluckProps } from './utils'

export function mergeCalendarFields(
  calendarId: string,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins(calendarId)) {
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
  zonedDateTimeSlots: ZonedDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const { calendar, timeZone } = zonedDateTimeSlots
  const timeZoneImpl = queryTimeZone(timeZone)

  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeAndOffsetFieldNamesAlpha,
    dateTimeAndOffsetFieldNamesAlphaWithEra,
  )

  const origFields = computeZonedDateTimeEssentials(zonedDateTimeSlots)
  const partialFields = readAndRefineBagFields(modFields, validFieldNames)
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
  const isoTimeFields = constrainIsoTimeFields(
    timeFieldsToIso(mergedAllFields),
    overflow,
  )

  return createZonedDateTimeSlots(
    getMatchingInstantFor(
      timeZoneImpl,
      { ...isoDateFields, ...isoTimeFields },
      // Existing fields and user .with() fields are both past the first bag
      // refinement phase, so "offset" is the offset in nanoseconds here.
      mergedAllFields.offset,
      offsetDisambig,
      epochDisambig,
    ),
    timeZone,
    calendar,
  )
}

export function mergePlainDateTimeFields(
  plainDateTimeSlots: PlainDateTimeSlots,
  modFields: Partial<DateTimeFields>,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = plainDateTimeSlots.calendar

  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateTimeFieldNamesAlpha,
    dateTimeFieldNamesAlphaWithEra,
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

  const [isoDateFields, overflow] = createPlainDateFromFieldsWithOptionsRefiner(
    calendarId,
    mergedCalendarFields as any,
    () => [refineOverflowOptions(options)],
  )

  const isoTimeFields = constrainIsoTimeFields(
    timeFieldsToIso(mergedAllFields),
    overflow,
  )

  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...isoDateFields,
      ...isoTimeFields,
    }),
  )
}

export function mergePlainDateFields(
  plainDateSlots: PlainDateSlots,
  modFields: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateSlots {
  const calendarId = plainDateSlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
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
  const calendarId = plainYearMonthSlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthFieldNames,
    yearMonthFieldNamesWithEra,
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
  const calendarId = plainMonthDaySlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
    dateFieldNamesAlphaWithEra,
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
): IsoTimeFields {
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
