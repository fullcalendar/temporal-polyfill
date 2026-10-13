import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import { resolveTimeFields } from '../internal/fieldConvert'
import type {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateFields,
  DateTimeFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from '../internal/fieldTypes'
import {
  createDateTimeFromMergedFields,
  createZonedDateTimeFromMergedFields,
  mergeDateFields,
  mergeDateTimeFields,
  mergeMonthDayFields,
  mergeTimeFields,
  mergeYearMonthFields,
  mergeZonedDateTimeFields,
} from '../internal/merge'
import {
  refineOverflowOptions,
  refineZonedFieldOptions,
} from '../internal/optionsFieldRefine'
import { OffsetDisambig } from '../internal/optionsModel'
import { ZonedEpochNanoFields } from '../internal/slots'
import {
  createDateFromRefinedFields,
  createMonthDayFromRefinedFields,
  createYearMonthFromRefinedFields,
  refineCalendarDateFields,
  refineMonthDayFields,
} from '../internal/slotsFromRefinedFields'

export function withDateFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergeDateFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refineCalendarDateFields(fields, calendar)
  const overflow = refineOverflowOptions(options)

  return createDateFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

// Implements the shared public PlainDateTime field-update pipeline. Callers
// validate their API-specific bag representation before entering this helper.
export function withDateTimeFields(
  slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const [mergedFields, calendarFields] = mergeDateTimeFields(
    calendar,
    slots,
    modFields,
  )
  const [year, monthCodeParts] = refineCalendarDateFields(
    calendarFields,
    calendar,
  )
  const overflow = refineOverflowOptions(options)

  return createDateTimeFromMergedFields(
    mergedFields,
    calendarFields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withYearMonthFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<YearMonthFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergeYearMonthFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refineCalendarDateFields(
    fields,
    calendar,
    /* allowMissingDay */ true,
  )
  const overflow = refineOverflowOptions(options)

  return createYearMonthFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withMonthDayFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergeMonthDayFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refineMonthDayFields(fields, calendar)
  const overflow = refineOverflowOptions(options)

  return createMonthDayFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withTimeFields(
  slots: TimeFields,
  modFields: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): TimeFields {
  const refinedFields = mergeTimeFields(slots, modFields)
  const overflow = refineOverflowOptions(options)
  return resolveTimeFields(refinedFields, overflow)
}

export function withZonedDateTimeFields(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
  options?: Temporal.ZonedDateTimeFromOptions,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const [mergedFields, calendarFields] = mergeZonedDateTimeFields(
    calendar,
    slots,
    modFields,
  )
  const [year, monthCodeParts] = refineCalendarDateFields(
    calendarFields,
    calendar,
  )
  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(
    options,
    OffsetDisambig.Prefer,
  )

  return createZonedDateTimeFromMergedFields(
    slots,
    mergedFields,
    calendarFields,
    year,
    monthCodeParts,
    overflow,
    offsetDisambig,
    epochDisambig,
  )
}
