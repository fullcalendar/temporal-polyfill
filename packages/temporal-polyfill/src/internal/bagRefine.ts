import { BigNano } from './bigNano'
import { isoCalendarId, japaneseCalendarId } from './calendarConfig'
import {
  NativeDateRefineDeps,
  NativeMonthDayRefineOps,
  NativeYearMonthRefineDeps,
  eraYearToYear,
  getCalendarEraOrigins,
  getCalendarLeapMonthMeta,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
  parseMonthCode,
} from './calendarNative'
import {
  DateModOps,
  DateRefineOps,
  FieldsOp,
  MergeFieldsOp,
  MonthDayModOps,
  MonthDayRefineOps,
  YearMonthModOps,
  YearMonthRefineOps,
} from './calendarOps'
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
  offsetFieldNames,
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
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
  isoTimeFieldNamesAsc,
} from './isoFields'
import {
  computeIsoDaysInMonth,
  constrainIsoTimeFields,
  isoEpochFirstLeapYear,
  isoMonthsInYear,
} from './isoMath'
import { parseOffsetNano } from './isoParse'
import { RelativeToSlotsNoCalendar } from './markerSystem'
import { OffsetDisambig, Overflow } from './options'
import {
  OverflowOptions,
  ZonedFieldOptions,
  copyOptions,
  overrideOverflowOptions,
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
import { TimeZoneOps, getMatchingInstantFor } from './timeZoneOps'
import {
  Callable,
  bindArgs,
  clampEntity,
  clampProp,
  getDefinedProp,
  mapPropNamesToConstant,
  pluckProps,
  remapProps,
} from './utils'

export type PlainDateBag<C> = DateBag & { calendar?: C }
export type PlainDateTimeBag<C> = DateBag & TimeBag & { calendar?: C }
export type ZonedDateTimeBag<C, T> = PlainDateTimeBag<C> & {
  timeZone: T
  offset?: string
}
export type PlainTimeBag = TimeBag
export type PlainYearMonthBag<C> = YearMonthBag & { calendar?: C }
export type PlainMonthDayBag<C> = MonthDayBag & { calendar?: C }

// Config
// -----------------------------------------------------------------------------

const dateFieldRefiners = {
  era: toStringViaPrimitive,
  eraYear: toInteger,
  year: toInteger,
  month: toPositiveInteger,
  monthCode: toStringViaPrimitive,
  day: toPositiveInteger,
}

const timeFieldRefiners = mapPropNamesToConstant(timeFieldNamesAsc, toInteger)

const durationFieldRefiners = mapPropNamesToConstant(
  durationFieldNamesAsc,
  toStrictInteger,
)

const builtinRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  offset: toStringViaPrimitive,
}

// High-Level Refining
// -----------------------------------------------------------------------------

export function refineMaybeZonedDateTimeBag<C, TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeZoneArg: T) => TimeZoneOps,
  calendarOps: DateRefineOps<C>,
  bag: ZonedDateTimeBag<unknown, TA>,
): RelativeToSlotsNoCalendar<T> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha, // validFieldNames
    [], // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag<unknown, TA>

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarOps.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    // must happen after datetime fields
    const timeZoneSlot = refineTimeZoneArg(fields.timeZone)
    const timeZoneOps = getTimeZoneOps(timeZoneSlot)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneOps,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    )

    return { epochNanoseconds, timeZone: timeZoneSlot }
  }

  const isoDateInternals = calendarOps.dateFromFields(fields as any)
  return { ...isoDateInternals, ...isoTimeFieldDefaults }
}

export function refineZonedDateTimeBag<C, TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  calendarOps: DateRefineOps<C>,
  calendarSlot: C,
  bag: ZonedDateTimeBag<unknown, TA>,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots<C, T> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha, // validFieldNames
    timeZoneFieldNames, // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag<unknown, TA>

  // guaranteed via refineCalendarFields
  const timeZoneSlot = refineTimeZoneArg(fields.timeZone!)

  const [overflow, offsetDisambig, epochDisambig] =
    refineZonedFieldOptions(options)
  const isoDateFields = calendarOps.dateFromFields(
    fields as any,
    overrideOverflowOptions(options, overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    { ...isoDateFields, ...isoTimeFields },
    fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    offsetDisambig,
    epochDisambig,
  )

  return createZonedDateTimeSlots(epochNanoseconds, timeZoneSlot, calendarSlot)
}

export function refinePlainDateTimeBag<C>(
  calendarOps: DateRefineOps<C>,
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): PlainDateTimeSlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    [], // requiredFields
    timeFieldNamesAsc, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarOps.dateFromFields(
    fields as any,
    overrideOverflowOptions(options, overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  const isoFields = checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })

  return createPlainDateTimeSlots(isoFields)
}

export function refinePlainDateBag<C>(
  calendarOps: DateRefineOps<C>,
  bag: DateBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): PlainDateSlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    requireFields,
  )

  return calendarOps.dateFromFields(fields as any, options)
}

export function refinePlainYearMonthBag<C>(
  calendarOps: YearMonthRefineOps<C>,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return calendarOps.yearMonthFromFields(fields, options)
}

export function refinePlainMonthDayBag<C>(
  calendarOps: MonthDayRefineOps<C>,
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
  requireFields: string[] = [], // when called from Calendar
): PlainMonthDaySlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    requireFields,
  )

  // Callers who omit the calendar are not writing calendar-independent
  // code. In that case, `monthCode`/`year` can be omitted; `month` and
  // `day` are sufficient. Add a `year` to satisfy calendar validation.
  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = isoEpochFirstLeapYear
  }

  return calendarOps.monthDayFromFields(fields, options)
}

export function refinePlainTimeBag(
  bag: TimeBag,
  options?: OverflowOptions, // optional b/c func API can use directly
): PlainTimeSlots {
  // spec says overflow parsed first
  const overflow = refineOverflowOptions(options)

  // disallowEmpty
  const fields = refineFields(bag, timeFieldNamesAlpha, [], true) as TimeBag

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

function refineCalendarFields(
  calendarOps: { fields: FieldsOp },
  bag: Record<string, unknown>,
  validFieldNames: string[], // does NOT need to be alphabetized
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarOps.fields(validFieldNames),
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

export function zonedDateTimeWithFields<C, T>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  const optionsCopy = copyOptions(options)
  const { calendar, timeZone } = zonedDateTimeSlots
  const calendarOps = getCalendarOps(calendar)
  const timeZoneOps = getTimeZoneOps(timeZone)

  return createZonedDateTimeSlots(
    mergeZonedDateTimeBag(
      calendarOps,
      timeZoneOps,
      initialFields,
      modFields,
      optionsCopy,
    ),
    timeZone,
    calendar,
  )
}

export function plainDateTimeWithFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const optionsCopy = copyOptions(options)
  const calendarSlot = plainDateTimeSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return createPlainDateTimeSlots(
    mergePlainDateTimeBag(calendarOps, initialFields, modFields, optionsCopy),
  )
}

export function plainDateWithFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateSlots: PlainDateSlots<C>,
  initialFields: DateBag,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const optionsCopy = copyOptions(options)
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return mergePlainDateBag(calendarOps, initialFields, modFields, optionsCopy)
}

export function plainYearMonthWithFields<C>(
  getCalendarOps: (calendar: C) => YearMonthModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  initialFields: YearMonthBag,
  modFields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const optionsCopy = copyOptions(options)
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return createPlainYearMonthSlots(
    mergePlainYearMonthBag(calendarOps, initialFields, modFields, optionsCopy),
  )
}

export function plainMonthDayWithFields<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayModOps<C>,
  plainMonthDaySlots: PlainMonthDaySlots<C>,
  initialFields: MonthDayBag,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<C> {
  const optionsCopy = copyOptions(options)
  const calendarSlot = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return mergePlainMonthDayBag(
    calendarOps,
    initialFields,
    modFields,
    optionsCopy,
  )
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

function mergeZonedDateTimeBag<C>(
  calendarOps: DateModOps<C>,
  timeZoneOps: TimeZoneOps,
  initialFields: DateTimeBag & { offset?: string },
  modFields: DateTimeBag & { offset?: string },
  options: ZonedFieldOptions | undefined,
): BigNano {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    dateFieldNamesAlpha, // validFieldNames
    timeAndOffsetFieldNames, // forcedValidFieldNames
    offsetFieldNames, // requiredObjFieldNames
  ) as ZonedDateTimeBag<unknown, unknown>

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(
    options,
    OffsetDisambig.Prefer,
  )
  const isoDateFields = calendarOps.dateFromFields(
    fields as any,
    overrideOverflowOptions(options, overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  return getMatchingInstantFor(
    timeZoneOps,
    { ...isoDateFields, ...isoTimeFields },
    parseOffsetNano(fields.offset!), // guaranteed via mergeCalendarFields
    offsetDisambig,
    epochDisambig,
  )
}

function mergePlainDateTimeBag<C>(
  calendarOps: DateModOps<C>,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields & { calendar: C } {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    dateFieldNamesAlpha, // validFieldNames
    timeFieldNamesAsc, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarOps.dateFromFields(
    fields as any,
    overrideOverflowOptions(options, overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

function mergePlainDateBag<C>(
  calendarOps: DateModOps<C>,
  initialFields: DateBag,
  modFields: DateBag,
  options: OverflowOptions | undefined,
): PlainDateSlots<C> {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    dateFieldNamesAlpha,
  )

  return calendarOps.dateFromFields(fields as any, options)
}

function mergePlainYearMonthBag<C>(
  calendarOps: YearMonthModOps<C>,
  initialFields: YearMonthBag,
  modFields: YearMonthBag,
  options: OverflowOptions | undefined,
): PlainYearMonthSlots<C> {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    yearMonthFieldNames,
  )

  return calendarOps.yearMonthFromFields(fields, options)
}

function mergePlainMonthDayBag<C>(
  calendarOps: MonthDayModOps<C>,
  initialFields: MonthDayBag,
  modFields: MonthDayBag,
  options: OverflowOptions | undefined,
): PlainMonthDaySlots<C> {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    dateFieldNamesAlpha,
  )

  return calendarOps.monthDayFromFields(fields, options)
}

function mergePlainTimeBag(
  initialFields: TimeFields,
  modFields: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options) // spec says overflow parsed first
  const origFields = pluckProps(timeFieldNamesAlpha, initialFields)
  const newFields = refineFields(modFields, timeFieldNamesAlpha)
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

function mergeCalendarFields(
  calendarOps: { fields: FieldsOp; mergeFields: MergeFieldsOp },
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[], // does NOT need to be alphabetized
  forcedValidFieldNames: string[] = [],
  requiredObjFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarOps.fields(validFieldNames),
    ...forcedValidFieldNames,
  ].sort()

  let fields = refineFields(obj, fieldNames, requiredObjFieldNames)
  const partialFields = refineFields(bag, fieldNames)

  fields = calendarOps.mergeFields(fields, partialFields)

  // guard against ridiculous .mergeField results
  return refineFields(fields, fieldNames, [])
}

// Conversion that involves bags
// -----------------------------------------------------------------------------

export function convertToPlainMonthDay<C>(
  calendarOps: MonthDayRefineOps<C>,
  input: { monthCode: string; day: number },
): PlainMonthDaySlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    input,
    monthCodeDayFieldNames,
  )
  return calendarOps.monthDayFromFields(fields)
}

export function convertToPlainYearMonth<C>(
  calendarOps: YearMonthRefineOps<C>,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const fields = refineCalendarFields(
    calendarOps,
    input,
    yearMonthCodeFieldNames,
  )
  return calendarOps.yearMonthFromFields(fields, options)
}

export function convertPlainMonthDayToDate<C>(
  calendarOps: DateModOps<C>,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots<C> {
  return convertToIso(
    calendarOps,
    input,
    monthCodeDayFieldNames, // inputFieldNames
    requireObjectLike(bag), // extra
    yearFieldNames, // extraFieldNames
  )
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate<C>(
  calendarOps: DateModOps<C>,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots<C> {
  return convertToIso(
    calendarOps,
    input,
    yearMonthCodeFieldNames, // inputFieldNames
    requireObjectLike(bag), // extra
    dayFieldNames, // extraFieldNames
  )
}

function convertToIso<C>(
  calendarOps: DateModOps<C>,
  input: any,
  inputFieldNames: string[], // must be alphabetized!!!
  extra: any,
  extraFieldNames: string[], // must be alphabetized!!!
): PlainDateSlots<C> {
  inputFieldNames = calendarOps.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarOps.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarOps.mergeFields(input, extra)
  mergedFields = refineFields(
    mergedFields,
    [...inputFieldNames, ...extraFieldNames].sort(),
    [],
  )

  return calendarOps.dateFromFields(mergedFields as any)
}

// Native *-from-fields
// -----------------------------------------------------------------------------

export function nativeDateFromFields(
  this: NativeDateRefineDeps,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const day = refineDay(this, fields as DayFields, month, year, overflow)
  const isoFields = this.isoFields(year, month, day)

  return createPlainDateSlots(
    checkIsoDateInBounds(isoFields),
    this.id || isoCalendarId,
  )
}

export function nativeYearMonthFromFields(
  this: NativeYearMonthRefineDeps,
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const isoFields = this.isoFields(year, month, 1)

  return createPlainYearMonthSlots(
    checkIsoYearMonthInBounds(isoFields),
    this.id || isoCalendarId,
  )
}

export function nativeMonthDayFromFields(
  this: NativeMonthDayRefineOps,
  fields: DateBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  const overflow = refineOverflowOptions(options)
  const isIso = !this.id
  const { monthCode, year, month } = fields as DateBag
  let monthCodeNumber: number
  let isLeapMonth: boolean
  let normalYear: number | undefined
  let normalMonth: number | undefined
  let normalDay: number

  if (monthCode !== undefined) {
    ;[monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
    normalDay = getDefinedProp(fields, 'day')

    // query calendar for year/month
    const res = this.yearMonthForMonthDay(
      monthCodeNumber,
      isLeapMonth,
      normalDay,
    )
    if (!res) {
      throw new RangeError(errorMessages.failedYearGuess)
    }
    ;[normalYear, normalMonth] = res

    // monthCode conflicts with month?
    if (month !== undefined && month !== normalMonth) {
      throw new RangeError(errorMessages.mismatchingMonthAndCode)
    }

    // constrain (what refineMonth/refineDay would normally do)
    if (isIso) {
      normalMonth = clampEntity(
        'month',
        normalMonth,
        1,
        isoMonthsInYear,
        Overflow.Reject,
      ) // reject because never leap months
      normalDay = clampEntity(
        'day',
        normalDay,
        1,
        computeIsoDaysInMonth(
          year !== undefined ? year : normalYear,
          normalMonth,
        ),
        overflow,
      )
    }
  } else {
    // refine year/month/day
    normalYear =
      year === undefined && isIso
        ? isoEpochFirstLeapYear
        : refineYear(this, fields as EraYearOrYear)
    normalMonth = refineMonth(this, fields, normalYear, overflow)
    normalDay = refineDay(
      this,
      fields as DayFields,
      normalMonth,
      normalYear,
      overflow,
    )

    // compute monthCode
    const leapMonth = this.leapMonth(normalYear)
    isLeapMonth = normalMonth === leapMonth
    monthCodeNumber = monthToMonthCodeNumber(normalMonth, leapMonth)

    // query calendar for normalized year/month
    const res = this.yearMonthForMonthDay(
      monthCodeNumber,
      isLeapMonth,
      normalDay,
    )
    if (!res) {
      throw new RangeError(errorMessages.failedYearGuess)
    }
    ;[normalYear, normalMonth] = res
  }

  return createPlainMonthDaySlots(
    this.isoFields(normalYear, normalMonth, normalDay),
    this.id || isoCalendarId,
  )
}

export function nativeFieldsMethod(
  this: NativeYearMonthRefineDeps,
  fieldNames: string[],
): string[] {
  if (getCalendarEraOrigins(this) && fieldNames.includes('year')) {
    return [...fieldNames, ...eraYearFieldNames]
  }
  return fieldNames
}

export function nativeMergeFields(
  this: NativeYearMonthRefineDeps,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins(this)) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // eras begin mid-year?
    if (this.id === japaneseCalendarId) {
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
  calendarNative: NativeYearMonthRefineDeps,
  fields: DateBag,
): number {
  let { era, eraYear, year } = fields
  const eraOrigins = getCalendarEraOrigins(calendarNative)

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError(errorMessages.mismatchingEraParts)
    }

    if (!eraOrigins) {
      throw new RangeError(errorMessages.forbiddenEraParts)
    }

    const eraOrigin = eraOrigins[era]
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
  calendarNative: NativeYearMonthRefineDeps,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow,
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = refineMonthCode(
      calendarNative,
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
    calendarNative.monthsInYearPart(year),
    overflow,
  )
}

function refineMonthCode(
  calendarNative: NativeYearMonthRefineDeps,
  monthCode: string,
  year: number,
  overflow: Overflow,
) {
  const leapMonth = calendarNative.leapMonth(year)
  const [monthCodeNumber, wantsLeapMonth] = parseMonthCode(monthCode)
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = getCalendarLeapMonthMeta(calendarNative)

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
  calendarNative: NativeDateRefineDeps,
  fields: DayFields,
  month: number,
  year: number,
  overflow?: Overflow,
): number {
  return clampProp(
    fields,
    'day',
    1,
    calendarNative.daysInMonthParts(year, month),
    overflow,
  )
}

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
