import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
  isoCalendarId,
} from './calendarConfig'
import {
  DateFields,
  TimeFields,
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
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, PlainDateTimeBag } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { getMatchingInstantFor, getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { Callable, Reused, excludeArrayDuplicates, isObjectlike, pluckProps } from './utils'
import { ZonedDateTime, ZonedDateTimeBag, ZonedInternals, createZonedDateTime } from './zonedDateTime'

/*
Rules:
- refining/merging return internal object
- converting returns public object
*/

// TODO: make more DRY with other methods
export function refineMaybeZonedDateTimeBag(bag: any): ZonedInternals | IsoDateInternals {
  const calendar = getBagCalendarOps(bag)
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames, // validFieldNames
    getRequiredDateFields(calendar), // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  )

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

export function refineZonedDateTimeBag(bag: ZonedDateTimeBag, options: ZonedFieldOptions | undefined): ZonedInternals {
  const calendar = getBagCalendarOps(bag)
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateTimeFieldNames, // validFieldNames
    [...getRequiredDateFields(calendar), 'timeZone'], // requireFields
    ['timeZone', 'offset'], // forcedValidFieldNames
  )
  const [overflow, epochDisambig, offsetDisambig] = refineZonedFieldOptions(options)

  const timeZone = queryTimeZoneOps(fields.timeZone)
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
  bag: any,
  options: ZonedFieldOptions,
): ZonedInternals {
  const { calendar, timeZone } = getInternals(zonedDateTime)
  const fields = mergeCalendarFields(
    calendar,
    zonedDateTime,
    bag,
    dateTimeFieldNames, // validFieldNames
    ['offset'], // forcedValidFieldNames
  )
  const [overflow, epochDisambig, offsetDisambig] = refineZonedFieldOptions(options)

  const isoDateFields = calendar.dateFromFields(fields, overflow)
  const isoTimeFields = refineTimeFields(fields, overflow)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    { ...isoDateFields, ...isoTimeFields },
    parseOffsetNano(fields.offset),
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

export function createZonedDateTimeConverter(
  getExtraIsoFields: (options: any) => any,
): (
  (internals: any, options: any) => ZonedDateTime
) {
  return (internals, options) => {
    const { calendar } = internals
    const timeZone = queryTimeZoneOps(options.timeZone)

    const epochNanoseconds = getSingleInstantFor(timeZone, {
      ...internals,
      ...getExtraIsoFields(normalizeOptions(options)),
    })

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
  bag: any,
  options: OverflowOptions | undefined,
): IsoDateTimeInternals {
  const { calendar } = getInternals(plainDateTime)
  const fields = mergeCalendarFields(
    calendar,
    plainDateTime,
    bag,
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
  bag: DateFields,
  options: OverflowOptions | undefined,
  calendar: CalendarOps | undefined = getBagCalendarOps(bag)
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
  bag: any,
  options: OverflowOptions | undefined,
): IsoDateInternals {
  const { calendar } = getInternals(plainDate)
  const fields = mergeCalendarFields(
    calendar,
    plainDate,
    bag,
    dateFieldNames,
  )

  return calendar.dateFromFields(fields, refineOverflowOptions(options))
}

function convertToIso(
  input: PlainYearMonth | PlainMonthDay,
  inputFieldNames: string[],
  extra: any,
  extraFieldNames: string[],
): IsoDateInternals {
  const { calendar } = getInternals(input)

  inputFieldNames = calendar.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>) as Reused

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
  bag: any,
  options: OverflowOptions | undefined,
  calendar: CalendarOps | undefined = getBagCalendarOps(bag)
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
  bag: any,
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

export function convertPlainYearMonthToDate(
  plainYearMonth: PlainYearMonth,
  bag: any,
): PlainYearMonth {
  return createPlainDate(
    convertToIso(plainYearMonth, yearMonthBasicNames, ensureObjectlike(bag), ['day']),
  )
}

export function convertToPlainYearMonth(
  input: PlainDate | PlainDateTime | ZonedDateTime
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
  bag: any,
  options: OverflowOptions | undefined,
  calendar: CalendarOps | undefined = extractBagCalendarOps(bag),
): IsoDateInternals {
  const calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = queryCalendarImpl(isoCalendarId)
  }

  const fieldNames = calendar!.fields(dateFieldNames)
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
  bag: any,
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
  input: PlainDate | PlainDateTime | ZonedDateTime,
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

export function convertPlainMonthDayToDate(
  plainMonthDay: PlainMonthDay,
  bag: any,
): PlainDate {
  return createPlainDate(
    convertToIso(plainMonthDay, monthDayBasicNames, bag, ['year']),
  )
}

// PlainTime
// -------------------------------------------------------------------------------------------------

export function refinePlainTimeBag(
  bag: any,
  options: OverflowOptions | undefined,
): IsoTimeFields {
  const fields = refineFields(bag, timeFieldNames, [])

  return refineTimeFields(fields, refineOverflowOptions(options))
}

export function mergePlainTimeBag(
  plainTime: PlainTime,
  bag: any,
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
  const durationFields = refineFields(bag, durationFieldNames, [])
  return updateDurationFieldsSign(durationFields)
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
  bag: any,
  validFieldNames: string[],
  requiredFieldNames: string[] = [], // a subset of validFieldNames
  forcedValidFieldNames: string[] = [],
): any {
  const fieldNames = [...calendar.fields(validFieldNames), ...forcedValidFieldNames]
  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendar: CalendarOps,
  obj: any,
  bag: any,
  validFieldNames: string[],
  forcedValidFieldNames: string[] = [],
): any {
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
function getBagCalendarOps(bag: any): CalendarOps {
  return extractBagCalendarOps(bag) || queryCalendarImpl(isoCalendarId)
}

function extractBagCalendarOps(
  bag: TemporalInstance<CalendarInternals> | { calendar: string },
): CalendarOps | undefined {
  let calendar: CalendarOps | string | undefined = (getInternals(bag) || {}).calendar

  if (calendar) {
    return calendar // CalendarOps
  }

  calendar = (bag as { calendar: string }).calendar
  if (calendar) {
    return queryCalendarOps(calendar)
  }
}

function rejectInvalidBag(bag: any): void {
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
  bag: any,
  validFieldNames: string[],
  requiredFieldNames?: string[], // a subset of fieldNames
  // if not given, then assumed to be 'partial' (defaults won't be applied)
): any {
  const res: any = {}
  let any = false

  for (const fieldName in validFieldNames) {
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
