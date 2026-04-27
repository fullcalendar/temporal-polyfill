import {
  eraRemapsByCalendarId,
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import {
  eraYearToYear,
  formatMonthCode,
  getCalendarEraOrigins,
  getCalendarLeapMonthMeta,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
  parseMonthCode,
} from './calendarNative'
import {
  queryNativeDateParts,
  queryNativeMonthCodeParts,
  queryNativeDaysInMonthPart,
  queryNativeIsoFieldsFromParts,
  queryNativeLeapMonth,
  queryNativeMonthsInYearPart,
  queryNativeYearMonthForMonthDay,
} from './calendarNativeQuery'
import {
  requireObjectLike,
  toInteger,
  toPositiveInteger,
  toStrictInteger,
  toStringViaPrimitive,
} from './cast'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAlpha,
  durationFieldNamesAsc,
} from './durationFields'
import { checkDurationUnits } from './durationMath'
import * as errorMessages from './errorMessages'
import {
  DateBag,
  DateTimeBag,
  DayFields,
  DurationBag,
  EraYearOrYear,
  MonthDayBag,
  MonthFields,
  TimeBag,
  TimeFields,
  YearMonthBag,
  YearMonthFields,
  allYearFieldNames,
  dateFieldNamesAlpha,
  dayFieldNames,
  eraYearFieldNames,
  monthCodeDayFieldNames,
  monthDayFieldNames,
  monthFieldNames,
  timeAndOffsetFieldNames,
  timeAndZoneFieldNames,
  timeFieldDefaults,
  timeFieldNamesAlpha,
  timeFieldNamesAsc,
  timeZoneFieldNames,
  yearFieldNames,
  yearMonthCodeFieldNames,
  yearMonthFieldNames,
} from './fields'
import {
  IsoTimeFields,
  isoTimeFieldDefaults,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { formatOffsetNano } from './isoFormat'
import { constrainIsoTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { parseOffsetNano } from './isoParse'
import { RelativeToSlotsNoCalendar } from './markerSystem'
import { OffsetDisambig, Overflow } from './options'
import {
  OverflowOptions,
  ZonedFieldOptions,
  fabricateOverflowOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsRefine'
import {
  DateSlots,
  DateTimeSlots,
  DurationSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createDurationSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainMonthDaySlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import {
  TimeZoneOps,
  getMatchingInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
import {
  Callable,
  bindArgs,
  clampEntity,
  clampNumber,
  clampProp,
  mapPropNamesToConstant,
  pluckProps,
  remapProps,
} from './utils'

export type PlainDateBag = DateBag & { calendar?: string }
export type PlainDateTimeBag = DateBag & TimeBag & { calendar?: string }
export type ZonedDateTimeBag = PlainDateTimeBag & {
  timeZone: string
  offset?: string
}
export type PlainTimeBag = TimeBag
export type PlainYearMonthBag = YearMonthBag & { calendar?: string }
export type PlainMonthDayBag = MonthDayBag & { calendar?: string }

// Config
// -----------------------------------------------------------------------------

const dateFieldRefiners = {
  era: toStringViaPrimitive,
  eraYear: toInteger,
  year: toInteger,
  month: toPositiveInteger,
  monthCode(monthCode: string) {
    const s = toStringViaPrimitive(monthCode)
    // HACK to validate ASAP. will need to parse again later!!!
    parseMonthCode(s)
    return s
  },
  day: toPositiveInteger,
}

const timeFieldRefiners = mapPropNamesToConstant(timeFieldNamesAsc, toInteger)

const durationFieldRefiners = mapPropNamesToConstant(
  durationFieldNamesAsc,
  toStrictInteger,
)

// HACK for pureTopLevel
const buildinOffsetRefiners = {
  offset(offsetString: string) {
    const s = toStringViaPrimitive(offsetString)
    // HACK to validate ASAP. will need to parse again later!!!
    parseOffsetNano(s)
    return s
  },
}
//
const builtinRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  ...buildinOffsetRefiners,
}

// High-Level Refining
// -----------------------------------------------------------------------------

export function refineMaybeNativeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  calendarId: string,
  bag: ZonedDateTimeBag,
): RelativeToSlotsNoCalendar {
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    [],
    timeAndZoneFieldNames,
  ) as ZonedDateTimeBag

  if (fields.timeZone !== undefined) {
    const isoDateFields = nativeDateFromFields(calendarId, fields as any)
    const isoTimeFields = refineTimeBag(fields)

    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const timeZoneOps = getTimeZoneOps(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneOps,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    )

    return { epochNanoseconds, timeZone: timeZoneId }
  }

  const isoDateInternals = nativeDateFromFields(calendarId, fields as any)
  return { ...isoDateInternals, ...isoTimeFieldDefaults }
}

export function refineNativeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  calendarId: string,
  bag: ZonedDateTimeBag,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots {
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    timeZoneFieldNames,
    timeAndZoneFieldNames,
  ) as ZonedDateTimeBag

  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [overflow, offsetDisambig, epochDisambig] =
    refineZonedFieldOptions(options)
  const isoDateFields = nativeDateFromFields(
    calendarId,
    fields as any,
    fabricateOverflowOptions(overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)
  const timeZoneOps = getTimeZoneOps(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    { ...isoDateFields, ...isoTimeFields },
    fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
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
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    [],
    timeFieldNamesAsc,
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = nativeDateFromFields(
    calendarId,
    fields as any,
    fabricateOverflowOptions(overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

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
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    requireFields,
  )

  return nativeDateFromFields(calendarId, fields as any, options)
}

export function refineNativePlainYearMonthBag(
  calendarId: string,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots {
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return nativeYearMonthFromFields(calendarId, fields as any, options)
}

export function refineNativePlainMonthDayBag(
  calendarId: string,
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    dayFieldNames,
  ) as DateBag

  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = isoEpochFirstLeapYear
  }

  return nativeMonthDayFromFields(calendarId, fields, options)
}

export function refinePlainTimeBag(
  bag: TimeBag,
  options?: OverflowOptions, // optional b/c func API can use directly
): PlainTimeSlots {
  // disallowEmpty
  const fields = refineFields(bag, timeFieldNamesAlpha, [], true) as TimeBag

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  return createPlainTimeSlots(refineTimeBag(fields, overflow))
}

export function refineDurationBag(bag: DurationBag): DurationSlots {
  // refine in 'partial' mode
  const durationFields = refineFields(
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

// Low-level Refining
// -----------------------------------------------------------------------------

function refineNativeCalendarFields(
  calendarId: string,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [],
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...nativeFieldsMethod(calendarId, validFieldNames),
    ...forcedValidFieldNames,
  ].sort()

  return refineFields(bag, fieldNames, requiredFieldNames)
}

/*
If `requiredFieldNames` is undefined, assume 'partial' mode where defaults
don't apply
*/
function refineFields(
  bag: Record<string, unknown>,
  validFieldNames: string[], // must be alphabetized!!!
  requiredFieldNames?: string[],
  disallowEmpty = !requiredFieldNames,
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let anyMatching = false
  let prevFieldName: undefined | string

  for (const fieldName of validFieldNames) {
    if (fieldName === prevFieldName) {
      throw new RangeError(errorMessages.duplicateFields(fieldName))
    }
    if (fieldName === 'constructor' || fieldName === '__proto__') {
      throw new RangeError(errorMessages.forbiddenField(fieldName))
    }

    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      anyMatching = true

      if (builtinRefiners[fieldName as keyof typeof builtinRefiners]) {
        fieldVal = (
          builtinRefiners[fieldName as keyof typeof builtinRefiners] as Callable
        )(fieldVal, fieldName)
      }

      res[fieldName] = fieldVal
    } else if (requiredFieldNames) {
      if (requiredFieldNames.includes(fieldName)) {
        // TODO: have caller use a Set
        throw new TypeError(errorMessages.missingField(fieldName))
      }

      res[fieldName] =
        timeFieldDefaults[fieldName as keyof typeof timeFieldDefaults]
    }

    prevFieldName = fieldName
  }

  // only check zero fields during .with() calls
  // for .from() calls, empty-bag-checking will happen within the CalendarImpl
  if (disallowEmpty && !anyMatching) {
    throw new TypeError(errorMessages.noValidFields(validFieldNames))
  }

  return res
}

/*
TODO: use for merging utils too?
*/
function refineTimeBag(fields: TimeBag, overflow?: Overflow): IsoTimeFields {
  return constrainIsoTimeFields(
    timeFieldsToIso({ ...timeFieldDefaults, ...fields }),
    overflow,
  )
}

const timeFieldsToIso = bindArgs(
  remapProps<TimeFields, IsoTimeFields>,
  timeFieldNamesAsc,
  isoTimeFieldNamesAsc,
)

export const isoTimeFieldsToCal = bindArgs(
  remapProps<IsoTimeFields, TimeFields>,
  isoTimeFieldNamesAsc,
  timeFieldNamesAsc,
)

// High-Level Mod
// -----------------------------------------------------------------------------

export function nativeZonedDateTimeWithFields(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const { calendar, timeZone } = zonedDateTimeSlots
  const timeZoneOps = getTimeZoneOps(timeZone)

  const validFieldNames = [
    ...nativeFieldsMethod(calendar, dateFieldNamesAlpha),
    ...timeAndOffsetFieldNames,
  ].sort()

  const origFields = computeZonedDateTimeEssentials(zonedDateTimeSlots)
  const partialFields = refineFields(modFields, validFieldNames)
  const mergedCalendarFields = nativeMergeFields(
    calendar,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(
    options,
    OffsetDisambig.Prefer,
  )
  const isoDateFields = nativeDateFromFields(
    calendar,
    mergedCalendarFields as any,
    fabricateOverflowOptions(overflow),
  )
  const isoTimeFields = constrainIsoTimeFields(
    timeFieldsToIso(mergedAllFields),
    overflow,
  )

  return createZonedDateTimeSlots(
    getMatchingInstantFor(
      timeZoneOps,
      { ...isoDateFields, ...isoTimeFields },
      parseOffsetNano(mergedAllFields.offset),
      offsetDisambig,
      epochDisambig,
    ),
    timeZone,
    calendar,
  )
}

export function nativePlainDateTimeWithFields(
  plainDateTimeSlots: PlainDateTimeSlots,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = plainDateTimeSlots.calendar

  const validFieldNames = [
    ...nativeFieldsMethod(calendarId, dateFieldNamesAlpha),
    ...timeFieldNamesAsc,
  ].sort()

  const origFields = computeDateTimeEssentials(plainDateTimeSlots)
  const partialFields = refineFields(modFields, validFieldNames)
  const overflow = refineOverflowOptions(options)

  const mergedCalendarFields = nativeMergeFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )
  const mergedAllFields = {
    ...origFields,
    ...partialFields,
  }

  const isoDateFields = nativeDateFromFields(
    calendarId,
    mergedCalendarFields as any,
    fabricateOverflowOptions(overflow),
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

export function nativePlainDateWithFields(
  plainDateSlots: PlainDateSlots,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  const calendarId = plainDateSlots.calendar
  const validFieldNames = nativeFieldsMethod(calendarId, dateFieldNamesAlpha).sort()

  const origFields = computeDateEssentials(plainDateSlots)
  const partialFields = refineFields(modFields, validFieldNames)
  const mergedFields = nativeMergeFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return nativeDateFromFields(calendarId, mergedFields as any, options)
}

export function nativePlainYearMonthWithFields(
  plainYearMonthSlots: PlainYearMonthSlots,
  modFields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const calendarId = plainYearMonthSlots.calendar
  const validFieldNames = nativeFieldsMethod(calendarId, yearMonthFieldNames).sort()

  const origFields = computeYearMonthEssentials(plainYearMonthSlots)
  const partialFields = refineFields(modFields, validFieldNames)
  const mergedFields = nativeMergeFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return nativeYearMonthFromFields(calendarId, mergedFields as any, options)
}

export function nativePlainMonthDayWithFields(
  plainMonthDaySlots: PlainMonthDaySlots,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const calendarId = plainMonthDaySlots.calendar
  const validFieldNames = nativeFieldsMethod(calendarId, dateFieldNamesAlpha).sort()

  const origFields = computeMonthDayEssentials(plainMonthDaySlots)
  const partialFields = refineFields(modFields, validFieldNames)
  const mergedFields = nativeMergeFields(
    calendarId,
    origFields as unknown as Record<string, unknown>,
    partialFields,
  )

  return nativeMonthDayFromFields(calendarId, mergedFields as any, options)
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
  const newFields = refineFields(modFields, timeFieldNamesAlpha)

  // spec says overflow parsed after fields
  const overflow = refineOverflowOptions(options)

  const mergedFields = { ...origFields, ...newFields }
  return refineTimeBag(mergedFields, overflow)
}

function mergeDurationBag(
  initialFields: DurationFields,
  modFields: DurationBag,
): DurationFields {
  const newFields = refineFields(modFields, durationFieldNamesAlpha)
  return checkDurationUnits({ ...initialFields, ...newFields })
}

// Conversion that involves bags
// -----------------------------------------------------------------------------

export function convertNativeToPlainMonthDay(
  calendarId: string,
  input: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const fields = refineNativeCalendarFields(
    calendarId,
    input,
    monthCodeDayFieldNames,
  )
  return nativeMonthDayFromFields(calendarId, fields as DateBag)
}

export function convertNativeToPlainYearMonth(
  calendarId: string,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const fields = refineNativeCalendarFields(
    calendarId,
    input,
    yearMonthCodeFieldNames,
  )
  return nativeYearMonthFromFields(
    calendarId,
    fields as YearMonthBag,
    options,
  )
}

export function convertNativePlainMonthDayToDate(
  calendarId: string,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
  return convertToNativeIso(
    calendarId,
    input,
    monthCodeDayFieldNames,
    requireObjectLike(bag),
    yearFieldNames,
  )
}

export function convertNativePlainYearMonthToDate(
  calendarId: string,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  return convertToNativeIso(
    calendarId,
    input,
    yearMonthCodeFieldNames,
    requireObjectLike(bag),
    dayFieldNames,
  )
}

function convertToNativeIso(
  calendarId: string,
  input: any,
  inputFieldNames: string[],
  extra: any,
  extraFieldNames: string[],
): PlainDateSlots {
  inputFieldNames = nativeFieldsMethod(calendarId, inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = nativeFieldsMethod(calendarId, extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = nativeMergeFields(calendarId, input, extra)
  mergedFields = refineFields(
    mergedFields,
    [...inputFieldNames, ...extraFieldNames].sort(),
    [],
  )

  return nativeDateFromFields(calendarId, mergedFields as any)
}

// Native *-from-fields
// -----------------------------------------------------------------------------

export function nativeDateFromFields(
  calendarId: string,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(calendarId, fields)
  const month = refineMonth(calendarId, fields, year, overflow)
  const day = refineDay(
    calendarId,
    fields as DayFields,
    month,
    year,
    overflow,
  )
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, day)

  return createPlainDateSlots(
    checkIsoDateInBounds(isoFields),
    calendarId,
  )
}

export function nativeYearMonthFromFields(
  calendarId: string,
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(calendarId, fields)
  const month = refineMonth(calendarId, fields, year, overflow)
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, 1)

  return createPlainYearMonthSlots(
    checkIsoYearMonthInBounds(isoFields),
    calendarId,
  )
}

export function nativeMonthDayFromFields(
  calendarId: string,
  fields: DateBag, // guaranteed `day`
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const overflow = refineOverflowOptions(options)
  let yearMaybe =
    fields.eraYear !== undefined || fields.year !== undefined // HACK
      ? refineYear(calendarId, fields)
      : undefined
  let day: number
  let monthCodeNumber: number
  let isLeapMonth: boolean

  // TODO: make this DRY the HACK in refinePlainMOnthDayBag?
  const isIso = calendarId === isoCalendarId
  if (yearMaybe === undefined && isIso) {
    yearMaybe = isoEpochFirstLeapYear
  }

  // year given? parse either monthCode or month (if both specified, must be equivalent)
  if (yearMaybe !== undefined) {
    // might limit overflow
    const month = refineMonth(calendarId, fields, yearMaybe, overflow)
    // NOTE: internal call of getDefinedProp not necessary
    day = refineDay(
      calendarId,
      fields as DayFields,
      month,
      yearMaybe,
      overflow,
    )

    ;[monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
      calendarId,
      yearMaybe,
      month,
    )
  } else {
    // no year given? there must be a monthCode
    if (fields.monthCode === undefined) {
      // TODO: should this message be more specific about month *CODE*?
      throw new TypeError(errorMessages.missingMonth)
    }
    // pluck monthCode/day number without limiting overflow
    ;[monthCodeNumber, isLeapMonth] = parseMonthCode(fields.monthCode)

    // This is ALSO a HACK for maxLengthOfMonthCodeInAnyYear in reference implementation's monthDayFromFields
    // to limit the day in calendar with predictable max-days-in-month without the year
    const isIsoLike =
      calendarId === isoCalendarId ||
      calendarId === gregoryCalendarId ||
      calendarId === japaneseCalendarId
    if (isIsoLike) {
      const month = refineMonth(
        calendarId,
        fields,
        isoEpochFirstLeapYear,
        overflow,
      )
      day = refineDay(
        calendarId,
        fields as DayFields,
        month,
        isoEpochFirstLeapYear,
        overflow,
      )
    } else if (
      computeCalendarIdBase(calendarId) === 'coptic' &&
      overflow === Overflow.Constrain
    ) {
      const maxLengthOfMonthCodeInAnyYear =
        !isLeapMonth && monthCodeNumber === 13 ? 6 : 30
      day = fields.day!
      day = clampNumber(day, 1, maxLengthOfMonthCodeInAnyYear)
    } else if (
      computeCalendarIdBase(calendarId) === 'chinese' &&
      overflow === Overflow.Constrain
    ) {
      const maxLengthOfMonthCodeInAnyYear =
        isLeapMonth &&
        (monthCodeNumber === 1 ||
          monthCodeNumber === 9 ||
          monthCodeNumber === 10 ||
          monthCodeNumber === 11 ||
          monthCodeNumber === 12)
          ? 29
          : 30
      day = fields.day!
      day = clampNumber(day, 1, maxLengthOfMonthCodeInAnyYear)
    } else {
      // NORMAL CASE
      day = fields.day! // guaranteed by caller
    }
  }

  // query calendar for final year/month
  const res = queryNativeYearMonthForMonthDay(
    calendarId,
    monthCodeNumber,
    isLeapMonth,
    day,
  )
  if (!res) {
    throw new RangeError(errorMessages.failedYearGuess)
  }
  const [finalYear, finalMonth] = res

  return createPlainMonthDaySlots(
    checkIsoDateInBounds(
      queryNativeIsoFieldsFromParts(calendarId, finalYear, finalMonth, day),
    ),
    calendarId,
  )
}

export function nativeFieldsMethod(
  calendarId: string,
  fieldNames: string[],
): string[] {
  if (
    getCalendarEraOrigins({ id: calendarId }) &&
    fieldNames.includes('year')
  ) {
    return [...fieldNames, ...eraYearFieldNames]
  }
  return fieldNames
}

export function nativeMergeFields(
  calendarId: string,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins({ id: calendarId })) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // eras begin mid-year?
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

// Low-level Native Utils
// -----------------------------------------------------------------------------

function refineYear(
  calendarId: string,
  fields: DateBag,
): number {
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  const eraRemaps = eraRemapsByCalendarId[calendarId || ''] || {}
  let { era, eraYear, year } = fields

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError(errorMessages.mismatchingEraParts)
    }

    if (!eraOrigins) {
      throw new RangeError(errorMessages.forbiddenEraParts)
    }

    const normalizedEra = eraRemaps[era] || era
    const eraOrigin = eraOrigins[normalizedEra]

    if (eraOrigin === undefined) {
      throw new RangeError(errorMessages.invalidEra(era))
    }

    const yearByEra = eraYearToYear(eraYear, eraOrigin)
    if (year !== undefined && year !== yearByEra) {
      throw new RangeError(errorMessages.mismatchingYearAndEra)
    }

    year = yearByEra
  } else if (year === undefined) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }

  return year
}

function refineMonth(
  calendarId: string,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow,
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = refineMonthCode(
      calendarId,
      monthCode,
      year,
      overflow,
    )

    if (month !== undefined && month !== monthByCode) {
      throw new RangeError(errorMessages.mismatchingMonthAndCode)
    }

    month = monthByCode
    overflow = Overflow.Reject // monthCode parsing doesn't constrain
  } else if (month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
  }

  return clampEntity(
    'month',
    month,
    1,
    queryNativeMonthsInYearPart(calendarId, year),
    overflow,
  )
}

function refineMonthCode(
  calendarId: string,
  monthCode: string,
  year: number,
  overflow: Overflow,
) {
  const leapMonth = queryNativeLeapMonth(calendarId, year)
  const [monthCodeNumber, wantsLeapMonth] = parseMonthCode(monthCode)
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = getCalendarLeapMonthMeta({ id: calendarId })

    // calendar does not support leap years
    if (leapMonthMeta === undefined) {
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // leap year has a maximum
    if (leapMonthMeta > 0) {
      if (month > leapMonthMeta) {
        throw new RangeError(errorMessages.invalidLeapMonth)
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError(errorMessages.invalidLeapMonth)
        }
        month-- // M05L -> M05
      }
    } else {
      // leap year is constant
      if (month !== -leapMonthMeta) {
        throw new RangeError(errorMessages.invalidLeapMonth)
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError(errorMessages.invalidLeapMonth)
        }
        // else, ex: M05L -> M06
      }
    }
  }

  return month
}

function refineDay(
  calendarId: string,
  fields: DayFields,
  month: number,
  year: number,
  overflow?: Overflow,
): number {
  return clampProp(
    fields,
    'day',
    1,
    queryNativeDaysInMonthPart(calendarId, year, month),
    overflow,
  )
}

/*
Splices props with names `allPropNames` from `additional` to `dest`,
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

// Essential Fields
// -----------------------------------------------------------------------------
// TODO: more DRY with funcApi

function computeZonedDateTimeEssentials(slots: ZonedDateTimeSlots): {
  year: number
  monthCode: string
  day: number
} & TimeFields & { offset: string } {
  const isoFields = zonedEpochSlotsToIso(slots, queryNativeTimeZone)
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  const [year, month, day] = queryNativeDateParts(slots.calendar, isoFields)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)

  return {
    ...isoTimeFieldsToCal(isoFields),
    year,
    monthCode,
    day,
    offset: offsetString,
  }
}

function computeDateTimeEssentials(slots: DateTimeSlots) {
  return {
    ...computeDateEssentials(slots),
    // TODO: better
    hour: slots.isoHour,
    minute: slots.isoMinute,
    second: slots.isoSecond,
    millisecond: slots.isoMillisecond,
    microsecond: slots.isoMicrosecond,
    nanosecond: slots.isoNanosecond,
  }
}

function computeDateEssentials(slots: DateSlots): {
  year: number
  monthCode: string
  day: number
} {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { year, monthCode, day }
}

function computeYearMonthEssentials(slots: DateSlots): {
  year: number
  monthCode: string
} {
  const [year, month] = queryNativeDateParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { year, monthCode }
}

function computeMonthDayEssentials(slots: DateSlots): {
  monthCode: string
  day: number
} {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, day }
}
