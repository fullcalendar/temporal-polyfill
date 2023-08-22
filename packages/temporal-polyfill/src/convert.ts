import { CalendarArg, CalendarProtocol } from './calendar'
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
import { queryCalendarImpl } from './calendarImpl'
import { queryCalendarOps } from './calendarOpsQuery'
import { CalendarOps } from './calendarOps'
import { TemporalInstance, getInternals } from './class'
import { DurationBag, DurationMod } from './duration'
import {
  DurationInternals,
  durationFieldDefaults,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoTimeFields, constrainIsoTimeFields } from './isoFields'
import { CalendarInternals, IsoDateInternals, IsoDateTimeInternals } from './isoInternals'
import { parseOffsetNano } from './isoParse'
import {
  EpochDisambig,
  OffsetDisambig,
  Overflow,
  OverflowOptions,
  ZonedFieldOptions,
  normalizeOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
} from './options'
import {
  ensureObjectlike,
  toString, // TODO: shouldn't we use this all over the place?
} from './cast'
import { PlainDate, PlainDateBag, PlainDateMod, createPlainDate } from './plainDate'
import { PlainDateTime, PlainDateTimeBag, PlainDateTimeMod } from './plainDateTime'
import { PlainMonthDay, PlainMonthDayBag, PlainMonthDayMod, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeBag, PlainTimeMod } from './plainTime'
import { PlainYearMonth, PlainYearMonthBag, PlainYearMonthMod, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg } from './timeZone'
import { getMatchingInstantFor, getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { Callable, Reused, excludeArrayDuplicates, pluckProps } from './utils'
import { ZonedDateTime, ZonedDateTimeBag, ZonedDateTimeMod, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { checkIsoDateTimeInBounds } from './isoMath'

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
): ZonedInternals | IsoDateInternals {
  const calendar = getBagCalendarOps(bag)
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames, // validFieldNames
    [], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  if (fields.timeZone) {
    const isoDateFields = calendar.dateFromFields(fields)
    const isoTimeFields = refineTimeBag(fields)
    const timeZone = queryTimeZoneOps(fields.timeZone) // must happen after datetime fields

    const epochNanoseconds = getMatchingInstantFor(
      timeZone,
      { ...isoDateFields, ...isoTimeFields },
      fields.offset !== undefined ? parseOffsetNano(fields.offset) : undefined,
      false, // z?
      OffsetDisambig.Use, // TODO: is default already?
      EpochDisambig.Compat, // TODO: is default already?
      false, // fuzzy
    )

    return {
      calendar,
      timeZone,
      epochNanoseconds,
    }
  } else {
    const isoDateInternals = calendar.dateFromFields(fields)
    const isoTimeFields = refineTimeBag(fields)

    return { ...isoDateInternals, ...isoTimeFields }
  }
}

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag(
  bag: ZonedDateTimeBag,
  options: ZonedFieldOptions | undefined,
): ZonedInternals {
  const calendar = getBagCalendarOps(bag)
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames, // validFieldNames
    ['timeZone'], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  const [overflow, epochDisambig, offsetDisambig] = refineZonedFieldOptions(options)

  const isoDateFields = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)
  // guaranteed via refineCalendarFields
  // must happen after datetime fields
  const timeZone = queryTimeZoneOps(fields.timeZone!)

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
  options: ZonedFieldOptions,
): ZonedInternals {
  const { calendar, timeZone } = getInternals(zonedDateTime)
  const fields = mergeCalendarFields(
    calendar,
    zonedDateTime,
    mod,
    dateTimeFieldNames, // validFieldNames
    ['offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  const [overflow, epochDisambig, offsetDisambig] = refineZonedFieldOptions(options)

  const isoDateFields = calendar.dateFromFields(fields, overflow)
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
  Internals extends Partial<IsoDateTimeInternals>,
  NarrowOptions extends {}
>(
  getMoreInternals: (options: NarrowOptions) => Partial<IsoDateTimeInternals>,
): (
  (
    internals: Internals,
    options: NarrowOptions & { timeZone: TimeZoneArg },
  ) => ZonedDateTime
) {
  return (internals, options) => {
    const timeZone = queryTimeZoneOps((options as { timeZone: TimeZoneArg }).timeZone)
    const extraInternals = getMoreInternals(normalizeOptions(options as NarrowOptions))

    const finalInternals = { ...internals, ...extraInternals } as IsoDateTimeInternals
    const { calendar } = finalInternals
    const epochNanoseconds = getSingleInstantFor(timeZone, finalInternals)

    return createZonedDateTime({
      calendar,
      timeZone: timeZone,
      epochNanoseconds,
    })
  }
}

// PlainDateTime
// -------------------------------------------------------------------------------------------------

export function refinePlainDateTimeBag(
  bag: PlainDateTimeBag,
  options: OverflowOptions | undefined,
): IsoDateTimeInternals {
  const calendar = getBagCalendarOps(bag)
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames,
    [], // requiredFields
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

export function mergePlainDateTimeBag(
  plainDateTime: PlainDateTime,
  mod: PlainDateTimeMod,
  options: OverflowOptions | undefined,
): IsoDateTimeInternals {
  const { calendar } = getInternals(plainDateTime)
  const fields = mergeCalendarFields(
    calendar,
    plainDateTime,
    mod,
    dateTimeFieldNames,
  ) as DateTimeBag

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeBag(fields, overflow)

  return checkIsoDateTimeInBounds({
    ...isoDateInternals,
    ...isoTimeFields,
  })
}

// PlainDate
// -------------------------------------------------------------------------------------------------

export function refinePlainDateBag(
  bag: PlainDateBag,
  options: OverflowOptions | undefined,
  calendar: CalendarOps = getBagCalendarOps(bag)
): IsoDateInternals {
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateFieldNames,
    [], // requiredFields
  )

  return calendar.dateFromFields(fields, refineOverflowOptions(options))
}

export function mergePlainDateBag(
  plainDate: PlainDate,
  mod: PlainDateMod,
  options: OverflowOptions | undefined,
): IsoDateInternals {
  const { calendar } = getInternals(plainDate)
  const fields = mergeCalendarFields(
    calendar,
    plainDate,
    mod,
    dateFieldNames,
  )

  return calendar.dateFromFields(fields, refineOverflowOptions(options))
}

function convertToIso(
  input: TemporalInstance<{ calendar: CalendarOps }> | Reused,
  inputFieldNames: string[],
  extra: {},
  extraFieldNames: string[],
): IsoDateInternals {
  const { calendar } = getInternals(input as TemporalInstance<{ calendar: CalendarOps }>)

  inputFieldNames = calendar.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = calendar.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, [])

  let mergedFields = calendar.mergeFields(input, extra)
  const mergedFieldNames = excludeArrayDuplicates([...inputFieldNames, ...extraFieldNames])
  mergedFields = refineFields(mergedFields, mergedFieldNames, [])

  return calendar.dateFromFields(mergedFields)
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(
  bag: PlainYearMonthBag,
  options: OverflowOptions | undefined,
  calendar: CalendarOps = getBagCalendarOps(bag)
): IsoDateInternals {
  const fields = refineCalendarFields(
    calendar,
    bag,
    yearMonthFieldNames,
    [], // requiredFields
  )

  return calendar.yearMonthFromFields(fields, refineOverflowOptions(options))
}

export function mergePlainYearMonthBag(
  plainYearMonth: PlainYearMonth,
  bag: PlainYearMonthMod,
  options: OverflowOptions | undefined,
): IsoDateInternals {
  const { calendar } = getInternals(plainYearMonth)
  const fields = mergeCalendarFields(
    calendar,
    plainYearMonth,
    bag,
    yearMonthFieldNames,
  )

  return calendar.yearMonthFromFields(fields, refineOverflowOptions(options))
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainYearMonthToDate(
  plainYearMonth: PlainYearMonth,
  bag: DayFields,
): PlainYearMonth {
  return createPlainDate(
    convertToIso(plainYearMonth, yearMonthBasicNames, ensureObjectlike(bag), ['day']),
  )
}

export function convertToPlainYearMonth(
  input: PlainDate | PlainDateTime | ZonedDateTime // TODO: more generic type
) {
  const { calendar } = getInternals(input)
  const fields = refineCalendarFields(
    calendar,
    input,
    yearMonthBasicNames,
    [], // requiredFields
  )

  return createPlainYearMonth(
    calendar.yearMonthFromFields(fields),
  )
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(
  bag: PlainMonthDayBag,
  options: OverflowOptions | undefined,
  calendar: CalendarOps = getBagCalendarOps(bag),
): IsoDateInternals {
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateFieldNames,
    [], // requiredFields
  )

  return calendar.monthDayFromFields(fields, refineOverflowOptions(options))
}

export function mergePlainMonthDayBag(
  plainMonthDay: PlainMonthDay,
  bag: PlainMonthDayMod,
  options: OverflowOptions | undefined,
): IsoDateInternals {
  const { calendar } = getInternals(plainMonthDay)
  const fields = mergeCalendarFields(
    calendar,
    plainMonthDay,
    bag,
    dateFieldNames,
  )

  return calendar.monthDayFromFields(fields, refineOverflowOptions(options))
}

export function convertToPlainMonthDay(
  input: PlainDate | PlainDateTime | ZonedDateTime, // TODO: make more general?
): PlainMonthDay {
  const { calendar } = getInternals(input)
  const fields = refineCalendarFields(
    calendar,
    input,
    monthDayBasicNames,
    [], // requiredFields
  )

  return createPlainMonthDay(
    calendar.monthDayFromFields(fields),
  )
}

/*
Responsible for ensuring bag is an object. Best place?
*/
export function convertPlainMonthDayToDate(
  plainMonthDay: PlainMonthDay,
  bag: YearFields,
): PlainDate {
  return createPlainDate(
    convertToIso(plainMonthDay, monthDayBasicNames, ensureObjectlike(bag), ['year']),
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

function refineCalendarFields(
  calendar: CalendarOps,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...calendar.fields(validFieldNames),
    ...forcedValidFieldNames,
  ].sort() // inefficient!

  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendar: CalendarOps,
  obj: Record<string, unknown>,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  rejectInvalidBag(bag)

  const fieldNames = [
    ...calendar.fields(validFieldNames),
    ...forcedValidFieldNames
  ].sort() // inefficient!

  let fields = refineFields(obj, fieldNames, [])
  const partialFields = refineFields(bag, fieldNames)

  fields = calendar.mergeFields(fields, partialFields)
  return refineFields(fields, fieldNames, []) // guard against ridiculous .mergeField results
}

/*
defaults to ISO
*/
function getBagCalendarOps(
  bag: TemporalInstance<CalendarInternals> | { calendar?: CalendarArg },
): CalendarOps {
  return extractBagCalendarOps(bag) || queryCalendarImpl(isoCalendarId)
}

function extractBagCalendarOps(
  bag: TemporalInstance<CalendarInternals> | { calendar?: CalendarArg },
): CalendarOps | undefined {
  let calendar: CalendarOps | CalendarProtocol | string | undefined =
    (getInternals(bag) || {}).calendar

  if (calendar) {
    return calendar // CalendarOps
  }

  calendar = (bag as { calendar: CalendarProtocol | string }).calendar

  if (calendar !== undefined) {
    return (getInternals(calendar) as any || {}).calendar ||
      queryCalendarOps(calendar)
  }
}

function rejectInvalidBag(bag: { calendar?: unknown, timeZone?: unknown }): void {
  if (getInternals(bag)) {
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
  offset: toString,
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

  for (const fieldName of validFieldNames) {
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
  }

  // only check zero fields during .with() calls
  // for .from() calls, empty-bag-checking will happen within the CalendarImpl
  if (disallowEmpty && !anyMatching) {
    throw new TypeError('No valid fields')
  }

  return res
}
