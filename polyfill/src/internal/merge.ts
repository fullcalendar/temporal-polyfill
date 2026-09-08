import {
  computeCalendarDateFields,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import { getCalendarEraOrigins, getCalendarFieldNames } from './calendarFields'
import { type CalendarImpl } from './calendarImpl'
import { type MonthCodeParts, formatMonthCode } from './calendarMonthCode'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { validateDurationFields } from './durationMath'
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
  CalendarDateFields,
  CalendarDateTimeFields,
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { EpochDisambig, OffsetDisambig, Overflow } from './optionsModel'
import {
  ZonedEpochNanoFields,
  createDurationSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  createPlainDateFromRefinedFields,
  createPlainDateTimeFromRefinedFields,
} from './slotsFromRefinedFields'
import { constrainTimeFields } from './timeFieldMath'
import { getMatchingInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { NumberSign, pluckProps } from './utils'

export function mergeCalendarFields(
  calendar: CalendarImpl,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  const eraOrigins = getCalendarEraOrigins(calendar)

  if (eraOrigins) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // Some external era systems can begin mid-year. When month/day are
    // supplied, era fields from the original object can become stale, so the
    // replacement year path must be resolved without them.
    if (calendar && calendar.erasBeginMidYear) {
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

// Field updates have explicit refinement and completion phases. Field
// refinement happens first; the API layer then refines options before
// completion performs the overflow-dependent calendar or time resolution.

export function updateZonedDateTimeFields(
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  calendarFields: Partial<DateFields>,
  mergedAllFields: DateTimeFields & { offset: number | undefined },
  year: number,
  monthCodeParts: MonthCodeParts | undefined,
  overflow: Overflow,
  offsetDisambig: OffsetDisambig,
  epochDisambig: EpochDisambig,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { calendar, timeZone } = zonedDateTimeSlots
  const isoDateFields = createPlainDateFromRefinedFields(
    calendarFields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
  const timeFields = constrainTimeFields(mergedAllFields, overflow)

  return createZonedEpochNanoSlots(
    getMatchingInstantFor(
      timeZone,
      combineDateAndTime(isoDateFields, timeFields),
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

type MergedZonedDateTimeFields = [
  calendarFields: Partial<DateFields>,
  mergedFields: DateTimeFields & { offset: number | undefined },
]

export function mergeZonedDateTimeFields(
  calendar: CalendarImpl,
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
): MergedZonedDateTimeFields {
  const validFieldNames = getCalendarFieldNames(
    calendar,
    dateTimeAndOffsetFieldNamesAlpha,
    dateTimeAndOffsetFieldNamesWithEraAlpha,
  )

  const zonedSlots = zonedEpochSlotsToIso(zonedDateTimeSlots)

  // The receiver's slots are projected into the same refined field shape that
  // readAndRefineBagFields() produces for the user's .with() bag below. This
  // keeps calendar merging and later date/time resolution on one representation.
  const { year, month, day } = computeCalendarDateFields(calendar, zonedSlots)
  const origFields = {
    year,
    monthCode: computeMonthCode(calendar, year, month),
    day,
    hour: zonedSlots.hour,
    minute: zonedSlots.minute,
    second: zonedSlots.second,
    millisecond: zonedSlots.millisecond,
    microsecond: zonedSlots.microsecond,
    nanosecond: zonedSlots.nanosecond,
    // readAndRefineBagFields() refines the public offset string to nanoseconds,
    // so the copied receiver value must use that same internal representation.
    offset: zonedSlots.offsetNanoseconds,
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

  return [
    mergedCalendarFields as Partial<DateFields>,
    mergedAllFields as DateTimeFields & { offset: number | undefined },
  ]
}

export function updatePlainDateTimeFields(
  mergedAllFields: DateTimeFields,
  calendarFields: Partial<DateFields>,
  calendar: CalendarImpl,
  year: number,
  monthCodeParts: MonthCodeParts | undefined,
  overflow: Overflow,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const plainDateSlots = createPlainDateFromRefinedFields(
    calendarFields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )

  return createPlainDateTimeFromRefinedFields(
    plainDateSlots,
    constrainTimeFields(mergedAllFields, overflow),
    calendar,
  )
}

type MergedPlainDateTimeFields = [
  mergedFields: DateTimeFields,
  calendarFields: Partial<DateFields>,
]

export function mergePlainDateTimeFields(
  calendar: CalendarImpl,
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
): MergedPlainDateTimeFields {
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

  return [
    mergedAllFields as DateTimeFields,
    mergedCalendarFields as Partial<DateFields>,
  ]
}

export function mergePlainDateFields(
  calendar: CalendarImpl,
  plainDateSlots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<DateFields>,
): Partial<DateFields> {
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

  return mergedFields as Partial<DateFields>
}

export function mergePlainYearMonthFields(
  calendar: CalendarImpl,
  plainYearMonthSlots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<YearMonthFields>,
): Partial<YearMonthFields> {
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

  return mergedFields as Partial<YearMonthFields>
}

export function mergePlainMonthDayFields(
  calendar: CalendarImpl,
  plainMonthDaySlots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<MonthDayFields>,
): Partial<DateFields> & { day: number } {
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

  return mergedFields as Partial<DateFields> & { day: number }
}

export function mergeDurationFields(
  slots: DurationFields,
  fields: Partial<DurationFields>,
): DurationFields & { sign: NumberSign } {
  return createDurationSlots(mergeDurationBag(slots, fields))
}

// Low-Level Mod ("merging")
// -----------------------------------------------------------------------------

export function mergePlainTimeFields(
  initialFields: TimeFields,
  modFields: Partial<TimeFields>,
): Partial<TimeFields> {
  const origFields = pluckProps(timeFieldNamesAlpha, initialFields)
  const newFields = readAndRefineBagFields(
    modFields,
    timeFieldNamesAlpha,
    timeFieldRefiners,
  )

  return { ...origFields, ...newFields }
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
  return validateDurationFields({ ...initialFields, ...newFields })
}

function computeMonthCode(
  calendar: CalendarImpl,
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
