import {
  DateBag,
  DateTimeBag,
  DayFields,
  DurationBag,
  MonthDayBag,
  TimeBag,
  YearFields,
  YearMonthBag,
  dateFieldNames,
  dateTimeFieldRefiners,
  eraYearFieldRefiners,
  monthDayBasicNames,
  timeFieldDefaults,
  timeFieldNames,
  timeFieldsToIso,
  yearMonthBasicNames,
  yearMonthFieldNames,
} from './calendarFields'
import {
  DurationFieldsWithSign,
  durationFieldDefaults,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, constrainIsoTimeFields } from './isoFields'
import { parseOffsetNano } from './isoParse'
import {
  EpochDisambig,
  EpochDisambigOptions,
  OffsetDisambig,
  Overflow,
  OverflowOptions,
  ZonedFieldOptions,
  refineEpochDisambigOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './options'
import {
  ensureObjectlike,
  ensureStringViaPrimitive,
} from './cast'
import { Callable, pluckProps } from './utils'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds, isoEpochFirstLeapYear } from './isoMath'
import { getMatchingInstantFor, getSingleInstantFor } from './timeZoneMath'
import { CalendarDateFromFieldsFunc, CalendarFieldsFunc, CalendarMergeFieldsFunc, CalendarMonthDayFromFieldsFunc, CalendarYearMonthFromFieldsFunc } from './calendarRecordTypes'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'
import { DayTimeNano } from './dayTimeNano'
import { ZonedDateTimeBag } from './genericBag'

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
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
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
    calendarRecord,
    bag,
    dateFieldNames, // validFieldNames
    [], // requireFields
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag<unknown, TA>

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarRecord.dateFromFields(fields as any)
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
    const isoDateInternals = calendarRecord.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    return { ...isoDateInternals, ...isoTimeFields }
  }
}

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag<TA, T>(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
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
    calendarRecord,
    bag,
    dateFieldNames, // validFieldNames
    ['timeZone'], // requireFields
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag<unknown, TA>

  // must happen before Calendar::dateFromFields and parsing `options`
  const timeZoneSlot = refineTimeZoneArg(fields.timeZone!) // guaranteed via refineCalendarFields
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
  const isoDateFields = calendarRecord.dateFromFields(fields as any, options)
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
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTime: any,
  mod: DateTimeBag, // TODO: allow offset. correct base type tho?
  options: ZonedFieldOptions | undefined,
): DayTimeNano {
  const fields = mergeCalendarFields(
    calendarRecord,
    zonedDateTime as any,
    mod,
    dateFieldNames, // validFieldNames
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second'], // forcedValidFieldNames -- no timeZone!
    ['offset'], // requiredObjFieldNames
  ) as ZonedDateTimeBag<unknown, unknown>

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options, true)
  const isoDateFields = calendarRecord.dateFromFields(fields as any, options)
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
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  bag: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields {
  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames,
    [], // requiredFields
    timeFieldNames, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarRecord.dateFromFields(fields as any, options)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

export function mergePlainDateTimeBag(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainDateTime: any,
  mod: DateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeFields {
  const fields = mergeCalendarFields(
    calendarRecord,
    plainDateTime,
    mod,
    dateFieldNames,
    timeFieldNames, // forcedValidFieldNames
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarRecord.dateFromFields(fields as any, options)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

// PlainDate
// -------------------------------------------------------------------------------------------------

export function refinePlainDateBag(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  bag: DateBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [],
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames,
    requireFields,
  )

  return calendarRecord.dateFromFields(fields as any, options)
}

export function mergePlainDateBag(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainDate: any,
  mod: DateBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarRecord,
    plainDate,
    mod,
    dateFieldNames,
  )

  return calendarRecord.dateFromFields(fields as any, options)
}

function convertToIso(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  input: any,
  inputFieldNames: string[],
  extra: {},
  extraFieldNames: string[],
  options?: OverflowOptions,
): IsoDateFields {
  inputFieldNames = calendarRecord.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarRecord.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarRecord.mergeFields(input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames], [])

  return calendarRecord.dateFromFields(mergedFields as any, options)
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(
  calendarRecord: {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
  requireFields: string[] = [], // when called from Calendar
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return calendarRecord.yearMonthFromFields(fields, options)
}

export function mergePlainYearMonthBag(
  calendarRecord: {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainYearMonth: any,
  bag: YearMonthBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarRecord,
    plainYearMonth,
    bag,
    yearMonthFieldNames,
  )

  return calendarRecord.yearMonthFromFields(fields, options)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainYearMonth: any,
  bag: DayFields,
): IsoDateFields {
  return convertToIso(calendarRecord, plainYearMonth, yearMonthBasicNames, ensureObjectlike(bag), ['day'])
}

export function convertToPlainYearMonth(
  calendarRecord: {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  input: any,
  options?: OverflowOptions,
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarRecord,
    input as any,
    yearMonthBasicNames,
    [],
  )

  return calendarRecord.yearMonthFromFields(fields, options)
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(
  calendarRecord: {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  calendarAbsent: boolean,
  bag: MonthDayBag,
  options?: OverflowOptions,
  requireFields: string[] = [], // when called from Calendar
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames,
    requireFields,
  )

  // Callers who omit the calendar are not writing calendar-independent
  // code. In that case, `monthCode`/`year` can be omitted; `month` and
  // `day` are sufficient. Add a `year` to satisfy calendar validation.
  if (calendarAbsent && fields.month !== undefined && fields.monthCode === undefined && fields.year === undefined) {
    fields.year = isoEpochFirstLeapYear
  }

  return calendarRecord.monthDayFromFields(fields, options)
}

export function mergePlainMonthDayBag(
  calendarRecord: {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainMonthDay: any,
  bag: MonthDayBag,
  options: OverflowOptions | undefined,
): IsoDateFields {
  const fields = mergeCalendarFields(
    calendarRecord,
    plainMonthDay,
    bag,
    dateFieldNames,
  )

  return calendarRecord.monthDayFromFields(fields, options)
}

export function convertToPlainMonthDay(
  calendarRecord: {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  input: any,
): IsoDateFields {
  const fields = refineCalendarFields(
    calendarRecord,
    input as any,
    monthDayBasicNames,
    [], // requiredFields
  )

  return calendarRecord.monthDayFromFields(fields)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainMonthDayToDate(
  calendarRecord: {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainMonthDay: any,
  bag: YearFields,
): IsoDateFields {
  return convertToIso(
    calendarRecord,
    plainMonthDay,
    monthDayBasicNames,
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
  const fields = refineFields(bag, timeFieldNames, [], true) as TimeBag // disallowEmpty

  return refineTimeBag(fields, overflow)
}

export function mergePlainTimeBag(
  plainTime: any,
  bag: TimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options)
  const fields = pluckProps(timeFieldNames, plainTime) // TODO: wish PlainTime had real TS methods
  const partialFields = refineFields(bag, timeFieldNames)
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
  calendarRecord: { fields: CalendarFieldsFunc },
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarRecord.fields(validFieldNames),
    ...forcedValidFieldNames,
  ]

  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendarRecord: { fields: CalendarFieldsFunc, mergeFields: CalendarMergeFieldsFunc },
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  forcedValidFieldNames: string[] = [],
  requiredObjFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarRecord.fields(validFieldNames),
    ...forcedValidFieldNames
  ]

  let fields = refineFields(obj, fieldNames, requiredObjFieldNames)
  const partialFields = refineFields(bag, fieldNames)

  fields = calendarRecord.mergeFields(fields, partialFields)
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
