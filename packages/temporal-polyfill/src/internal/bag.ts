import { isoCalendarId, japaneseCalendarId } from './calendarConfig'
import { DateBag, DateFields, DateTimeBag, DateTimeFields, DayFields, DurationBag, EraYearFields, EraYearOrYear, MonthDayBag, MonthDayFields, MonthFields, TimeBag, TimeFields, YearFields, YearMonthBag, YearMonthFieldsIntl, allYearFieldNames, dateFieldNamesAlpha, dayFieldNames, eraYearFieldNames, monthCodeDayFieldNames, monthDayFieldNames, monthFieldNames, offsetFieldNames, timeAndOffsetFieldNames, timeAndZoneFieldNames, timeFieldDefaults, timeFieldNamesAsc, timeFieldsToIso, timeZoneFieldNames, yearFieldNames, yearMonthCodeFieldNames, yearMonthFieldNames } from './calendarFields'
import { computeIsoDaysInMonth, isoMonthsInYear } from './calendarIso'
import { NativeDateRefineDeps, NativeMonthDayRefineOps, NativeYearMonthRefineDeps, eraYearToYear, getCalendarEraOrigins, getCalendarId, getCalendarLeapMonthMeta, monthCodeNumberToMonth, parseMonthCode } from './calendarNative'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, constrainIsoTimeFields } from './calendarIsoFields'
import { isoEpochFirstLeapYear } from './calendarIso'
import { checkEpochNanoInBounds, checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds } from './epochAndTime'
import { EpochDisambig, OffsetDisambig, Overflow } from './options'
import { Callable, clampEntity, mapPropNamesToConstant, pluckProps } from './utils'
import { EpochDisambigOptions, OverflowOptions, ZonedFieldOptions, overflowMapNames, prepareOptions, refineEpochDisambigOptions, refineOverflowOptions, refineZonedFieldOptions } from './optionsRefine'
import { DurationFields, durationFieldDefaults, durationFieldNamesAsc } from './durationFields'
import { TimeZoneOps, getMatchingInstantFor, getSingleInstantFor } from './timeZoneOps'
import { DayTimeNano } from './dayTimeNano'
import { DateModOps, DateRefineOps, FieldsOp, MergeFieldsOp, MonthDayModOps, MonthDayRefineOps, YearMonthModOps, YearMonthRefineOps } from './calendarOps'
import { parseOffsetNano } from './parseIso'
import { ensureObjectlike, toInteger, toPositiveInteger, toStrictInteger, toStringViaPrimitive } from './cast'
import { checkDurationFields } from './durationMath'
import { DurationBranding, DurationSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from './slots'

export type PlainDateBag<C> = DateBag & { calendar?: C }
export type PlainDateTimeBag<C> = DateBag & TimeBag & { calendar?: C }
export type ZonedDateTimeBag<C, T> = PlainDateTimeBag<C> & { timeZone: T, offset?: string }
export type PlainTimeBag = TimeBag
export type PlainYearMonthBag<C> = YearMonthBag & { calendar?: C }
export type PlainMonthDayBag<C> = MonthDayBag & { calendar?: C }

const timeFieldNamesAlpha = timeFieldNamesAsc.slice().sort()
const durationFieldNamesAlpha = durationFieldNamesAsc.slice().sort()

// Config
// -------------------------------------------------------------------------------------------------
// These should refine things on INPUT of user-entered fields and should allow {valueOf()}

const dateFieldRefiners = {
  era: toStringViaPrimitive,
  eraYear: toInteger,
  year: toInteger,
  month: toPositiveInteger,
  monthCode: toStringViaPrimitive,
  day: toPositiveInteger,
}

const timeFieldRefiners = mapPropNamesToConstant(timeFieldNamesAsc, toInteger)

const durationFieldRefiners = mapPropNamesToConstant(durationFieldNamesAsc, toStrictInteger)

const builtinRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  offset: toStringViaPrimitive,
}


// -------------------------------------------------------------------------------------------------

export function durationWithFields(
  slots: DurationSlots,
  fields: DurationBag,
): DurationSlots {
  return {
    ...mergeDurationBag(slots, fields),
    branding: DurationBranding,
  }
}

export function plainDateWithFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateSlots: PlainDateSlots<C>,
  initialFields: DateFields & Partial<EraYearFields>,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainDateBag(calendarOps, initialFields, modFields, optionsCopy),
    branding: PlainDateBranding,
  }
}

export function plainMonthDayWithFields<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayModOps<C>,
  plainMonthDaySlots: PlainMonthDaySlots<C>,
  initialFields: MonthDayFields,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainMonthDayBag(calendarOps, initialFields, modFields, optionsCopy),
    branding: PlainMonthDayBranding,
  }
}

export function plainYearMonthWithFields<C>(
  getCalendarOps: (calendar: C) => YearMonthModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainYearMonthBag(calendarOps, initialFields, mod, optionsCopy),
    branding: PlainYearMonthBranding,
  }
}

export function plainDateTimeWithFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  initialFields: DateTimeFields & Partial<EraYearFields>,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainDateTimeSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainDateTimeBag(
      calendarOps,
      initialFields,
      modFields,
      optionsCopy,
    ),
    branding: PlainDateTimeBranding,
  }
}

export function zonedDateTimeWithFields<C, T>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  initialFields: DateTimeFields & Partial<EraYearFields>, // TODO: allow offset
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  const optionsCopy = prepareOptions(options)
  const { calendar, timeZone } = zonedDateTimeSlots

  return {
    calendar,
    timeZone,
    epochNanoseconds: mergeZonedDateTimeBag(
      getCalendarOps(calendar),
      getTimeZoneOps(timeZone),
      initialFields,
      modFields,
      optionsCopy,
    ),
    branding: ZonedDateTimeBranding,
  }
}

export function plainTimeWithFields(
  initialFields: TimeFields, // NOTE: does not accept PlainTimeFields!
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return {
    ...mergePlainTimeBag(initialFields, mod, options),
    branding: PlainTimeBranding,
  }
}

// -------------------------------------------------------------------------------------------------

export function convertPlainDateTimeToZoned<TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  timeZoneSlot: TZ,
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): DayTimeNano {
  const epochDisambig = refineEpochDisambigOptions(options)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneOps, isoFields, epochDisambig),
  )
}

// Other Stuff
// -------------------------------------------------------------------------------------------------

/*
TODO: make more DRY with other methods
*/
export function refineMaybeZonedDateTimeBag<C, TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeZoneArg: T) => TimeZoneOps,
  calendarOps: DateRefineOps<C>,
  bag: ZonedDateTimeBag<unknown, TA>,
): {
  epochNanoseconds: DayTimeNano,
  timeZone: T,
} | IsoDateTimeFields {
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
      false, // z?
      OffsetDisambig.Reject, // TODO: is default already?
      EpochDisambig.Compat, // TODO: is default already?
      false, // fuzzy
    )

    return { epochNanoseconds, timeZone: timeZoneSlot }
  } else {
    const isoDateInternals = calendarOps.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    return { ...isoDateInternals, ...isoTimeFields }
  }
}

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

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

  const timeZoneSlot = refineTimeZoneArg(fields.timeZone!) // guaranteed via refineCalendarFields
  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
  const isoDateFields = calendarOps.dateFromFields(
    fields as any,
    options && Object.assign(Object.create(null), { ...options, overflow: overflowMapNames[overflow] }),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    { ...isoDateFields, ...isoTimeFields },
    fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    false, // z?
    offsetDisambig,
    epochDisambig,
    false, // fuzzy
  )

  return {
    epochNanoseconds,
    timeZone: timeZoneSlot,
    calendar: calendarSlot,
    branding: ZonedDateTimeBranding,
  }
}

export function mergeZonedDateTimeBag<C>(
  calendarOps: DateModOps<C>,
  timeZoneOps: TimeZoneOps,
  zonedDateTime: any,
  mod: DateTimeBag, // TODO: allow offset. correct base type tho?
  options: ZonedFieldOptions | undefined,
): DayTimeNano {
  const fields = mergeCalendarFields(
    calendarOps,
    zonedDateTime as any,
    mod,
    dateFieldNamesAlpha, // validFieldNames
    timeAndOffsetFieldNames, // forcedValidFieldNames
    offsetFieldNames, // requiredObjFieldNames
  ) as ZonedDateTimeBag<unknown, unknown>

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options, true)
  const isoDateFields = calendarOps.dateFromFields(
    fields as any,
    options && Object.assign(Object.create(null), { ...options, overflow: overflowMapNames[overflow] }),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    { ...isoDateFields, ...isoTimeFields },
    parseOffsetNano(fields.offset!), // guaranteed via mergeCalendarFields
    false, // z?
    offsetDisambig,
    epochDisambig,
    false, // fuzzy
  )

  return epochNanoseconds
}

// PlainDateTime
// -------------------------------------------------------------------------------------------------

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
    options && Object.assign(Object.create(null), { ...options, overflow: overflowMapNames[overflow] }),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  const isoFields = checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })

  return {
    ...isoFields,
    branding: PlainDateTimeBranding,
  }
}

export function mergePlainDateTimeBag<C>(
  calendarOps: DateModOps<C>,
  plainDateTime: any,
  mod: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields & { calendar: C } {
  const fields = mergeCalendarFields(
    calendarOps,
    plainDateTime,
    mod,
    dateFieldNamesAlpha, // validFieldNames
    timeFieldNamesAsc, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarOps.dateFromFields(
    fields as any,
    options && Object.assign(Object.create(null), { ...options, overflow: overflowMapNames[overflow] }),
  )
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

// PlainDate
// -------------------------------------------------------------------------------------------------

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

  return {
    ...calendarOps.dateFromFields(fields as any, options),
    branding: PlainDateBranding,
  }
}

export function mergePlainDateBag<C>(
  calendarOps: DateModOps<C>,
  plainDate: any,
  mod: DateBag,
  options: OverflowOptions | undefined,
): IsoDateFields & { calendar: C } {
  const fields = mergeCalendarFields(
    calendarOps,
    plainDate,
    mod,
    dateFieldNamesAlpha,
  )

  return calendarOps.dateFromFields(fields as any, options)
}

function convertToIso<C>(
  calendarOps: DateModOps<C>,
  input: any,
  inputFieldNames: string[], // must be alphabetized!!!
  extra: {},
  extraFieldNames: string[], // must be alphabetized!!!
  options?: OverflowOptions, // YUCK!
): IsoDateFields & { calendar: C } {
  inputFieldNames = calendarOps.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarOps.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarOps.mergeFields(input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames].sort(), [])

  return calendarOps.dateFromFields(mergedFields as any, options)
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

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

  return {
    ...calendarOps.yearMonthFromFields(fields, options),
    branding: PlainYearMonthBranding,
  }
}

export function mergePlainYearMonthBag<C>(
  calendarOps: YearMonthModOps<C>,
  plainYearMonth: any,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
): IsoDateFields & { calendar: C } {
  const fields = mergeCalendarFields(
    calendarOps,
    plainYearMonth,
    bag,
    yearMonthFieldNames,
  )

  return calendarOps.yearMonthFromFields(fields, options)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate<C>(
  calendarOps: DateModOps<C>,
  plainYearMonth: any,
  bag: DayFields,
): IsoDateFields & { calendar: C } {
  return convertToIso(
    calendarOps,
    plainYearMonth, // input
    yearMonthCodeFieldNames, // inputFieldNames
    ensureObjectlike(bag), // extra
    dayFieldNames, // extraFieldNames
  )
}

export function convertToPlainYearMonth<C>(
  calendarOps: YearMonthRefineOps<C>,
  input: any,
  options?: OverflowOptions,
): IsoDateFields & { calendar: C } {
  const fields = refineCalendarFields(
    calendarOps,
    input as any,
    yearMonthCodeFieldNames,
  )

  return calendarOps.yearMonthFromFields(fields, options)
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

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
  if (calendarAbsent && fields.month !== undefined && fields.monthCode === undefined && fields.year === undefined) {
    fields.year = isoEpochFirstLeapYear
  }

  return {
    ...calendarOps.monthDayFromFields(fields, options),
    branding: PlainMonthDayBranding,
  }
}

export function mergePlainMonthDayBag<C>(
  calendarOps: MonthDayModOps<C>,
  plainMonthDay: any,
  bag: MonthDayBag,
  options: OverflowOptions | undefined,
): IsoDateFields & { calendar: C } {
  const fields = mergeCalendarFields(
    calendarOps,
    plainMonthDay,
    bag,
    dateFieldNamesAlpha,
  )

  return calendarOps.monthDayFromFields(fields, options)
}

export function convertToPlainMonthDay<C>(
  calendarOps: MonthDayRefineOps<C>,
  input: any,
): IsoDateFields & { calendar: C } {
  const fields = refineCalendarFields(
    calendarOps,
    input as any,
    monthCodeDayFieldNames,
  )

  return calendarOps.monthDayFromFields(fields)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainMonthDayToDate<C>(
  calendarOps: DateModOps<C>,
  plainMonthDay: any,
  bag: YearFields,
): IsoDateFields & { calendar: C } {
  return convertToIso(
    calendarOps,
    plainMonthDay, // input
    monthCodeDayFieldNames, // inputFieldNames
    ensureObjectlike(bag), // extra
    yearFieldNames, // extraFieldNames
    { overflow: 'constrain' }, // unlike others. correct. unforunately needs to parse
  )
}

// PlainTime
// -------------------------------------------------------------------------------------------------

export function refinePlainTimeBag(
  bag: TimeBag,
  options: OverflowOptions | undefined,
): PlainTimeSlots {
  const overflow = refineOverflowOptions(options) // spec says overflow parsed first
  const fields = refineFields(bag, timeFieldNamesAlpha, [], true) as TimeBag // disallowEmpty

  return {
    ...refineTimeBag(fields, overflow),
    branding: PlainTimeBranding,
  }
}

export function mergePlainTimeBag(
  plainTime: any,
  bag: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options) // spec says overflow parsed first
  const fields = pluckProps(timeFieldNamesAlpha, plainTime)
  const partialFields = refineFields(bag, timeFieldNamesAlpha)
  const mergeFields = { ...fields, ...partialFields }

  return refineTimeBag(mergeFields, overflow)
}

function refineTimeBag(fields: TimeBag, overflow?: Overflow): IsoTimeFields {
  return constrainIsoTimeFields(timeFieldsToIso({ ...timeFieldDefaults, ...fields }), overflow)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag: DurationBag): DurationSlots {
  // refine in 'partial' mode
  const durationFields = refineFields(bag, durationFieldNamesAlpha) as DurationBag

  return {
    branding: DurationBranding,
    ...checkDurationFields({
      ...durationFieldDefaults,
      ...durationFields
    }),
  }
}

export function mergeDurationBag(
  durationFields: DurationFields,
  bag: DurationBag
): DurationFields {
  const partialDurationFields = refineFields(bag, durationFieldNamesAlpha)

  return checkDurationFields({
    ...durationFields,
    ...partialDurationFields,
  })
}

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

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

function mergeCalendarFields(
  calendarOps: { fields: FieldsOp, mergeFields: MergeFieldsOp },
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[], // does NOT need to be alphabetized
  forcedValidFieldNames: string[] = [],
  requiredObjFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarOps.fields(validFieldNames),
    ...forcedValidFieldNames
  ].sort()

  let fields = refineFields(obj, fieldNames, requiredObjFieldNames)
  const partialFields = refineFields(bag, fieldNames)

  fields = calendarOps.mergeFields(fields, partialFields)
  return refineFields(fields, fieldNames, []) // guard against ridiculous .mergeField results
}

// Generic Refining
// -------------------------------------------------------------------------------------------------

/*
If `requiredFieldNames` is undefined, assume 'partial' mode where defaults don't apply
*/
function refineFields(
  bag: Record<string, unknown>,
  validFieldNames: string[], // must be alphabetized!!!
  requiredFieldNames?: string[],
  disallowEmpty: boolean = !requiredFieldNames,
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let anyMatching = false
  let prevFieldName: undefined | string

  for (const fieldName of validFieldNames) {
    if (fieldName === prevFieldName) {
      throw new RangeError('Duplicate field names')
    }
    if (fieldName === 'constructor' || fieldName === '__proto__') {
      throw new RangeError('Invalid field name')
    }

    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      anyMatching = true

      if (builtinRefiners[fieldName as keyof typeof builtinRefiners]) {
        fieldVal = (builtinRefiners[fieldName as keyof typeof builtinRefiners] as Callable)(fieldVal)
      }

      res[fieldName] = fieldVal
    } else if (requiredFieldNames) {
      if (requiredFieldNames.includes(fieldName)) { // TODO: have caller use a Set
        throw new TypeError('Missing required field name')
      }

      res[fieldName] = timeFieldDefaults[fieldName as keyof typeof timeFieldDefaults]
    }

    prevFieldName = fieldName
  }

  // only check zero fields during .with() calls
  // for .from() calls, empty-bag-checking will happen within the CalendarImpl
  if (disallowEmpty && !anyMatching) {
    throw new TypeError('No valid fields')
  }

  return res
}

// -------------------------------------------------------------------------------------------------

export function nativeDateFromFields(
  this: NativeDateRefineDeps,
  fields: DateBag,
  options?: OverflowOptions,
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const day = refineDay(this, fields as DayFields, month, year, overflow)
  const isoFields = this.isoFields(year, month, day)

  return {
    ...checkIsoDateInBounds(isoFields),
    calendar: getCalendarId(this),
  }
}

export function nativeYearMonthFromFields(
  this: NativeYearMonthRefineDeps,
  fields: YearMonthBag,
  options?: OverflowOptions,
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const isoFields = this.isoFields(year, month, 1)

  return {
    ...checkIsoYearMonthInBounds(isoFields),
    calendar: getCalendarId(this),
  }
}

export function nativeMonthDayFromFields(
  this: NativeMonthDayRefineOps,
  fields: DateBag,
  options?: OverflowOptions
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  let isIso = getCalendarId(this) === isoCalendarId // HACK
  let { monthCode } = fields as Partial<MonthFields>
  let monthCodeNumber: number
  let isLeapMonth: boolean
  let year: number | undefined
  let month: number | undefined
  let day: number

  if (monthCode !== undefined) {
    [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)

    // simulate refineDay :(
    if (monthCodeNumber <= 0) {
      throw new RangeError('Below zero')
    }
    if (fields.day === undefined) {
      throw new TypeError('Must specify day')
    }
    day = fields.day

    const res = this.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
    if (!res) {
      throw new RangeError('Could not guess year')
    }
    [year, month] = res

    if (fields.month !== undefined && fields.month !== month) {
      throw new RangeError('Inconsistent month/monthCode')
    }
    if (isIso) {
      month = clampEntity(
        'month',
        month,
        1,
        isoMonthsInYear,
        Overflow.Reject, // always reject bad iso months
      )
      day = clampEntity(
        'day',
        day,
        1,
        computeIsoDaysInMonth(fields.year ?? year, month),
        overflow,
      )
    }

  } else {
    year = (fields.year === undefined && isIso)
      ? isoEpochFirstLeapYear
      : refineYear(this, fields as EraYearOrYear)

    month = refineMonth(this, fields, year, overflow)
    day = refineDay(this, fields as DayFields, month, year, overflow)

    const leapMonth = this.leapMonth(year)
    isLeapMonth = month === leapMonth
    monthCodeNumber = month - ( // TODO: more DRY with formatMonthCode
      (leapMonth && month >= leapMonth)
        ? 1
        : 0)

    const res = this.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
    if (!res) {
      throw new RangeError('Could not guess year')
    }
    [year, month] = res
  }

  return {
    ...this.isoFields(year, month, day),
    calendar: getCalendarId(this),
  }
}

function refineYear(
  calendarNative: NativeYearMonthRefineDeps,
  fields: DateBag
): number {
  let { era, eraYear, year } = fields
  const eraOrigins = getCalendarEraOrigins(calendarNative)

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError('Must define both era and eraYear')
    }

    if (!eraOrigins) {
      throw new RangeError('Does not accept era/eraYear')
    }

    const eraOrigin = eraOrigins[era]
    if (eraOrigin === undefined) {
      throw new RangeError('Unknown era')
    }

    const yearByEra = eraYearToYear(eraYear, eraOrigin)

    if (year !== undefined && year !== yearByEra) {
      throw new RangeError('The year and era/eraYear must agree')
    }

    year = yearByEra
  } else if (year === undefined) {
    throw new TypeError('Must specify year' + (eraOrigins ? ' or era/eraYear' : ''))
  }

  return year
}

function refineMonth(
  calendarNative: NativeYearMonthRefineDeps,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = refineMonthCode(calendarNative, monthCode, year, overflow)

    if (month !== undefined && month !== monthByCode) {
      throw new RangeError('The month and monthCode do not agree')
    }

    month = monthByCode
    overflow = Overflow.Reject // monthCode parsing doesn't constrain
  } else if (month === undefined) {
    throw new TypeError('Must specify either month or monthCode')
  }

  // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
  if (month <= 0) {
    throw new RangeError('Below zero')
  }

  return clampEntity(
    'month',
    month,
    1,
    calendarNative.monthsInYearPart(year),
    overflow
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
      throw new RangeError('Calendar system doesnt support leap months')
    }

    // leap year has a maximum
    else if (leapMonthMeta > 0) {
      if (month > leapMonthMeta) {
        throw new RangeError('Invalid leap-month month code')
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError('Invalid leap-month month code')
        } else {
          month-- // M05L -> M05
        }
      }
    }

    // leap year is constant
    else {
      if (month !== -leapMonthMeta) {
        throw new RangeError('Invalid leap-month month code')
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError('Invalid leap-month month code')
        } else {
           // ex: M05L -> M06
        }
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
  overflow?: Overflow
): number {
  const { day } = fields

  if (day === undefined) {
    throw new TypeError('Must specify day')
  }

  // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
  if (day <= 0) {
    throw new RangeError('Below zero')
  }

  return clampEntity(
    'day',
    day,
    1,
    calendarNative.daysInMonthParts(year, month),
    overflow
  )
}

// -------------------------------------------------------------------------------------------------

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
  additionalFields: Record<string, unknown>
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins(this)) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // eras begin mid-year?
    if (getCalendarId(this) === japaneseCalendarId) {
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
    for (const deletablePropName of (deletablePropNames || nonMatchingPropNames)) {
      delete dest[deletablePropName]
    }
  }
}
