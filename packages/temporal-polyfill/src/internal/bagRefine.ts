import {
  eraRemapsByCalendarId,
  gregoryCalendarId,
  isoCalendarId,
  isoYearOffsetsByCalendarId,
  japaneseCalendarId,
  normalizeEraName,
  plainMonthDayCommonMonthMaxDayByCalendarIdBase,
  plainMonthDayLeapMonthMaxDaysByCalendarIdBase,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import {
  eraYearToYear,
  formatMonthCode,
  getCalendarEraOrigins,
  getCalendarLeapMonthMeta,
  monthCodeNumberToMonth,
  parseMonthCode,
} from './calendarNative'
import {
  queryNativeDateParts,
  queryNativeDaysInMonthPart,
  queryNativeIsoFieldsFromParts,
  queryNativeLeapMonth,
  queryNativeMonthCodeParts,
  queryNativeMonthsInYearPart,
  queryNativeYearMonthForMonthDay,
} from './calendarNativeQuery'
import {
  requireObjectLike,
  requireString,
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
import { RelativeToSlotsNoCalendar } from './relativeMath'
import { OffsetDisambig, Overflow } from './options'
import {
  OverflowOptions,
  ZonedFieldOptions,
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
  getMatchingInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneNativeMath'
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

type DateOptionsTuple = [overflow: Overflow, ...extraOptions: unknown[]]
type DateOptionsRefiner<T extends DateOptionsTuple> = () => T
type OverflowRefiner = () => Overflow

// Config
// -----------------------------------------------------------------------------

const dateFieldRefiners = {
  era: toStringViaPrimitive,
  // `year` and `eraYear` are coerced inside refineYear().  That lets the
  // *-from-fields routines perform their required-field checks and the
  // monthCode syntax check before observing numeric coercion failures.
  //
  // TODO: better separation/refactoring of coercion/validation
  //
  eraYear: passThroughDateField,
  year: passThroughDateField,
  month: toPositiveInteger,
  // monthCode refiner only validates type (string). Range validation (parseMonthCode)
  // is deferred to dateFromFields/yearMonthFromFields/monthDayFromFields so that
  // missing-field TypeError precedes invalid-monthCode RangeError.
  monthCode(monthCode: string, entityName = 'monthCode') {
    return refineMonthCodeString(monthCode, entityName)
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

function refineMonthCodeString(monthCode: unknown, entityName: string): string {
  if (typeof monthCode === 'string') {
    return monthCode
  }

  if (monthCode && typeof monthCode === 'object') {
    const monthCodeToString = monthCode.toString

    if (typeof monthCodeToString === 'function') {
      return requireString(monthCodeToString.call(monthCode), entityName)
    }
  }

  return requireString(monthCode as string, entityName)
}

function passThroughDateField<T>(fieldVal: T): T {
  return fieldVal
}

function validateMonthCodeSyntax(fields: Partial<MonthFields>): void {
  if (fields.monthCode !== undefined) {
    // Syntax is part of resolving the supplied fields, not calendar suitability.
    // `M99L` is syntactically valid and is rejected later against the chosen
    // calendar/year, but `L99M` should fail before year numeric coercion.
    parseMonthCode(fields.monthCode)
  }
}

// High-Level Refining
// -----------------------------------------------------------------------------

export function refineMaybeNativeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string,
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
    const isoDateFields = dateFromFields(calendarId, fields as any)
    const isoTimeFields = refineTimeBag(fields)

    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const nativeTimeZone = queryNativeTimeZone(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      nativeTimeZone,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
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
  const fields = refineNativeCalendarFields(
    calendarId,
    bag,
    dateFieldNamesAlpha,
    timeZoneFieldNames,
    timeAndZoneFieldNames,
  ) as ZonedDateTimeBag

  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [isoDateFields, overflow, offsetDisambig, epochDisambig] =
    resolveDateFromFields(
      calendarId,
      fields as any,
      () => refineZonedFieldOptions(options),
    )
  const isoTimeFields = refineTimeBag(fields, overflow)
  const nativeTimeZone = queryNativeTimeZone(timeZoneId)

  const epochNanoseconds = getMatchingInstantFor(
    nativeTimeZone,
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

  const [isoDateInternals, overflow] = resolveDateFromFields(
    calendarId,
    fields as any,
    () => [refineOverflowOptions(options)],
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

  return dateFromFields(calendarId, fields as any, options)
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

  return yearMonthFromFields(calendarId, fields as any, options)
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

  return monthDayFromFields(calendarId, fields, options)
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
    ...getCalendarFieldNames(calendarId, validFieldNames),
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
  const partialFields = refineFields(modFields, validFieldNames)
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
      refineZonedFieldOptions(
        options,
        OffsetDisambig.Prefer,
      ),
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
  const partialFields = refineFields(modFields, validFieldNames)
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
  const partialFields = refineFields(modFields, validFieldNames)
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
  const partialFields = refineFields(modFields, validFieldNames)
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
  const partialFields = refineFields(modFields, validFieldNames)
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
  return monthDayFromFields(calendarId, fields as DateBag)
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
  return yearMonthFromFields(calendarId, fields as YearMonthBag, options)
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
  inputFieldNames = getCalendarFieldNames(calendarId, inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = getCalendarFieldNames(calendarId, extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = mergeCalendarFields(calendarId, input, extra)
  mergedFields = refineFields(
    mergedFields,
    [...inputFieldNames, ...extraFieldNames].sort(),
    [],
  )

  return dateFromFields(calendarId, mergedFields as any)
}

// Native *-from-fields
// -----------------------------------------------------------------------------

export function dateFromFields(
  calendarId: string,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  return resolveDateFromFields(
    calendarId,
    fields,
    () => [refineOverflowOptions(options)],
  )[0]
}

function resolveDateFromFields<T extends DateOptionsTuple>(
  calendarId: string,
  fields: DateBag,
  refineOptions: DateOptionsRefiner<T>,
): [slots: PlainDateSlots, ...options: T] {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  // This ensures correct error ordering per spec (e.g. calendarresolvefields-error-ordering tests).
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
  }
  if (fields.day === undefined) {
    throw new TypeError(errorMessages.missingField('day'))
  }

  validateMonthCodeSyntax(fields)

  const year = refineYear(calendarId, fields)

  // Options are deliberately read after all observable calendar fields,
  // including numeric year coercion. Month/day validation needs overflow, so
  // this is the latest point shared by Date, DateTime, and ZonedDateTime paths.
  const refinedOptions = refineOptions()
  const overflow = refinedOptions[0]
  const month = refineMonth(calendarId, fields, year, overflow)
  const day = refineDay(calendarId, fields as DayFields, month, year, overflow)
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, day)

  return [
    createPlainDateSlots(checkIsoDateInBounds(isoFields), calendarId),
    ...refinedOptions,
  ]
}

export function yearMonthFromFields(
  calendarId: string,
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  return resolveYearMonthFromFields(
    calendarId,
    fields,
    () => refineOverflowOptions(options),
  )[0]
}

function resolveYearMonthFromFields(
  calendarId: string,
  fields: YearMonthBag,
  refineOverflow: OverflowRefiner,
): [slots: PlainYearMonthSlots, overflow: Overflow] {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
  }

  validateMonthCodeSyntax(fields)

  const year = refineYear(calendarId, fields)

  // Keep option coercion after year coercion; month resolution is the first
  // step that needs overflow.
  const overflow = refineOverflow()
  const month = refineMonth(calendarId, fields, year, overflow)
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, 1)

  return [
    createPlainYearMonthSlots(checkIsoYearMonthInBounds(isoFields), calendarId),
    overflow,
  ]
}

export function monthDayFromFields(
  calendarId: string,
  fields: DateBag, // guaranteed `day`
  options?: OverflowOptions,
): PlainMonthDaySlots {
  return resolveMonthDayFromFields(
    calendarId,
    fields,
    () => refineOverflowOptions(options),
  )[0]
}

function resolveMonthDayFromFields(
  calendarId: string,
  fields: DateBag, // guaranteed `day`
  refineOverflow: OverflowRefiner,
): [slots: PlainMonthDaySlots, overflow: Overflow] {
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })

  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  if (fields.day === undefined) {
    throw new TypeError(errorMessages.missingField('day'))
  }
  if (
    calendarId !== isoCalendarId &&
    fields.month !== undefined &&
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }

  validateMonthCodeSyntax(fields)

  let yearMaybe =
    fields.eraYear !== undefined || fields.year !== undefined // HACK
      ? refineYear(calendarId, fields)
      : undefined

  // PlainMonthDay may not have a year, but if it does, that year is part of the
  // observable field coercion sequence and must precede overflow option reads.
  const overflow = refineOverflow()
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
    // PlainMonthDay stores a canonical reference year, but an explicitly
    // supplied ISO year is only a probe for overflow math. In particular, an
    // out-of-range ISO year can still tell us whether M02-29 should constrain
    // to M02-28 or remain a leap-day PlainMonthDay. Non-ISO calendars still go
    // through this guard because their calendar queries may need a real
    // in-range ISO date to anchor the supplied calendar year.
    if (!isIso) {
      checkIsoDateInBounds(
        queryNativeIsoFieldsFromParts(calendarId, yearMaybe, 1, 1),
      )
    }

    // might limit overflow
    const month = refineMonth(calendarId, fields, yearMaybe, overflow)
    // NOTE: internal call of getDefinedProp not necessary
    day = refineDay(calendarId, fields as DayFields, month, yearMaybe, overflow)
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
      calendarId === japaneseCalendarId ||
      isoYearOffsetsByCalendarId[calendarId] !== undefined
    if (isIsoLike) {
      // Offset ISO-like calendars (Buddhist/ROC) share Gregorian month lengths,
      // but their calendar year is not the ISO year. Use the native calendar
      // year that corresponds to ISO 1972 so February 29 remains available.
      const referenceYear =
        isoEpochFirstLeapYear + (isoYearOffsetsByCalendarId[calendarId] || 0)
      const month = refineMonth(calendarId, fields, referenceYear, overflow)
      day = refineDay(
        calendarId,
        fields as DayFields,
        month,
        referenceYear,
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

  if (
    isLeapMonth &&
    queryPlainMonthDayLeapMonthMaxDay(calendarId, monthCodeNumber) < fields.day
  ) {
    if (overflow === Overflow.Reject) {
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // Temporal's PlainMonthDay reference table only admits some leap
    // month-days. When a requested leap month-day is outside that table,
    // constrain it through the corresponding common month instead.
    isLeapMonth = false
    day = clampNumber(
      fields.day,
      1,
      queryPlainMonthDayCommonMonthMaxDay(calendarId),
    )
  }

  // query calendar for final year/month
  let res = queryNativeYearMonthForMonthDay(
    calendarId,
    monthCodeNumber,
    Boolean(isLeapMonth),
    day,
  )

  // Without an explicit year, variable-length calendar months need the same
  // overflow behavior as year-specific fields: reject asks for an exact match,
  // while constrain walks back to the latest day that exists in some suitable
  // reference year/month.
  while (!res && overflow === Overflow.Constrain && day > 1) {
    day--
    res = queryNativeYearMonthForMonthDay(
      calendarId,
      monthCodeNumber,
      Boolean(isLeapMonth),
      day,
    )
  }

  if (!res) {
    throw new RangeError(errorMessages.failedYearGuess)
  }
  const [finalYear, finalMonth] = res

  return [
    createPlainMonthDaySlots(
      checkIsoDateInBounds(
        queryNativeIsoFieldsFromParts(calendarId, finalYear, finalMonth, day),
      ),
      calendarId,
    ),
    overflow,
  ]
}

function queryPlainMonthDayLeapMonthMaxDay(
  calendarId: string,
  monthCodeNumber: number,
): number {
  return (
    plainMonthDayLeapMonthMaxDaysByCalendarIdBase[
      computeCalendarIdBase(calendarId)
    ]?.[monthCodeNumber] ?? Infinity
  )
}

function queryPlainMonthDayCommonMonthMaxDay(calendarId: string): number {
  return (
    plainMonthDayCommonMonthMaxDayByCalendarIdBase[
      computeCalendarIdBase(calendarId)
    ] ?? Infinity
  )
}

export function getCalendarFieldNames(
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

export function mergeCalendarFields(
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

function refineYear(calendarId: string, fields: DateBag): number {
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  const eraRemaps =
    eraRemapsByCalendarId[computeCalendarIdBase(calendarId)] || {}
  let { era, eraYear, year } = fields

  // TODO: repeat coercion? happens prior too?
  if (year !== undefined) {
    year = toInteger(year as number, 'year')
  }
  if (eraYear !== undefined) {
    eraYear = toInteger(eraYear as number, 'eraYear')
  }

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError(errorMessages.mismatchingEraParts)
    }

    if (!eraOrigins) {
      throw new RangeError(errorMessages.forbiddenEraParts)
    }

    const normalizedEra =
      eraRemaps[normalizeEraName(era)] || normalizeEraName(era)
    const eraOrigin = eraOrigins[normalizedEra]

    // Ethiopic's AA era counts from an offset epoch instead of using the
    // forward/reverse year scheme used by Gregorian/ROC/Japanese eras.
    if (
      computeCalendarIdBase(calendarId) === 'ethiopic' &&
      normalizedEra === 'aa'
    ) {
      const yearByEra = eraYear - 5500
      if (year !== undefined && year !== yearByEra) {
        throw new RangeError(errorMessages.mismatchingYearAndEra)
      }

      year = yearByEra
    } else {
      if (eraOrigin === undefined) {
        throw new RangeError(errorMessages.invalidEra(era))
      }

      const yearByEra = eraYearToYear(eraYear, eraOrigin)
      if (year !== undefined && year !== yearByEra) {
        throw new RangeError(errorMessages.mismatchingYearAndEra)
      }

      year = yearByEra
    }
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
    const monthByCode = refineMonthCode(calendarId, monthCode, year, overflow)

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

      // For variable-leap calendars (Chinese/Dangi), `leapMonth` is the
      // concrete calendar-month ordinal occupied by the requested leap
      // monthCode. A leap year can still have a *different* leap month, so the
      // leap monthCode is only available when the ordinals match exactly.
      if (leapMonth !== month) {
        if (overflow === Overflow.Reject) {
          throw new RangeError(errorMessages.invalidLeapMonth)
        }
        month = monthCodeNumberToMonth(monthCodeNumber, false, leapMonth)
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
  const isoFields = zonedEpochSlotsToIso(slots)
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
