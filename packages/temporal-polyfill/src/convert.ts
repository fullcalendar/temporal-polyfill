import { isoCalendarId } from './calendarConfig'
import {
  DateTimeBag,
  DayFields,
  TimeBag,
  TimeFields,
  YearFields,
  dateFieldNames,
  dateTimeFieldNames,
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

// public
import type { TimeZoneArg } from './timeZone'
import { getZonedDateTimeSlots, type ZonedDateTime, type ZonedDateTimeBag, type ZonedDateTimeMod } from './zonedDateTime'
import { getPlainDateSlots, type PlainDate, type PlainDateBag, type PlainDateMod } from './plainDate'
import { getPlainDateTimeSlots, type PlainDateTime, type PlainDateTimeBag, type PlainDateTimeMod } from './plainDateTime'
import type { PlainTime, PlainTimeBag, PlainTimeMod } from './plainTime'
import { getPlainYearMonthSlots, type PlainYearMonth, type PlainYearMonthBag, type PlainYearMonthMod } from './plainYearMonth'
import { getPlainMonthDaySlots, type PlainMonthDay, type PlainMonthDayBag, type PlainMonthDayMod } from './plainMonthDay'
import type { DurationBag, DurationMod } from './duration'
import { CalendarSlot, calendarDateFromFields, calendarFields, calendarMergeFields, calendarMonthDayFromFields, calendarYearMonthFromFields, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, getMatchingInstantFor, getSingleInstantFor, refineTimeZoneSlot } from './timeZoneSlot'

// High-level to* methods
// -------------------------------------------------------------------------------------------------

export function convertPlainDateTimeToZoned(
  internals: IsoDateTimeSlots,
  timeZone: TimeZoneSlot,
  options?: EpochDisambigOptions,
): ZonedEpochSlots {
  const { calendar } = internals
  const epochDisambig = refineEpochDisambigOptions(options)
  const epochNanoseconds = checkEpochNanoInBounds(
    getSingleInstantFor(timeZone, internals, epochDisambig),
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
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateFieldNames, // validFieldNames
    [], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  if (fields.timeZone !== undefined) {
    const isoDateFields = calendarDateFromFields(calendar, fields as any)
    const isoTimeFields = refineTimeBag(fields)
    const timeZone = refineTimeZoneSlot(fields.timeZone) // must happen after datetime fields

    const epochNanoseconds = getMatchingInstantFor(
      timeZone,
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
    const isoDateInternals = calendarDateFromFields(calendar, fields as any)
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
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames, // validFieldNames
    ['timeZone'], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  // guaranteed via refineCalendarFields
  // must happen before Calendar::dateFromFields and parsing `options`
  const timeZone = refineTimeZoneSlot(fields.timeZone!)

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)

  const isoDateFields = calendarDateFromFields(calendar, fields as any, options)
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
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
  const fields = mergeCalendarFields(
    calendar,
    zonedDateTime as any,
    mod,
    dateTimeFieldNames, // validFieldNames
    ['offset'], // forcedValidFieldNames
    ['offset'], // requiredObjFieldNames
  ) as ZonedDateTimeBag

  const [overflow, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options, true)

  const isoDateFields = calendarDateFromFields(calendar, fields as any, options)
  const isoTimeFields = refineTimeBag(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
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
    const extraInternals = getMoreInternals(normalizeOptions(options as NarrowOptions))

    const finalInternals = { ...internals, ...extraInternals } as IsoDateTimeSlots
    const { calendar } = finalInternals
    const epochNanoseconds = getSingleInstantFor(timeZone, finalInternals)

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
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames,
    [],
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarDateFromFields(calendar, fields as any, options)
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
  const fields = mergeCalendarFields(
    calendar,
    plainDateTime as any,
    mod,
    dateTimeFieldNames,
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendarDateFromFields(calendar, fields as any, options)
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
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateFieldNames,
    requireFields,
  )

  return calendarDateFromFields(calendar, fields as any, options)
}

export function mergePlainDateBag(
  plainDate: PlainDate,
  mod: PlainDateMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainDateSlots(plainDate)
  const fields = mergeCalendarFields(
    calendar,
    plainDate as any,
    mod,
    dateFieldNames,
  )

  return calendarDateFromFields(calendar, fields as any, options)
}

function convertToIso(
  input: any,
  inputFieldNames: string[],
  extra: {},
  extraFieldNames: string[],
  options?: OverflowOptions,
): IsoDateSlots {
  const { calendar } = getSlots(input) as { branding: string, calendar: CalendarSlot }

  inputFieldNames = calendarFields(calendar, inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendarFields(calendar, extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendarMergeFields(calendar, input, extra)
  mergedFields = refineFields(mergedFields, [...inputFieldNames, ...extraFieldNames], [])

  return {
    ...calendarDateFromFields(calendar, mergedFields as any, options),
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
  const fields = refineCalendarFields(
    calendar,
    bag,
    yearMonthFieldNames,
    requireFields,
  )

  return calendarYearMonthFromFields(calendar, fields, options)
}

export function mergePlainYearMonthBag(
  plainYearMonth: PlainYearMonth,
  bag: PlainYearMonthMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainYearMonthSlots(plainYearMonth)
  const fields = mergeCalendarFields(
    calendar,
    plainYearMonth as any,
    bag,
    yearMonthFieldNames,
  )

  return calendarYearMonthFromFields(calendar, fields, options)
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
  const fields = refineCalendarFields(
    calendar,
    input as any,
    yearMonthBasicNames,
    [],
  )

  return calendarYearMonthFromFields(calendar, fields, options)
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

  const fields = refineCalendarFields(
    calendar!,
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

  return calendarMonthDayFromFields(calendar!, fields, options)
}

export function mergePlainMonthDayBag(
  plainMonthDay: PlainMonthDay,
  bag: PlainMonthDayMod,
  options: OverflowOptions | undefined,
): IsoDateSlots {
  const { calendar } = getPlainMonthDaySlots(plainMonthDay)
  const fields = mergeCalendarFields(
    calendar,
    plainMonthDay as any,
    bag,
    dateFieldNames,
  )

  return calendarMonthDayFromFields(calendar, fields, options)
}

export function convertToPlainMonthDay(
  input: PlainDate | PlainDateTime | ZonedDateTime, // TODO: make more general?
): IsoDateSlots {
  const { calendar } = getSlots(input) as { branding: string, calendar: CalendarSlot }
  const fields = refineCalendarFields(
    calendar,
    input as any,
    monthDayBasicNames,
    [], // requiredFields
  )

  return calendarMonthDayFromFields(calendar, fields)
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
  rejectInvalidBag(bag as any)

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
  calendar: CalendarSlot,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendarFields(calendar, validFieldNames),
    ...forcedValidFieldNames,
  ]

  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendar: CalendarSlot,
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  forcedValidFieldNames: string[] = [],
  requiredObjFieldNames: string[] = [],
): Record<string, unknown> {
  rejectInvalidBag(bag)

  const fieldNames = [
    ...calendarFields(calendar, validFieldNames),
    ...forcedValidFieldNames
  ]

  let fields = refineFields(obj, fieldNames, requiredObjFieldNames)
  const partialFields = refineFields(bag, fieldNames)

  fields = calendarMergeFields(calendar, fields, partialFields)
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

function rejectInvalidBag(bag: { calendar?: unknown, timeZone?: unknown }): void {
  if (getSlots(bag)) {
    throw new TypeError('Cant pass a Temporal object')
  }
  if (bag.calendar !== undefined) {
    throw new TypeError('Ah')
  }
  if (bag.timeZone !== undefined) {
    throw new TypeError('Ah')
  }
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
