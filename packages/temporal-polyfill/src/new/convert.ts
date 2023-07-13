import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
  isoCalendarId,
} from './calendarConfig'
import {
  DateFields,
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
import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import {
  DurationFields,
  DurationInternals,
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateInternals, IsoDateTimeInternals } from './isoFields'
import { constrainIsoTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { parseOffsetNano } from './isoParse'
import {
  ensureObjectlike,
  normalizeOptions,
  refineOverflowOptions,
  refineZonedFieldOptions, // TODO: shouldn't we use this all over the place?
} from './options'
import { createPlainDate } from './plainDate'
import { PlainDateTimeBag } from './plainDateTime'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainYearMonth } from './plainYearMonth'
import { getMatchingInstantFor, getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { excludeArrayDuplicates, isObjectlike, pluckProps } from './utils'
import { ZonedDateTime, ZonedDateTimeBag, ZonedInternals, createZonedDateTime } from './zonedDateTime'

/*
Rules:
- refining/merging return internal object
- converting returns public object
*/

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag(bag: ZonedDateTimeBag, options): ZonedInternals {
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
    fields.offset !== undefined && parseOffsetNano(fields.offset),
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

export function mergeZonedDateTimeBag(zonedDateTime, bag, options) {
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

export function createZonedDateTimeConverter(getExtraIsoFields) {
  return (internals, options): ZonedDateTime => {
    const { calendar, timeZone } = internals
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

export function refinePlainDateTimeBag(bag: PlainDateTimeBag, options): IsoDateTimeInternals {
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

export function mergePlainDateTimeBag(plainDate, bag, options) {
  const { calendar } = getInternals(plainDate)
  const fields = mergeCalendarFields(
    calendar,
    plainDate,
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
  options,
  calendar = getBagCalendarOps(bag)
): IsoDateInternals {
  const fields = refineCalendarFields(
    calendar,
    bag,
    dateFieldNames,
    getRequiredDateFields(calendar),
  )

  return calendar.dateFromFields(fields, refineOverflowOptions(options))
}

export function mergePlainDateBag(plainDate, bag, options) {
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
  input,
  inputFieldNames,
  extra,
  extraFieldNames,
) {
  const { calendar } = getInternals(input)

  inputFieldNames = calendar.fields(inputFieldNames)
  input = pluckProps(inputFieldNames, input)

  extraFieldNames = calendar.fields(extraFieldNames)
  extra = refineFields(extra, extraFieldNames, getRequiredDateFields(calendar))

  let mergedFields = calendar.mergeFields(input, extra)
  const mergedFieldNames = excludeArrayDuplicates([...inputFieldNames, ...extraFieldNames])
  mergedFields = refineFields(mergedFields, mergedFieldNames, [])

  return calendar.dateFromFields(mergedFields)
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(bag, options, calendar = getBagCalendarOps(bag)) {
  const fields = refineCalendarFields(
    calendar,
    bag,
    yearMonthFieldNames,
    getRequiredYearMonthFields(calendar),
  )

  return calendar.yearMonthFromFields(fields, refineOverflowOptions(options))
}

export function mergePlainYearMonthBag(plainYearMonth, bag, options) {
  const { calendar } = getInternals(plainYearMonth)
  const fields = mergeCalendarFields(
    calendar,
    plainYearMonth,
    bag,
    yearMonthFieldNames,
  )

  return calendar.yearMonthFromFields(fields, refineOverflowOptions(options))
}

export function convertPlainYearMonthToDate(plainYearMonth, bag) {
  return createPlainDate(
    convertToIso(plainYearMonth, yearMonthBasicNames, ensureObjectlike(bag), ['day']),
  )
}

export function convertToPlainYearMonth(
  input, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const { calendar } = getInternals(input)
  const fields = refineCalendarFields(
    calendar,
    input,
    yearMonthBasicNames,
    getRequiredYearMonthFields(calendar),
  )

  return createPlainYearMonth(
    calendar.yearMonthFromFields(fields),
  )
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(bag, options, calendar = extractBagCalendarOps(bag)) {
  const calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = queryCalendarImpl(isoCalendarId)
  }

  const fieldNames = calendar.fields(dateFieldNames)
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

  return calendar.monthDayFromFields(calendar, fields, refineOverflowOptions(options))
}

export function mergePlainMonthDayBag(plainMonthDay, bag, options) {
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
  input, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const { calendar } = getInternals(input)
  const fields = refineCalendarFields(
    calendar,
    input,
    monthDayBasicNames,
    getRequiredMonthDayFields(calendar),
  )

  return createPlainMonthDay(
    calendar.monthDayFromFields(fields),
  )
}

export function convertPlainMonthDayToDate(plainMonthDay, bag) {
  return createPlainDate(
    convertToIso(plainMonthDay, monthDayBasicNames, bag, ['year']),
  )
}

// PlainTime
// -------------------------------------------------------------------------------------------------

export function refinePlainTimeBag(bag, options) {
  const fields = refineFields(bag, timeFieldNames, [])

  return refineTimeFields(fields, refineOverflowOptions(options))
}

export function mergePlainTimeBag(plainTime, bag, options) {
  const fields = pluckProps(timeFieldNames, plainTime)
  const partialFields = refineFields(bag, timeFieldNames)
  const mergeFields = { ...fields, ...partialFields }

  return refineTimeFields(mergeFields, refineOverflowOptions(options))
}

function refineTimeFields(fields, overflow) {
  return constrainIsoTimeFields(timeFieldsToIso(fields), overflow)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag: Partial<DurationFields>): DurationInternals {
  const durationFields = refineFields(bag, durationFieldNames, [])
  return updateDurationFieldsSign(durationFields)
}

export function mergeDurationBag(durationInternals, bag) {
  const partialDurationFields = refineFields(bag, durationFieldNames)
  return updateDurationFieldsSign({ ...durationInternals, ...partialDurationFields })
}

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

function refineCalendarFields(
  calendar,
  bag,
  validFieldNames,
  requiredFieldNames = [], // a subset of validFieldNames
  forcedValidFieldNames = [],
) {
  const fieldNames = [...calendar.fields(validFieldNames), ...forcedValidFieldNames]
  return refineFields(bag, fieldNames, requiredFieldNames)
}

function mergeCalendarFields(
  calendar,
  obj,
  bag,
  validFieldNames,
  forcedValidFieldNames = [],
) {
  rejectInvalidBag(bag)

  const fieldNames = [...calendar.fields(validFieldNames), ...forcedValidFieldNames]
  let fields = refineFields(obj, fieldNames, [])
  const partialFields = refineFields(bag, fieldNames)

  fields = calendar.mergeFields(fields, partialFields)
  return refineFields(fields, fieldNames, []) // guard against ridiculous .mergeField results
}

function getBagCalendarOps(bag) { // defaults to ISO
  return extractBagCalendarOps(bag) || queryCalendarImpl(isoCalendarId)
}

function extractBagCalendarOps(bag) {
  const { calendar } = getInternals(bag) || {}
  if (calendar) {
    return calendar // CalendarOps
  }

  ({ calendar }) = bag
  if (calendar) {
    return queryCalendarOps(calendar)
  }
}

function rejectInvalidBag(bag) {
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
  bag,
  validFieldNames,
  requiredFieldNames, // a subset of fieldNames
  // if not given, then assumed to be 'partial' (defaults won't be applied)
) {
  const res = {}
  let any = false

  for (const fieldName in validFieldNames) {
    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      any = true

      if (builtinRefiners[fieldName]) {
        fieldVal = builtinRefiners[fieldName]
      }

      res[fieldName] = fieldVal
    } else if (requiredFieldNames) {
      if (requiredFieldNames.includes(fieldName)) {
        throw new TypeError('Missing required field name')
      }

      res[fieldName] = builtinDefaults[fieldName]
    }
  }

  if (!any) {
    throw new TypeError('No valid fields')
  }

  return res
}

export function refineComplexBag(key, ForbiddenClass, bag) {
  const internalArg = getInternals(bag)?.[key]
  if (internalArg) {
    return internalArg
  }

  forbidInstanceClass(bag, ForbiddenClass)

  if (!(key in bag)) {
    return bag
  } else {
    bag = bag[key]

    forbidInstanceClass(bag, ForbiddenClass)

    if (isObjectlike(bag) && !(key in bag)) {
      return bag
    }
  }
}

function forbidInstanceClass(obj, Class) {
  if (obj instanceof Class) {
    throw new RangeError(`Unexpected ${Class.prototype[Symbol.toStringTag]}`)
  }
}
