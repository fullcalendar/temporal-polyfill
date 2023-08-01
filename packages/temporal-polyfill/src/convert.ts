import { CalendarArg, CalendarProtocol } from './calendar'
import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
  isoCalendarId,
} from './calendarConfig'
import {
  DayFields,
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
import { CalendarOps, queryCalendarOps } from './calendarOps'
import { TemporalInstance, getInternals } from './class'
import { DurationBag, DurationMod } from './duration'
import {
  DurationFields,
  DurationInternals,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { CalendarInternals, IsoDateInternals, IsoDateTimeInternals, IsoTimeFields } from './isoFields'
import { constrainIsoTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { parseOffsetNano } from './isoParse'
import {
  EpochDisambig,
  OffsetDisambig,
  Overflow,
  OverflowOptions,
  ZonedFieldOptions,
  ensureObjectlike,
  normalizeOptions,
  refineOverflowOptions,
  refineZonedFieldOptions,
  toString, // TODO: shouldn't we use this all over the place?
} from './options'
import { PlainDate, PlainDateBag, PlainDateMod, createPlainDate } from './plainDate'
import { PlainDateTime, PlainDateTimeBag, PlainDateTimeMod } from './plainDateTime'
import { PlainMonthDay, PlainMonthDayBag, PlainMonthDayMod, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeBag, PlainTimeMod } from './plainTime'
import { PlainYearMonth, PlainYearMonthBag, PlainYearMonthMod, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg } from './timeZone'
import { getMatchingInstantFor, getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { Callable, Reused, excludeArrayDuplicates, pluckProps } from './utils'
import { ZonedDateTime, ZonedDateTimeBag, ZonedDateTimeMod, ZonedInternals, createZonedDateTime } from './zonedDateTime'

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
    getRequiredDateFields(calendar), // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  if (fields.timeZone) {
    const timeZone = queryTimeZoneOps(fields.timeZone)
    const isoDateFields = calendar.dateFromFields(fields, Overflow.Constrain)
    const isoTimeFields = refineTimeFields(fields, Overflow.Constrain)

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
    const isoDateInternals = calendar.dateFromFields(fields, Overflow.Constrain)
    const isoTimeFields = refineTimeFields(fields, Overflow.Constrain)

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
    [...getRequiredDateFields(calendar), 'timeZone'], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  ) as ZonedDateTimeBag

  const [overflow, epochDisambig, offsetDisambig] = refineZonedFieldOptions(options)

  const timeZone = queryTimeZoneOps(fields.timeZone!) // guaranteed via refineCalendarFields
  const isoDateFields = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeFields(fields, overflow)

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
  const isoTimeFields = refineTimeFields(fields, overflow)

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
  NarrowOptions
>(
  getMoreInternals: (options: NarrowOptions) => Partial<IsoDateTimeInternals>,
): (
  (internals: Internals, options: NarrowOptions & { timeZone: TimeZoneArg }) => ZonedDateTime
) {
  return (internals, options) => {
    const finalInternals = {
      ...internals,
      ...getMoreInternals(normalizeOptions(options))
    } as IsoDateTimeInternals

    const { calendar } = finalInternals
    const timeZone = queryTimeZoneOps(options.timeZone)
    const epochNanoseconds = getSingleInstantFor(timeZone, finalInternals)

    return createZonedDateTime({
      calendar,
      timeZone,
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
    getRequiredDateFields(calendar),
  )

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeFields(fields, overflow)

  return { ...isoDateInternals, ...isoTimeFields }
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
  )

  const overflow = refineOverflowOptions(options)
  const isoDateInternals = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeFields(fields, overflow)

  return { ...isoDateInternals, ...isoTimeFields }
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
    getRequiredDateFields(calendar),
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
  extra = refineFields(extra, extraFieldNames, getRequiredDateFields(calendar))

  let mergedFields = calendar.mergeFields(input, extra)
  const mergedFieldNames = excludeArrayDuplicates([...inputFieldNames, ...extraFieldNames])
  mergedFields = refineFields(mergedFields, mergedFieldNames, [])

  return calendar.dateFromFields(mergedFields, Overflow.Constrain)
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
    getRequiredYearMonthFields(calendar),
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
    getRequiredYearMonthFields(calendar),
  )

  return createPlainYearMonth(
    calendar.yearMonthFromFields(fields, Overflow.Constrain), // TODO: make default?
  )
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(
  bag: PlainMonthDayBag,
  options: OverflowOptions | undefined,
  calendar?: CalendarOps,
): IsoDateInternals {
  const calendarAbsent = !calendar
  calendar ||= getBagCalendarOps(bag)

  const fieldNames = calendar.fields(dateFieldNames) as (keyof PlainMonthDayBag)[]
  const fields = refineFields(bag, fieldNames, [])

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

  return calendar!.monthDayFromFields(fields, refineOverflowOptions(options))
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
    getRequiredMonthDayFields(calendar),
  )

  return createPlainMonthDay(
    calendar.monthDayFromFields(fields, Overflow.Constrain), // TODO: default Constrain?
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
  const fields = refineFields(bag, timeFieldNames, [])

  return refineTimeFields(fields, refineOverflowOptions(options))
}

export function mergePlainTimeBag(
  plainTime: PlainTime,
  bag: PlainTimeMod,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const fields = pluckProps(timeFieldNames, plainTime as unknown as TimeFields) // TODO: wish PlainTime had real TS methods
  const partialFields = refineFields(bag, timeFieldNames)
  const mergeFields = { ...fields, ...partialFields }

  return refineTimeFields(mergeFields, refineOverflowOptions(options))
}

function refineTimeFields(fields: any, overflow: any): IsoTimeFields {
  return constrainIsoTimeFields(timeFieldsToIso(fields), overflow)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag: DurationBag): DurationInternals {
  const durationFields = refineFields(bag, durationFieldNames, []) as DurationBag
  return updateDurationFieldsSign(durationFields as DurationFields)
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
  const fieldNames = [...calendar.fields(validFieldNames), ...forcedValidFieldNames]
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

  const fieldNames = [...calendar.fields(validFieldNames), ...forcedValidFieldNames]
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
  if (calendar) {
    return queryCalendarOps(calendar)
  }
}

function rejectInvalidBag(bag: { calendar?: unknown, timeZone?: unknown }): void {
  if (getInternals(bag)) {
    throw new TypeError('Cant pass any Temporal object')
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

function refineFields(
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames?: string[], // a subset of fieldNames
  // if not given, then assumed to be 'partial' (defaults won't be applied)
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let any = false

  for (const fieldName of validFieldNames) {
    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      any = true

      if (builtinRefiners[fieldName as keyof typeof builtinRefiners]) {
        fieldVal = (builtinRefiners[fieldName as keyof typeof builtinRefiners] as Callable)(fieldVal)
      }

      res[fieldName] = fieldVal
    } else if (requiredFieldNames) {
      if (requiredFieldNames.includes(fieldName)) {
        throw new TypeError('Missing required field name')
      }

      res[fieldName] = builtinDefaults[fieldName as keyof typeof builtinDefaults]
    }
  }

  if (!any) {
    throw new TypeError('No valid fields')
  }

  return res
}
