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
  mergePlainDateFields,
  mergePlainDateTimeFields,
  mergePlainMonthDayFields,
  mergePlainTimeFields,
  mergePlainYearMonthFields,
  mergeZonedDateTimeFields,
  updatePlainDateTimeFields,
  updateZonedDateTimeFields,
} from '../internal/merge'
import {
  refineOverflowOptions,
  refineZonedFieldOptions,
} from '../internal/optionsFieldRefine'
import { OffsetDisambig } from '../internal/optionsModel'
import { ZonedEpochNanoFields } from '../internal/slots'
import {
  createPlainDateFromRefinedFields,
  createPlainMonthDayFromRefinedFields,
  createPlainYearMonthFromRefinedFields,
  refineCalendarDateFields,
  refinePlainMonthDayFields,
} from '../internal/slotsFromRefinedFields'

export function withPlainDateFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergePlainDateFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refineCalendarDateFields(fields, calendar)
  const overflow = refineOverflowOptions(options)

  return createPlainDateFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

// Implements the shared public PlainDateTime field-update pipeline. Callers
// validate their API-specific bag representation before entering this helper.
export function withPlainDateTimeFields(
  slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const [mergedFields, calendarFields] = mergePlainDateTimeFields(
    calendar,
    slots,
    modFields,
  )
  const [year, monthCodeParts] = refineCalendarDateFields(
    calendarFields,
    calendar,
  )
  const overflow = refineOverflowOptions(options)

  return updatePlainDateTimeFields(
    mergedFields,
    calendarFields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withPlainYearMonthFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<YearMonthFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergePlainYearMonthFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refineCalendarDateFields(
    fields,
    calendar,
    /* allowMissingDay */ true,
  )
  const overflow = refineOverflowOptions(options)

  return createPlainYearMonthFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withPlainMonthDayFields(
  slots: CalendarDateFields & { calendar: CalendarImpl },
  modFields: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const fields = mergePlainMonthDayFields(calendar, slots, modFields)
  const [year, monthCodeParts] = refinePlainMonthDayFields(fields, calendar)
  const overflow = refineOverflowOptions(options)

  return createPlainMonthDayFromRefinedFields(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
}

export function withPlainTimeFields(
  slots: TimeFields,
  modFields: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): TimeFields {
  const refinedFields = mergePlainTimeFields(slots, modFields)
  const overflow = refineOverflowOptions(options)
  return resolveTimeFields(refinedFields, overflow)
}

export function withZonedDateTimeFields(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  modFields: Partial<DateTimeFields>,
  options?: Temporal.ZonedDateTimeFromOptions,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { calendar } = slots
  const [calendarFields, mergedFields] = mergeZonedDateTimeFields(
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

  return updateZonedDateTimeFields(
    slots,
    calendarFields,
    mergedFields,
    year,
    monthCodeParts,
    overflow,
    offsetDisambig,
    epochDisambig,
  )
}
