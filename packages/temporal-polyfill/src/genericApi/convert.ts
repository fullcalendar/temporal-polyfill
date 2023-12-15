import {
  DateBag,
  DateTimeBag,
  DayFields,
  DurationBag,
  MonthDayBag,
  TimeBag,
  YearFields,
  YearMonthBag,
  dateFieldNamesAlpha,
  dateTimeFieldRefiners,
  eraYearFieldRefiners,
  monthDayBasicNamesAlpha,
  timeFieldDefaults,
  timeFieldNamesAlpha,
  timeFieldsToIso,
  yearMonthBasicNamesAlpha,
  yearMonthFieldNamesAlpha,
} from '../internal/calendarFields'
import {
  DurationFieldsWithSign,
  durationFieldDefaults,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from '../internal/durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, constrainIsoTimeFields } from '../internal/isoFields'
import { parseOffsetNano } from '../internal/isoParse'
import { EpochDisambig, OffsetDisambig, Overflow } from '../internal/options'
import { ensureObjectlike, ensureStringViaPrimitive } from '../internal/cast'
import { Callable, pluckProps } from '../internal/utils'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds, isoEpochFirstLeapYear } from '../internal/isoMath'
import { getMatchingInstantFor, getSingleInstantFor } from '../internal/timeZoneMath'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from '../internal/timeZoneRecord'
import { DayTimeNano } from '../internal/dayTimeNano'
import {
  EpochDisambigOptions,
  OverflowOptions,
  ZonedFieldOptions,
  refineEpochDisambigOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './options'
import { ZonedDateTimeBag } from './genericBag'
import { DateModOps, DateRefineOps, FieldsOp, MergeFieldsOp, MonthDayModOps, MonthDayRefineOps, YearMonthModOps, YearMonthRefineOps } from '../internal/calendarOps'

export function convertPlainDateTimeToZoned(
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): DayTimeNano {
  const epochDisambig = refineEpochDisambigOptions(options)
  return checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneRecord, isoFields, epochDisambig),
  )
}

// Other Stuff
// -------------------------------------------------------------------------------------------------

/*
TODO: make more DRY with other methods
*/
export function refineMaybeZonedDateTimeBag<TA, T>(
  calendarOps: DateRefineOps,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneRecord: (timeZoneArg: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
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
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag<unknown, TA>

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarOps.dateFromFields(fields as any, Overflow.Constrain)
    const isoTimeFields = refineTimeBag(fields)

    // must happen after datetime fields
    const timeZoneSlot = refineTimeZoneArg(fields.timeZone)
    const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneRecord,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
      false, // z?
      OffsetDisambig.Reject, // TODO: is default already?
      EpochDisambig.Compat, // TODO: is default already?
      false, // fuzzy
    )

    return { epochNanoseconds, timeZone: timeZoneSlot }
  } else {
    const isoDateInternals = calendarOps.dateFromFields(fields as any, Overflow.Constrain)
    const isoTimeFields = refineTimeBag(fields)

    return { ...isoDateInternals, ...isoTimeFields }
  }
}

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag<TA, T>(
  calendarOps: DateRefineOps,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  bag: ZonedDateTimeBag<unknown, TA>,
  options: ZonedFieldOptions | undefined,
): {
  epochNanoseconds: DayTimeNano,
  timeZone: T,
} {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha, // validFieldNames
    ['timeZone'], // requireFields
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag<unknown, TA>

  // must happen before Calendar::dateFromFields and parsing `options`
  const timeZoneSlot = refineTimeZoneArg(fields.timeZone!) // guaranteed via refineCalendarFields
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
  const isoDateFields = calendarOps.dateFromFields(fields as any, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneRecord,
    { ...isoDateFields, ...isoTimeFields },
    fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
    false, // z?
    offsetDisambig,
    epochDisambig,
    false, // fuzzy
  )

  return { epochNanoseconds, timeZone: timeZoneSlot }
}

export function mergeZonedDateTimeBag(
  calendarOps: DateModOps,
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTime: any,
  mod: DateTimeBag, // TODO: allow offset. correct base type tho?
  options: ZonedFieldOptions | undefined,
): DayTimeNano {
  const fields = mergeCalendarFields(
    calendarOps,
    zonedDateTime as any,
    mod,
    dateFieldNamesAlpha, // validFieldNames
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second'], // forcedValidFieldNames -- no timeZone!
    ['offset'], // requiredObjFieldNames
  ) as ZonedDateTimeBag<unknown, unknown>

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options, true)
  const isoDateFields = calendarOps.dateFromFields(fields as any, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneRecord,
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

export function refinePlainDateTimeBag(
  calendarOps: DateRefineOps,
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    [], // requiredFields
    timeFieldNamesAlpha, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarOps.dateFromFields(fields as any, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

export function mergePlainDateTimeBag(
  calendarOps: DateModOps,
  plainDateTime: any,
  mod: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields {
  const fields = mergeCalendarFields(
    calendarOps,
    plainDateTime,
    mod,
    dateFieldNamesAlpha,
    timeFieldNamesAlpha, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarOps.dateFromFields(fields as any, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

// PlainDate
// -------------------------------------------------------------------------------------------------

export function refinePlainDateBag(
  calendarOps: DateRefineOps,
  bag: DateBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAlpha,
    requireFields,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.dateFromFields(fields as any, overflow)
}

export function mergePlainDateBag(
  calendarOps: DateModOps,
  plainDate: any,
  mod: DateBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarOps,
    plainDate,
    mod,
    dateFieldNamesAlpha,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.dateFromFields(fields as any, overflow)
}

function convertToIso(
  calendarOps: DateModOps,
  input: any,
  inputFieldNames: string[],
  extra: {},
  extraFieldNames: string[],
  options?: OverflowOptions,
): IsoDateFields {
  inputFieldNames = calendarOps.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarOps.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarOps.mergeFields(input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames], [])

  const overflow = refineOverflowOptions(options)
  return calendarOps.dateFromFields(mergedFields as any, overflow)
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(
  calendarOps: YearMonthRefineOps,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields?: string[],
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    yearMonthFieldNamesAlpha,
    requireFields,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.yearMonthFromFields(fields, overflow)
}

export function mergePlainYearMonthBag(
  calendarOps: YearMonthModOps,
  plainYearMonth: any,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarOps,
    plainYearMonth,
    bag,
    yearMonthFieldNamesAlpha,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.yearMonthFromFields(fields, overflow)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate(
  calendarOps: DateModOps,
  plainYearMonth: any,
  bag: DayFields,
): IsoDateFields {
  return convertToIso(calendarOps, plainYearMonth, yearMonthBasicNamesAlpha, ensureObjectlike(bag), ['day'])
}

export function convertToPlainYearMonth(
  calendarOps: YearMonthRefineOps,
  input: any,
  options?: OverflowOptions,
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarOps,
    input as any,
    yearMonthBasicNamesAlpha,
    [],
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.yearMonthFromFields(fields, overflow)
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(
  calendarOps: MonthDayRefineOps,
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
  requireFields: string[] = [], // when called from Calendar
): IsoDateFields {
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

  const overflow = refineOverflowOptions(options)
  return calendarOps.monthDayFromFields(fields, overflow)
}

export function mergePlainMonthDayBag(
  calendarOps: MonthDayModOps,
  plainMonthDay: any,
  bag: MonthDayBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarOps,
    plainMonthDay,
    bag,
    dateFieldNamesAlpha,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.monthDayFromFields(fields, overflow)
}

export function convertToPlainMonthDay(
  calendarOps: MonthDayRefineOps,
  input: any,
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarOps,
    input as any,
    monthDayBasicNamesAlpha,
    [], // requiredFields
  )

  return calendarOps.monthDayFromFields(fields, Overflow.Constrain)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainMonthDayToDate(
  calendarOps: DateModOps,
  plainMonthDay: any,
  bag: YearFields,
): IsoDateFields {
  return convertToIso(
    calendarOps,
    plainMonthDay,
    monthDayBasicNamesAlpha,
    ensureObjectlike(bag),
    ['year'],
    { overflow: 'reject' }, // unlike others. correct. unforunately needs to parse
  )
}

// PlainTime
// -------------------------------------------------------------------------------------------------

export function refinePlainTimeBag(
  bag: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options) // parse before fields (what!?)
  const fields = refineFields(bag, timeFieldNamesAlpha, [], true) as TimeBag // disallowEmpty

  return refineTimeBag(fields, overflow)
}

export function mergePlainTimeBag(
  plainTime: any,
  bag: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options)
  const fields = pluckProps(timeFieldNamesAlpha, plainTime) // TODO: wish PlainTime had real TS methods
  const partialFields = refineFields(bag, timeFieldNamesAlpha)
  const mergeFields = { ...fields, ...partialFields }

  return refineTimeBag(mergeFields, overflow)
}

function refineTimeBag(fields: TimeBag, overflow?: Overflow): IsoTimeFields {
  return constrainIsoTimeFields(timeFieldsToIso({ ...timeFieldDefaults, ...fields }), overflow)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag: DurationBag): DurationFieldsWithSign {
  // refine in 'partial' mode
  const durationFields = refineFields(bag, durationFieldNames) as DurationBag

  return updateDurationFieldsSign({
    ...durationFieldDefaults,
    ...durationFields
  })
}

export function mergeDurationBag(
  durationInternals: DurationFieldsWithSign,
  bag: DurationBag
): DurationFieldsWithSign {
  const partialDurationFields = refineFields(bag, durationFieldNames)
  return updateDurationFieldsSign({ ...durationInternals, ...partialDurationFields })
}

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

function refineCalendarFields(
  calendarOps: { fields: FieldsOp },
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarOps.fields(validFieldNames),
    ...forcedValidFieldNames,
  ]

  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendarOps: { fields: FieldsOp, mergeFields: MergeFieldsOp },
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  forcedValidFieldNames: string[] = [],
  requiredObjFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarOps.fields(validFieldNames),
    ...forcedValidFieldNames
  ]

  let fields = refineFields(obj, fieldNames, requiredObjFieldNames)
  const partialFields = refineFields(bag, fieldNames)

  fields = calendarOps.mergeFields(fields, partialFields)
  return refineFields(fields, fieldNames, []) // guard against ridiculous .mergeField results
}

// Generic Refining
// -------------------------------------------------------------------------------------------------

const builtinRefiners = {
  ...eraYearFieldRefiners,
  ...dateTimeFieldRefiners,
  ...durationFieldRefiners,
  offset: ensureStringViaPrimitive,
}

const builtinDefaults = timeFieldDefaults

/*
If `requiredFieldNames` is undefined, assume 'partial' mode where defaults don't apply
*/
function refineFields(
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames?: string[],
  disallowEmpty: boolean = !requiredFieldNames,
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let anyMatching = false
  let prevFieldName: undefined | string

  // sort alphabetically
  validFieldNames.sort()

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

      res[fieldName] = builtinDefaults[fieldName as keyof typeof builtinDefaults]
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
