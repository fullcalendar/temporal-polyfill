import { getCalendarFieldNames, mergeCalendarFields } from './bagCalendarFields'
import {
  computeDateEssentials,
  computeDateTimeEssentials,
  computeMonthDayEssentials,
  computeYearMonthEssentials,
  computeZonedDateTimeEssentials,
} from './bagEssentials'
import { readBagFields } from './bagFields'
import {
  dateFromFields,
  monthDayFromFields,
  resolveDateFromFields,
  yearMonthFromFields,
} from './bagFromFields'
import { timeFieldsToIso } from './bagRefineConfig'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { checkDurationUnits } from './durationMath'
import {
  DateBag,
  DateTimeBag,
  DurationBag,
  MonthDayBag,
  TimeBag,
  TimeFields,
  YearMonthBag,
  dateFieldNamesAlpha,
  timeAndOffsetFieldNames,
  timeFieldDefaults,
  timeFieldNamesAlpha,
  timeFieldNamesAsc,
  yearMonthFieldNames,
} from './fields'
import { IsoTimeFields } from './isoFields'
import { constrainIsoTimeFields } from './isoMath'
import { parseOffsetNano } from './offsetParse'
import { OffsetDisambig, Overflow } from './optionsModel'
import {
  OverflowOptions,
  ZonedFieldOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsRefine'
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
import { pluckProps } from './utils'

// High-Level Mod
// -----------------------------------------------------------------------------

export function zonedDateTimeWithFields(
  zonedDateTimeSlots: ZonedDateTimeSlots,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const { calendar, timeZone } = zonedDateTimeSlots
  const nativeTimeZone = queryNativeTimeZone(timeZone)

  const validFieldNames = [
    ...getCalendarFieldNames(calendar, dateFieldNamesAlpha),
    ...timeAndOffsetFieldNames,
  ].sort()

  const origFields = computeZonedDateTimeEssentials(zonedDateTimeSlots)
  const partialFields = readBagFields(modFields, validFieldNames)
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
    resolveDateFromFields(calendar, mergedCalendarFields as any, () =>
      refineZonedFieldOptions(options, OffsetDisambig.Prefer),
    )
  const isoTimeFields = constrainIsoTimeFields(
    timeFieldsToIso(mergedAllFields),
    overflow,
  )

  return createZonedDateTimeSlots(
    getMatchingInstantFor(
      nativeTimeZone,
      { ...isoDateFields, ...isoTimeFields },
      parseOffsetNano(mergedAllFields.offset),
      offsetDisambig,
      epochDisambig,
    ),
    timeZone,
    calendar,
  )
}

export function plainDateTimeWithFields(
  plainDateTimeSlots: PlainDateTimeSlots,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = plainDateTimeSlots.calendar

  const validFieldNames = [
    ...getCalendarFieldNames(calendarId, dateFieldNamesAlpha),
    ...timeFieldNamesAsc,
  ].sort()

  const origFields = computeDateTimeEssentials(plainDateTimeSlots)
  const partialFields = readBagFields(modFields, validFieldNames)
  const mergedCalendarFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [isoDateFields, overflow] = resolveDateFromFields(
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

export function plainDateWithFields(
  plainDateSlots: PlainDateSlots,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  const calendarId = plainDateSlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
  ).sort()

  const origFields = computeDateEssentials(plainDateSlots)
  const partialFields = readBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return dateFromFields(calendarId, mergedFields as any, options)
}

export function plainYearMonthWithFields(
  plainYearMonthSlots: PlainYearMonthSlots,
  modFields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const calendarId = plainYearMonthSlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthFieldNames,
  ).sort()

  const origFields = computeYearMonthEssentials(plainYearMonthSlots)
  const partialFields = readBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return yearMonthFromFields(calendarId, mergedFields as any, options)
}

export function plainMonthDayWithFields(
  plainMonthDaySlots: PlainMonthDaySlots,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const calendarId = plainMonthDaySlots.calendar
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    dateFieldNamesAlpha,
  ).sort()

  const origFields = computeMonthDayEssentials(plainMonthDaySlots)
  const partialFields = readBagFields(modFields, validFieldNames)
  const mergedFields = mergeCalendarFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return monthDayFromFields(calendarId, mergedFields as any, options)
}

export function plainTimeWithFields(
  initialFields: TimeFields,
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return createPlainTimeSlots(mergePlainTimeBag(initialFields, mod, options))
}

export function durationWithFields(
  slots: DurationSlots,
  fields: DurationBag,
): DurationSlots {
  return createDurationSlots(mergeDurationBag(slots, fields))
}

// Low-Level Mod ("merging")
// -----------------------------------------------------------------------------

function mergePlainTimeBag(
  initialFields: TimeFields,
  modFields: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const origFields = pluckProps(timeFieldNamesAlpha, initialFields)
  const newFields = readBagFields(modFields, timeFieldNamesAlpha)

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  const mergedFields = { ...origFields, ...newFields }
  return resolveTimeFields(mergedFields, overflow)
}

function mergeDurationBag(
  initialFields: DurationFields,
  modFields: DurationBag,
): DurationFields {
  const newFields = readBagFields(modFields, durationFieldNamesAlpha)
  return checkDurationUnits({ ...initialFields, ...newFields })
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
