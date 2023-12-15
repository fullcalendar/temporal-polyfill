import {
  DateBag,
  DateTimeBag,
  DayFields,
  DurationBag,
  MonthDayBag,
  TimeBag,
  YearFields,
  YearMonthBag,
  dateFieldNamesAsc,
  dayFieldNames,
  monthCodeDayFieldNames,
  offsetFieldNames,
  timeAndOffsetFieldNames,
  timeAndZoneFieldNames,
  timeFieldDefaults,
  timeFieldNamesAsc,
  timeFieldsToIso,
  timeZoneFieldNames,
  yearFieldNames,
  yearMonthCodeFieldNames,
  yearMonthFieldNames,
} from '../internal/calendarFields'
import {
  DurationFieldsWithSign,
  durationFieldDefaults,
  durationFieldNamesAsc,
  updateDurationFieldsSign,
} from '../internal/durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, constrainIsoTimeFields } from '../internal/isoFields'
import { parseOffsetNano } from '../internal/isoParse'
import { EpochDisambig, OffsetDisambig, Overflow } from '../internal/options'
import { ensureObjectlike } from '../internal/cast'
import { Callable, pluckProps } from '../internal/utils'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds, isoEpochFirstLeapYear } from '../internal/isoMath'
import { getMatchingInstantFor, getSingleInstantFor, TimeZoneOps } from '../internal/timeZoneOps'
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
import { builtinRefiners } from './refineConfig'

const timeFieldNamesAlpha = timeFieldNamesAsc.slice().sort()
const durationFieldNamesAlpha = durationFieldNamesAsc.slice().sort()

// -------------------------------------------------------------------------------------------------

export function convertPlainDateTimeToZoned(
  timeZoneOps: TimeZoneOps,
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): DayTimeNano {
  const epochDisambig = refineEpochDisambigOptions(options)
  return checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneOps, isoFields, epochDisambig),
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
  getTimeZoneOps: (timeZoneArg: T) => TimeZoneOps,
  bag: ZonedDateTimeBag<unknown, TA>,
): {
  epochNanoseconds: DayTimeNano,
  timeZone: T,
} | IsoDateTimeFields {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAsc, // validFieldNames
    [], // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag<unknown, TA>

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarOps.dateFromFields(fields as any, Overflow.Constrain)
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
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  bag: ZonedDateTimeBag<unknown, TA>,
  options: ZonedFieldOptions | undefined,
): {
  epochNanoseconds: DayTimeNano,
  timeZone: T,
} {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAsc, // validFieldNames
    timeZoneFieldNames, // requireFields
    timeAndZoneFieldNames, // forcedValidFieldNames
  ) as ZonedDateTimeBag<unknown, TA>

  // must happen before Calendar::dateFromFields and parsing `options`
  const timeZoneSlot = refineTimeZoneArg(fields.timeZone!) // guaranteed via refineCalendarFields
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
  const isoDateFields = calendarOps.dateFromFields(fields as any, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
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
  timeZoneOps: TimeZoneOps,
  zonedDateTime: any,
  mod: DateTimeBag, // TODO: allow offset. correct base type tho?
  options: ZonedFieldOptions | undefined,
): DayTimeNano {
  const fields = mergeCalendarFields(
    calendarOps,
    zonedDateTime as any,
    mod,
    dateFieldNamesAsc, // validFieldNames
    timeAndOffsetFieldNames, // forcedValidFieldNames
    offsetFieldNames, // requiredObjFieldNames
  ) as ZonedDateTimeBag<unknown, unknown>

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options, true)
  const isoDateFields = calendarOps.dateFromFields(fields as any, overflow)
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

export function refinePlainDateTimeBag(
  calendarOps: DateRefineOps,
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields {
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNamesAsc,
    [], // requiredFields
    timeFieldNamesAsc, // forcedValidFieldNames
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
    dateFieldNamesAsc, // validFieldNames
    timeFieldNamesAsc, // forcedValidFieldNames
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
    dateFieldNamesAsc,
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
    dateFieldNamesAsc,
  )
  const overflow = refineOverflowOptions(options)

  return calendarOps.dateFromFields(fields as any, overflow)
}

function convertToIso(
  calendarOps: DateModOps,
  input: any,
  inputFieldNames: string[], // must be alphabetized!!!
  extra: {},
  extraFieldNames: string[], // must be alphabetized!!!
  options?: OverflowOptions, // YUCK!
): IsoDateFields {
  inputFieldNames = calendarOps.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarOps.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarOps.mergeFields(input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames].sort(), [])

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
    yearMonthFieldNames,
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
    yearMonthFieldNames,
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
  return convertToIso(
    calendarOps,
    plainYearMonth, // input
    yearMonthCodeFieldNames, // inputFieldNames
    ensureObjectlike(bag), // extra
    dayFieldNames, // extraFieldNames
  )
}

export function convertToPlainYearMonth(
  calendarOps: YearMonthRefineOps,
  input: any,
  options?: OverflowOptions,
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarOps,
    input as any,
    yearMonthCodeFieldNames,
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
    dateFieldNamesAsc,
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
    dateFieldNamesAsc,
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
    monthCodeDayFieldNames,
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
    plainMonthDay, // input
    monthCodeDayFieldNames, // inputFieldNames
    ensureObjectlike(bag), // extra
    yearFieldNames, // extraFieldNames
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

export function refineDurationBag(bag: DurationBag): DurationFieldsWithSign {
  // refine in 'partial' mode
  const durationFields = refineFields(bag, durationFieldNamesAlpha) as DurationBag

  return updateDurationFieldsSign({
    ...durationFieldDefaults,
    ...durationFields
  })
}

export function mergeDurationBag(
  durationInternals: DurationFieldsWithSign,
  bag: DurationBag
): DurationFieldsWithSign {
  const partialDurationFields = refineFields(bag, durationFieldNamesAlpha)
  return updateDurationFieldsSign({ ...durationInternals, ...partialDurationFields })
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
