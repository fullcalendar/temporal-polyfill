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
  fabricateOverflowOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './optionsRefine'
import {
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

export function refineMaybeZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  calendarOps: DateRefineOps,
  bag: ZonedDateTimeBag,
): RelativeToSlotsNoCalendar {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha, // validFieldNames
    [], // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarOps.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    // must happen after datetime fields
    const timeZoneId = refineTimeZoneString(fields.timeZone)
    const timeZoneOps = getTimeZoneOps(timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneOps,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    )

    return { epochNanoseconds, timeZone: timeZoneId }
  }

  const isoDateInternals = calendarOps.dateFromFields(fields as any)
  return { ...isoDateInternals, ...isoTimeFieldDefaults }
}

export function refineZonedDateTimeBag(
  refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  calendarOps: DateRefineOps,
  calendarId: string,
  bag: ZonedDateTimeBag,
  options: ZonedFieldOptions | undefined,
): ZonedDateTimeSlots {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha, // validFieldNames
    timeZoneFieldNames, // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag

  // guaranteed via refineCalendarFields
  const timeZoneId = refineTimeZoneString(fields.timeZone!)

  const [overflow, offsetDisambig, epochDisambig] =
    refineZonedFieldOptions(options)
  const isoDateFields = calendarOps.dateFromFields(
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

export function refinePlainDateTimeBag(
  calendarOps: DateRefineOps,
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): PlainDateTimeSlots {
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
    fabricateOverflowOptions(overflow),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  const isoFields = checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })

  return createPlainDateTimeSlots(isoFields)
}

export function refinePlainDateBag(
  calendarOps: DateRefineOps,
  bag: DateBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): PlainDateSlots {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    requireFields,
  )

  return calendarOps.dateFromFields(fields as any, options)
}

export function refinePlainYearMonthBag(
  calendarOps: YearMonthRefineOps,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): PlainYearMonthSlots {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return calendarOps.yearMonthFromFields(fields, options)
}

export function refinePlainMonthDayBag(
  calendarOps: MonthDayRefineOps,
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
  requireFields: string[] = [], // when called from Calendar
): PlainMonthDaySlots {
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

export function zonedDateTimeWithFields(
  getCalendarOps: (calendarId: string) => DateModOps,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const { calendar, timeZone } = zonedDateTimeSlots
  const calendarOps = getCalendarOps(calendar)
  const timeZoneOps = getTimeZoneOps(timeZone)

  return createZonedDateTimeSlots(
    mergeZonedDateTimeBag(
      calendarOps,
      timeZoneOps,
      initialFields,
      modFields,
      options,
    ),
    timeZone,
    calendar,
  )
}

export function plainDateTimeWithFields(
  getCalendarOps: (calendarId: string) => DateModOps,
  plainDateTimeSlots: PlainDateTimeSlots,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  const calendarId = plainDateTimeSlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return createPlainDateTimeSlots(
    mergePlainDateTimeBag(calendarOps, initialFields, modFields, options),
  )
}

export function plainDateWithFields(
  getCalendarOps: (calendarId: string) => DateModOps,
  plainDateSlots: PlainDateSlots,
  initialFields: DateBag,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  const calendarId = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return mergePlainDateBag(calendarOps, initialFields, modFields, options)
}

export function plainYearMonthWithFields(
  getCalendarOps: (calendar: string) => YearMonthModOps,
  plainYearMonthSlots: PlainYearMonthSlots,
  initialFields: YearMonthBag,
  modFields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const calendarId = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return createPlainYearMonthSlots(
    mergePlainYearMonthBag(calendarOps, initialFields, modFields, options),
  )
}

export function plainMonthDayWithFields(
  getCalendarOps: (calendarId: string) => MonthDayModOps,
  plainMonthDaySlots: PlainMonthDaySlots,
  initialFields: MonthDayBag,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  const calendarId = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarId)

  return mergePlainMonthDayBag(calendarOps, initialFields, modFields, options)
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

function mergeZonedDateTimeBag(
  calendarOps: DateModOps,
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
  ) as ZonedDateTimeBag

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(
    options,
    OffsetDisambig.Prefer,
  )
  const isoDateFields = calendarOps.dateFromFields(
    fields as any,
    fabricateOverflowOptions(overflow),
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

function mergePlainDateTimeBag(
  calendarOps: DateModOps,
  initialFields: DateTimeBag,
  modFields: DateTimeBag,
  options: OverflowOptions | undefined,
): DateTimeSlots {
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
    fabricateOverflowOptions(overflow),
    /* doingMerge = */ true,
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

function mergePlainDateBag(
  calendarOps: DateModOps,
  initialFields: DateBag,
  modFields: DateBag,
  options: OverflowOptions | undefined,
): PlainDateSlots {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    dateFieldNamesAlpha,
  )

  return calendarOps.dateFromFields(
    fields as any,
    options,
    /* doingMerge = */ true,
  )
}

function mergePlainYearMonthBag(
  calendarOps: YearMonthModOps,
  initialFields: YearMonthBag,
  modFields: YearMonthBag,
  options: OverflowOptions | undefined,
): PlainYearMonthSlots {
  const fields = mergeCalendarFields(
    calendarOps,
    initialFields,
    modFields,
    yearMonthFieldNames,
  )

  return calendarOps.yearMonthFromFields(
    fields,
    options,
    /* doingMerge = */ true,
  )
}

function mergePlainMonthDayBag(
  calendarOps: MonthDayModOps,
  initialFields: MonthDayBag,
  modFields: MonthDayBag,
  options: OverflowOptions | undefined,
): PlainMonthDaySlots {
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

export function convertToPlainMonthDay(
  calendarOps: MonthDayRefineOps,
  input: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const fields = refineCalendarFields(
    calendarOps,
    input,
    monthCodeDayFieldNames,
  )
  return calendarOps.monthDayFromFields(fields)
}

export function convertToPlainYearMonth(
  calendarOps: YearMonthRefineOps,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const fields = refineCalendarFields(
    calendarOps,
    input,
    yearMonthCodeFieldNames,
  )
  return calendarOps.yearMonthFromFields(fields, options)
}

export function convertPlainMonthDayToDate(
  calendarOps: DateModOps,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
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
export function convertPlainYearMonthToDate(
  calendarOps: DateModOps,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  return convertToIso(
    calendarOps,
    input,
    yearMonthCodeFieldNames, // inputFieldNames
    requireObjectLike(bag), // extra
    dayFieldNames, // extraFieldNames
  )
}

function convertToIso(
  calendarOps: DateModOps,
  input: any,
  inputFieldNames: string[], // must be alphabetized!!!
  extra: any,
  extraFieldNames: string[], // must be alphabetized!!!
): PlainDateSlots {
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
  doingMerge?: boolean,
): PlainDateSlots {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow, doingMerge)
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
  doingMerge?: boolean,
): PlainYearMonthSlots {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow, doingMerge)
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
): PlainMonthDaySlots {
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
        normalMonth!,
        1,
        isoMonthsInYear,
        Overflow.Reject,
      ) // reject because never leap months
      normalDay = clampEntity(
        'day',
        normalDay,
        1,
        computeIsoDaysInMonth(
          year !== undefined ? year : normalYear!,
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
    checkIsoDateInBounds(this.isoFields(normalYear, normalMonth, normalDay)),
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
  doingMerge?: boolean,
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = refineMonthCode(
      calendarNative,
      monthCode,
      year,
      overflow,
    )

    if (!doingMerge) {
      if (month !== undefined && month !== monthByCode) {
        throw new RangeError(errorMessages.mismatchingMonthAndCode)
      }
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
