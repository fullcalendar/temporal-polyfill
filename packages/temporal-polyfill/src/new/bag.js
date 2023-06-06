import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
  isoCalendarId,
} from './calendarConfig'
import {
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
import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import {
  durationFieldNames,
  durationFieldRefiners,
  updateDurationFieldsSign,
} from './durationFields'
import { constrainIsoTimeFields, isoEpochFirstLeapYear } from './isoMath'
import { parseOffsetNanoseconds } from './isoParse'
import {
  optionsToOverflow,
  toDisambiguation,
  toObject,
  toOffsetHandling,
  toOverflowOptions,
} from './options'
import { createPlainDate } from './plainDate'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainTime } from './plainTime'
import { createPlainYearMonth } from './plainYearMonth'
import { getMatchingInstantFor, getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import { isObjectLike, pluckProps, removeDuplicateStrings } from './util'
import { createZonedDateTime } from './zonedDateTime'

// ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function refineZonedDateTimeBag(bag, options) {
  const calendarOps = getCalendarOps(bag)
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateTimeFieldNames,
    getRequiredDateFields(calendarOps).concat(['offset']),
    ['timeZone'],
  )

  const timeZone = queryTimeZoneOps(fields.timeZone)
  const overflowHandling = optionsToOverflow(options)
  const isoDateFields = calendarOps.dateFromFields(fields, overflowHandling)
  const isoTimeFields = constrainIsoTimeFields(timeFieldsToIso(fields), overflowHandling)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    { ...isoDateFields, ...isoTimeFields },
    fields.offset !== undefined ? parseOffsetNanoseconds(fields.offset) : undefined,
    false, // z?
    toOffsetHandling(options),
    toDisambiguation(options),
    false, // fuzzy
  )

  return {
    epochNanoseconds,
    timeZone,
    calendar: calendarOps,
  }
}

export function mergeZonedDateTimeBag(zonedDateTime, bag, options) {
  const { calendar, timeZone } = getInternals(zonedDateTime)
  const fields = mergeCalendarFields(calendar, zonedDateTime, bag, dateTimeFieldNames, ['offset'])
  const overflowHandling = optionsToOverflow(options)
  const isoDateFields = calendar.dateFromFields(fields, overflowHandling)
  const isoTimeFields = constrainIsoTimeFields(timeFieldsToIso(fields), overflowHandling)

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    { ...isoDateFields, ...isoTimeFields },
    parseOffsetNanoseconds(fields.offset),
    false, // z?
    toOffsetHandling(options),
    toDisambiguation(options),
    false, // fuzzy
  )

  return {
    epochNanoseconds,
    timeZone,
    calendar,
  }
}

export function createZonedDateTimeConverter(getAdditionalIsoFields) {
  return (internals, options) => {
    const refinedOptions = toObject(options) // required!!!
    const epochNanoseconds = getSingleInstantFor(
      internals.timeZone,
      {
        ...internals,
        ...getAdditionalIsoFields(refinedOptions),
      },
    )

    return createZonedDateTime({
      epochNanoseconds,
      timeZone: internals.timeZone,
      calendar: internals.calendar,
    })
  }
}

// PlainDateTime
// -------------------------------------------------------------------------------------------------

export function refinePlainDateTimeBag(bag, options) {
  const calendarOps = getCalendarOps(bag)
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateTimeFieldNames,
    getRequiredDateFields(calendarOps),
  )
  const overflowHandling = optionsToOverflow(options)
  const isoDateInternals = calendarOps.dateFromFields(fields, overflowHandling)
  const isoTimeFields = constrainIsoTimeFields(timeFieldsToIso(fields), overflowHandling)

  return {
    ...isoDateInternals,
    ...isoTimeFields,
  }
}

export function mergePlainDateTimeBag(plainDate, bag, options) {
  const { calendar } = getInternals(plainDate)
  const fields = mergeCalendarFields(calendar, plainDate, bag, dateTimeFieldNames)
  const overflowHandling = optionsToOverflow(options)
  const isoDateInternals = calendar.dateFromFields(fields, overflowHandling)
  const isoTimeFields = constrainIsoTimeFields(timeFieldsToIso(fields), overflowHandling)

  return {
    ...isoDateInternals,
    ...isoTimeFields,
  }
}

// PlainDate
// -------------------------------------------------------------------------------------------------

export function refinePlainDateBag(bag, options) {
  const calendarOps = getCalendarOps(bag)
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    dateFieldNames,
    getRequiredDateFields(calendarOps),
  )

  return calendarOps.dateFromFields(fields, optionsToOverflow(options))
}

export function mergePlainDateBag(plainDate, bag, options) {
  const { calendar } = getInternals(plainDate)
  const fields = mergeCalendarFields(calendar, plainDate, bag, dateFieldNames)

  return calendar.dateFromFields(fields, optionsToOverflow(options))
}

function convertToPlainDate(
  obj,
  objFieldNames,
  additionalFields, // bag or obj
  additionalFieldNames,
) {
  const { calendar } = getInternals(obj)
  const receiverFieldNames = calendar.fields(objFieldNames)
  const receiverFields = pluckProps(receiverFieldNames, obj)
  const inputFieldNames = calendar.fields(additionalFieldNames)
  const inputFields = refineFields(
    additionalFields,
    inputFieldNames,
    getRequiredDateFields(calendar),
  )
  const mergedFieldNames = removeDuplicateStrings(receiverFieldNames.concat(inputFieldNames))
  let mergedFields = calendar.mergeFields(receiverFields, inputFields)
  mergedFields = refineFields(mergedFields, mergedFieldNames, [])

  return createPlainDate({
    ...calendar.dateFromFields(mergedFields, 'reject'),
    calendar,
  })
}

// PlainYearMonth
// -------------------------------------------------------------------------------------------------

export function refinePlainYearMonthBag(bag, options) {
  const calendarOps = getCalendarOps(bag)
  const fields = refineCalendarFields(
    calendarOps,
    bag,
    yearMonthFieldNames,
    getRequiredYearMonthFields(calendarOps),
  )
  return calendarOps.yearMonthFromFields(fields, optionsToOverflow(options))
}

export function mergePlainYearMonthBag(plainYearMonth, bag, options) {
  const { calendar } = getInternals(plainYearMonth)
  const fields = mergeCalendarFields(calendar, plainYearMonth, bag, yearMonthFieldNames)
  return calendar.yearMonthFromFields(fields, optionsToOverflow(options))
}

export function convertToPlainYearMonth(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const calendarOps = getInternals(dateObj).calendar
  const fields = refineCalendarFields(
    calendarOps,
    dateObj,
    yearMonthBasicNames,
    getRequiredYearMonthFields(calendarOps),
  )
  return createPlainYearMonth(calendarOps.yearMonthFromFields(fields, 'constrain'))
}

export function convertPlainYearMonthToFirst(plainYearMonth) {
  return convertPlainYearMonthToDate(plainYearMonth, { day: 1 })
}

export function convertPlainYearMonthToDate(plainYearMonth, bag) {
  return convertToPlainDate(
    plainYearMonth,
    yearMonthBasicNames, // what to extract from plainYearMonth
    bag,
    ['day'], // what to extract from bag
  )
}

// PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function refinePlainMonthDayBag(bag, options) {
  let calendar = extractCalendarOps(bag)
  let calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = bag.calendar
    calendarAbsent = calendar === undefined
    calendar = queryCalendarOps(calendarAbsent ? isoCalendarId : calendar)
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

  return calendar.monthDayFromFields(calendar, fields, optionsToOverflow(options))
}

export function mergePlainMonthDayBag(plainMonthDay, bag, options) {
  const { calendar } = getInternals(plainMonthDay)
  const fields = mergeCalendarFields(calendar, plainMonthDay, bag, dateFieldNames)
  return calendar.monthDayFromFields(fields, optionsToOverflow(options))
}

export function convertToPlainMonthDay(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const calendarOps = getInternals(dateObj).calendar
  const fields = refineCalendarFields(
    calendarOps,
    dateObj,
    monthDayBasicNames,
    getRequiredMonthDayFields(calendarOps),
  )

  return createPlainMonthDay(calendarOps.monthDayFromFields(fields, 'constrain'))
}

export function convertPlainMonthDayToDate(plainMonthDay, bag) {
  return convertToPlainDate(
    plainMonthDay,
    monthDayBasicNames, // what to extract from plainMonthDay
    bag,
    ['year'], // what to extract from bag
  )
}

// PlainTime
// -------------------------------------------------------------------------------------------------

export function refinePlainTimeBag(bag, options) {
  const overflowHandling = toOverflowOptions(options) // TODO: single opt!
  const fields = refineFields(bag, timeFieldNames, [])

  return constrainIsoTimeFields(timeFieldsToIso(fields), overflowHandling)
}

export function mergePlainTimeBag(plainTime, bag, options) {
  const fields = pluckProps(timeFieldNames, plainTime)
  const additionalFields = refineFields(bag, timeFieldNames)
  const newFields = { ...fields, ...additionalFields }
  const overflowHandling = toOverflowOptions(options) // TODO: single opt!
  const isoTimeFields = constrainIsoTimeFields(timeFieldsToIso(newFields), overflowHandling)

  return createPlainTime(isoTimeFields)
}

// Duration
// -------------------------------------------------------------------------------------------------

export function refineDurationBag(bag) {
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
  calendarOps,
  bag,
  validFieldNames,
  requiredFieldNames = [],
  forcedValidFieldNames = [],
) {
  const fieldNames = calendarOps.fields(validFieldNames)
    .concat(requiredFieldNames, forcedValidFieldNames)
  const fields = refineFields(bag, fieldNames, requiredFieldNames)
  return fields
}

function mergeCalendarFields(
  calendarOps,
  obj,
  bag,
  validFieldNames,
  requiredFieldNames = [],
) {
  // TODO: check bag doesn't have timezone/calendar
  const fieldNames = calendarOps.fields(validFieldNames)
  fieldNames.push(...requiredFieldNames)
  let fields = refineFields(obj, fieldNames, requiredFieldNames)
  const additionalFields = refineFields(bag, fieldNames) // partial
  fields = calendarOps.mergeFields(fields, additionalFields)
  fields = refineFields(fields, fieldNames, requiredFieldNames)
  return [fields]
}

function getCalendarOps(bag) {
  return extractCalendarOps(bag) || queryCalendarOps(isoCalendarId)
}

function extractCalendarOps(bag) {
  const { calendar } = getInternals(bag) || {}
  if (calendar) {
    return calendar // CalendarOps
  }

  ({ calendar }) = bag
  if (calendar) {
    return queryCalendarOps(calendar)
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
If requiredFields not given, then assumed to be 'partial' (defaults won't be applied)
*/
export function refineFields(bag, fieldNames, requiredFields) {
  console.log(builtinRefiners)
  console.log(builtinDefaults)
  // TODO: error-out if no valid vields
}

export function createComplexBagRefiner(key, ForbiddenClass) {
  return function(bag) {
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

      if (isObjectLike(bag) && !(key in bag)) {
        return bag
      }
    }
  }
}

function forbidInstanceClass(obj, Class) {
  if (obj instanceof Class) {
    throw new RangeError(`Unexpected ${Class.prototype[Symbol.toStringTag]}`)
  }
}
