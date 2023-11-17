import { isoCalendarId } from './calendarConfig'
import {
  DateTimeBag,
  DayFields,
  TimeBag,
  TimeFields,
  YearFields,
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
  DurationInternals,
  durationFieldDefaults,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoTimeFields, constrainIsoTimeFields } from './isoFields'
import { parseOffsetNano } from './isoParse'
import {
  EpochDisambig,
  EpochDisambigOptions,
  OffsetDisambig,
  Overflow,
  OverflowOptions,
  ZonedFieldOptions,
  normalizeOptions,
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
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots, getSlots } from './slots'
import { CalendarSlot, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, getMatchingInstantFor, getSingleInstantFor, refineTimeZoneSlot } from './timeZoneSlot'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from './timeZoneRecordSimple'
import { calendarImplDateFromFields, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields } from './calendarRecordSimple'
import { CalendarFieldsFunc, CalendarMergeFieldsFunc } from './calendarRecordTypes'

// public
import type { TimeZoneArg } from '../public/timeZone'
import { getZonedDateTimeSlots, type ZonedDateTime, type ZonedDateTimeBag, type ZonedDateTimeMod } from '../public/zonedDateTime'
import { getPlainDateSlots, type PlainDate, type PlainDateBag, type PlainDateMod } from '../public/plainDate'
import { getPlainDateTimeSlots, type PlainDateTime, type PlainDateTimeBag, type PlainDateTimeMod } from '../public/plainDateTime'
import type { PlainTime, PlainTimeBag, PlainTimeMod } from '../public/plainTime'
import { getPlainYearMonthSlots, type PlainYearMonth, type PlainYearMonthBag, type PlainYearMonthMod } from '../public/plainYearMonth'
import { getPlainMonthDaySlots, type PlainMonthDay, type PlainMonthDayBag, type PlainMonthDayMod } from '../public/plainMonthDay'
import type { DurationBag, DurationMod } from '../public/duration'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from '../public/timeZoneRecordComplex'
import { calendarProtocolDateFromFields, calendarProtocolFields, calendarProtocolMergeFields, calendarProtocolMonthDayFromFields, calendarProtocolYearMonthFromFields, createCalendarSlotRecord } from '../public/calendarRecordComplex'


/*
Initial subject should be converted to { calendar, timeZone, day, month, monthCode, year, era, eraYear }
BEFORE being sent here
`mod` should be just fields

QUESTION: have different utils for complex object versus string?
(ex: CalendarSlot vs string, TimeZoneSlot vs string)
*/

// High-level to* methods
// -------------------------------------------------------------------------------------------------

export function convertPlainDateTimeToZoned(
  internals: IsoDateTimeSlots,
  timeZone: TimeZoneSlot,
  options?: EpochDisambigOptions,
): ZonedEpochSlots {
  const { calendar } = internals
  const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })

  const epochDisambig = refineEpochDisambigOptions(options)
  const epochNanoseconds = checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneRecord, internals, epochDisambig),
  )

  return {
    epochNanoseconds,
    timeZone,
    calendar,
  }
}

// Other Stuff
// -------------------------------------------------------------------------------------------------

/*
Rules:
- refining/merging return internal object
- converting returns public object
*/

/*
TODO: make more DRY with other methods
*/
export function refineMaybeZonedDateTimeBag(
  bag: ZonedDateTimeBag,
): ZonedEpochSlots | IsoDateSlots {
  const calendar = getBagCalendarSlot(bag)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })

  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames, // validFieldNames
    [], // requireFields
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarRecord.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    const timeZone = refineTimeZoneSlot(fields.timeZone) // must happen after datetime fields
    const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
      getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
    }, {
      getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
    })

    const epochNanoseconds = getMatchingInstantFor(
      timeZoneRecord,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
      false, // z?
      OffsetDisambig.Reject, // TODO: is default already?
      EpochDisambig.Compat, // TODO: is default already?
      false, // fuzzy
    )

    return {
      calendar,
      timeZone,
      epochNanoseconds,
    }
  } else {
    const isoDateInternals = calendarRecord.dateFromFields(fields as any)
    const isoTimeFields = refineTimeBag(fields)

    return { ...isoDateInternals, ...isoTimeFields, calendar }
  }
}

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag(
  bag: ZonedDateTimeBag,
  options: ZonedFieldOptions | undefined,
): ZonedEpochSlots {
  const calendar = getBagCalendarSlot(bag)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })

  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames, // validFieldNames
    ['timeZone'], // requireFields
    // forcedValidFieldNames (TODO: more compressed)
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second', 'timeZone'],
  ) as ZonedDateTimeBag

  // guaranteed via refineCalendarFields
  // must happen before Calendar::dateFromFields and parsing `options`
  const timeZone = refineTimeZoneSlot(fields.timeZone!)
  const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })

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

  return {
    calendar,
    timeZone,
    epochNanoseconds,
  }
}

export function mergeZonedDateTimeBag(
  zonedDateTime: ZonedDateTime,
  mod: ZonedDateTimeMod,
  options: ZonedFieldOptions | undefined,
): ZonedEpochSlots {
  const { calendar, timeZone } = getZonedDateTimeSlots(zonedDateTime)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })
  const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })

  const fields = mergeCalendarFields(
    calendarRecord,
    zonedDateTime as any,
    mod,
    dateFieldNames, // validFieldNames
    ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'offset', 'second'], // forcedValidFieldNames -- no timeZone!
    ['offset'], // requiredObjFieldNames
  ) as ZonedDateTimeBag

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

  return {
    calendar,
    timeZone,
    epochNanoseconds,
  }
}

export function createZonedDateTimeConverter<
  Internals extends Partial<IsoDateTimeSlots>,
  NarrowOptions extends {}
>(
  getMoreInternals: (options: NarrowOptions) => Partial<IsoDateTimeSlots>,
): (
  (
    internals: Internals,
    options: NarrowOptions & { timeZone: TimeZoneArg },
  ) => ZonedEpochSlots
) {
  return (internals, options) => {
    const timeZone = refineTimeZoneSlot((options as { timeZone: TimeZoneArg }).timeZone)
    const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
      getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
    }, {
      getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
    })

    const extraInternals = getMoreInternals(normalizeOptions(options as NarrowOptions))

    const finalInternals = { ...internals, ...extraInternals } as IsoDateTimeSlots
    const { calendar } = finalInternals
    const epochNanoseconds = getSingleInstantFor(timeZoneRecord, finalInternals)

    return {
      calendar,
      timeZone: timeZone,
      epochNanoseconds,
    }
  }
}

// PlainDateTime
// -------------------------------------------------------------------------------------------------

export function refinePlainDateTimeBag(
  bag: PlainDateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeSlots {
  const calendar = getBagCalendarSlot(bag)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })

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
    calendar,
  })
}

export function mergePlainDateTimeBag(
  plainDateTime: PlainDateTime,
  mod: PlainDateTimeMod,
  options: OverflowOptions | undefined,
): IsoDateTimeSlots {
  const { calendar } = getPlainDateTimeSlots(plainDateTime)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })

  const fields = mergeCalendarFields(
    calendarRecord,
    plainDateTime as any,
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
    calendar,
  })
}

// PlainDate
// -------------------------------------------------------------------------------------------------

export function refinePlainDateBag(
  bag: PlainDateBag,
  options: OverflowOptions | undefined,
  calendar: CalendarSlot = getBagCalendarSlot(bag),
  requireFields: string[] = [], // when called from Calendar
): IsoDateSlots {
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })

  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    dateFieldNames,
    requireFields,
  )

  return calendarRecord.dateFromFields(fields as any, options)
}

export function mergePlainDateBag(
  plainDate: PlainDate,
  mod: PlainDateMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainDateSlots(plainDate)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })

  const fields = mergeCalendarFields(
    calendarRecord,
    plainDate as any,
    mod,
    dateFieldNames,
  )

  return calendarRecord.dateFromFields(fields as any, options)
}

function convertToIso(
  input: any,
  inputFieldNames: string[],
  extra: {},
  extraFieldNames: string[],
  options?: OverflowOptions,
): IsoDateSlots {
  const { calendar } = getSlots(input) as { branding: string, calendar: CalendarSlot }
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })

  inputFieldNames = calendarRecord.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarRecord.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarRecord.mergeFields(input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames], [])

  return {
    ...calendarRecord.dateFromFields(mergedFields as any, options),
    calendar,
  }
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(
  bag: PlainYearMonthBag,
  options: OverflowOptions | undefined,
  calendar: CalendarSlot = getBagCalendarSlot(bag),
  requireFields: string[] = [], // when called from Calendar
): IsoDateSlots {
  const calendarRecord = createCalendarSlotRecord(calendar, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
  })

  const fields = refineCalendarFields(
    calendarRecord,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return calendarRecord.yearMonthFromFields(fields, options)
}

export function mergePlainYearMonthBag(
  plainYearMonth: PlainYearMonth,
  bag: PlainYearMonthMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainYearMonthSlots(plainYearMonth)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })

  const fields = mergeCalendarFields(
    calendarRecord,
    plainYearMonth as any,
    bag,
    yearMonthFieldNames,
  )

  return calendarRecord.yearMonthFromFields(fields, options)
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate(
  plainYearMonth: PlainYearMonth,
  bag: DayFields,
): IsoDateSlots {
  return convertToIso(plainYearMonth, yearMonthBasicNames, ensureObjectlike(bag), ['day'])
}

export function convertToPlainYearMonth(
  input: PlainDate | PlainDateTime | ZonedDateTime, // TODO: more generic type
  options?: OverflowOptions,
): IsoDateSlots {
  const { calendar } = getSlots(input) as { branding: string, calendar: CalendarSlot }
  const calendarRecord = createCalendarSlotRecord(calendar, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
  })

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
  bag: PlainMonthDayBag,
  options?: OverflowOptions,
  calendar?: CalendarSlot,
  requireFields: string[] = [], // when called from Calendar
): IsoDateSlots {
  let calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = extractBagCalendarSlot(bag)
    calendarAbsent = !calendar

    if (calendarAbsent) {
      calendar = isoCalendarId
    }
  }

  const calendarRecord = createCalendarSlotRecord(calendar!, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
  })

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
  plainMonthDay: PlainMonthDay,
  bag: PlainMonthDayMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainMonthDaySlots(plainMonthDay)
  const calendarRecord = createCalendarSlotRecord(calendar!, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })

  const fields = mergeCalendarFields(
    calendarRecord,
    plainMonthDay as any,
    bag,
    dateFieldNames,
  )

  return calendarRecord.monthDayFromFields(fields, options)
}

export function convertToPlainMonthDay(
  input: PlainDate | PlainDateTime | ZonedDateTime, // TODO: make more general?
): IsoDateSlots {
  const { calendar } = getSlots(input) as { branding: string, calendar: CalendarSlot }
  const calendarRecord = createCalendarSlotRecord(calendar!, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
  })

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
  plainMonthDay: PlainMonthDay,
  bag: YearFields,
): IsoDateSlots {
  return convertToIso(
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
  bag: PlainTimeBag,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options) // parse before fields (what!?)
  const fields = refineFields(bag, timeFieldNames, [], true) as TimeBag // disallowEmpty

  return refineTimeBag(fields, overflow)
}

export function mergePlainTimeBag(
  plainTime: PlainTime,
  bag: PlainTimeMod,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const overflow = refineOverflowOptions(options)
  const fields = pluckProps(timeFieldNames, plainTime as unknown as TimeFields) // TODO: wish PlainTime had real TS methods
  const partialFields = refineFields(bag, timeFieldNames)
  const mergeFields = { ...fields, ...partialFields }

  return refineTimeBag(mergeFields, overflow)
}

function refineTimeBag(fields: TimeBag, overflow?: Overflow): IsoTimeFields {
  return constrainIsoTimeFields(timeFieldsToIso({ ...timeFieldDefaults, ...fields }), overflow)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag: DurationBag): DurationInternals {
  // refine in 'partial' mode
  const durationFields = refineFields(bag, durationFieldNames) as DurationBag

  return updateDurationFieldsSign({
    ...durationFieldDefaults,
    ...durationFields
  })
}

export function mergeDurationBag(
  durationInternals: DurationInternals,
  bag: DurationMod
): DurationInternals {
  const partialDurationFields = refineFields(bag, durationFieldNames)
  return updateDurationFieldsSign({ ...durationInternals, ...partialDurationFields })
}

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

export function refineCalendarFields(
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

/*
defaults to ISO
*/
export function getBagCalendarSlot(bag: any): CalendarSlot {
  return extractBagCalendarSlot(bag) || isoCalendarId
}

function extractBagCalendarSlot(bag: any): CalendarSlot | undefined {
  const slots = getSlots(bag)
  const { calendar } = (slots || {}) as { calendar?: CalendarSlot }

  if (calendar) {
    return calendar
  }

  const bagCalendar = bag.calendar
  if (bagCalendar !== undefined) {
    return refineCalendarSlot(bagCalendar)
  }
}

export function rejectInvalidBag<B>(bag: B): B {
  if (getSlots(bag)) {
    throw new TypeError('Cant pass a Temporal object')
  }
  if ((bag as any).calendar !== undefined) {
    throw new TypeError('Ah')
  }
  if ((bag as any).timeZone !== undefined) {
    throw new TypeError('Ah')
  }
  return bag
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
