import {
  dateFieldsToIso,
  isoCalendarId,
  mergeFields,
  monthDayFieldsToIso,
  toCalendarSlot,
  transformFieldNames,
  yearMonthFieldsToIso,
} from './calendarAdapter'
import {
  dateFieldNames,
  dateTimeFieldNames,
  dateTimeFieldRefiners,
  monthDayBasicNames,
  timeFieldDefaults,
  timeFieldNames,
  timeFieldsToIso,
  yearMonthBasicNames,
  yearMonthFieldNames,
} from './calendarFields'
import { toInteger, toObject } from './cast'
import {
  durationFieldDefaults,
  durationFieldRefiners,
  refineDurationFields,
} from './durationFields'
import {
  regulateIsoDateTimeFields,
  regulateIsoTimeFields,
} from './isoFields'
import { isObjectLike, pluckProps, removeDuplicateStrings } from './obj'
import { toDisambiguation, toOffsetHandling, toOverflowOptions } from './options'
import { parseOffsetNanoseconds } from './parse'
import { createPlainDate } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainMonthDay } from './plainMonthDay'
import { createPlainTime } from './plainTime'
import { createPlainYearMonth } from './plainYearMonth'
import { getInternals } from './temporalClass'
import {
  computeIsoFieldEpochNanoseconds,
  plainDateTimeToEpochNanoseconds,
  toTimeZoneSlot,
} from './timeZoneProtocol'
import { createZonedDateTime } from './zonedDateTime'

// Duration
// -------------------------------------------------------------------------------------------------

export function bagToDurationFields(bag) {
  return refineDurationFields({ ...durationFieldDefaults, ...bag })
}

// high level yo
// -------------------------------------------------------------------------------------------------

export function bagToZonedDateTimeInternals(bag, options) {
  const [calendar, fields] = refineBag(
    bag,
    dateTimeFieldNames,
    ['offset'],
    ['timeZone'],
  )

  const timeZone = toTimeZoneSlot(fields.timeZone)
  const isoFields = dateFieldsToIso(calendar, fields, options) // overflow options

  const epochNanoseconds = computeIsoFieldEpochNanoseconds(
    { ...isoFields, ...timeFieldsToIso(fields) },
    timeZone,
    fields.offset !== undefined ? parseOffsetNanoseconds(fields.offset) : undefined,
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

export function zonedDateTimeWithBag(zonedDateTime, bag, options) {
  const { timeZone } = getInternals(zonedDateTime)
  const [calendar, fields] = mergeBag(zonedDateTime, bag, dateTimeFieldNames, ['offset'])
  const isoFields = dateFieldsToIso(calendar, fields, options)

  const epochNanoseconds = computeIsoFieldEpochNanoseconds(
    { ...isoFields, ...timeFieldsToIso(fields) },
    timeZone,
    parseOffsetNanoseconds(fields.offset),
    false, // z?
    toOffsetHandling(options),
    toDisambiguation(options),
    false, // fuzzy
  )

  return createZonedDateTime({
    epochNanoseconds,
    timeZone,
    calendar,
  })
}

export function bagToPlainMonthDayInternals(bag, options) {
  let calendar = extractCalendar(bag)
  let calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = bag.calendar
    calendarAbsent = calendar === undefined

    if (calendarAbsent) {
      calendar = isoCalendarId
    } else {
      calendar = toCalendarSlot(calendar)
    }
  }

  const fieldNames = transformFieldNames(calendar, ['day', 'month', 'monthCode', 'year'])
  const fields = prepareFields(bag, fieldNames, [])

  // Callers who omit the calendar are not writing calendar-independent
  // code. In that case, `monthCode`/`year` can be omitted; `month` and
  // `day` are sufficient. Add a `year` to satisfy calendar validation.
  if (
    calendarAbsent &&
    fields.month !== undefined &&
    fields.monthCode === undefined &&
    fields.year === undefined
  ) {
    fields.year = 1972
  }

  return monthDayFieldsToIso(calendar, fields, options)
}

export function plainMonthDayWithBag(plainMonthDay, bag, options) {
  return monthDayFieldsToIso(
    ...mergeBag(plainMonthDay, bag, ['month', 'monthCode', 'year']),
    options,
  )
}

export function bagToPlainYearMonthInternals(bag, options) {
  return yearMonthFieldsToIso(...refineBag(bag, yearMonthFieldNames), options)
}

export function plainYearMonthWithBag(plainYearMonth, bag, options) {
  return yearMonthFieldsToIso(
    ...mergeBag(plainYearMonth, bag, yearMonthFieldNames),
    options,
  )
}

export function bagToPlainTimeInternals(bag, options) {
  const overflowOpt = toOverflowOptions(options) // TODO: single opt!

  return regulateIsoTimeFields(
    timeFieldsToIso(
      prepareFields(bag, timeFieldNames, []),
    ),
    overflowOpt,
  )
}

export function plainTimeWithBag(plainTime, bag, options) {
  const overflowOpt = toOverflowOptions(options) // TODO: single opt!
  const fields = pluckProps(plainTime, timeFieldNames)
  const additionalFields = prepareFields(bag, timeFieldNames)
  const newInternals = timeFieldsToIso({
    ...fields,
    ...additionalFields,
  })
  return createPlainTime(
    regulateIsoTimeFields(newInternals, overflowOpt),
  )
}

export function bagToPlainDateSlots(bag, options) {
  return dateFieldsToIso(...refineBag(bag, dateFieldNames), options)
}

export function plainDateWithBag(plainDate, bag, options) {
  return dateFieldsToIso(...mergeBag(plainDate, bag, dateFieldNames), options)
}

export function bagToPlainDateTimeInternals(bag, options) {
  const [calendar, fields] = refineBag(bag, dateTimeFieldNames)
  const plainDateTimeInternals = dateFieldsToIso(calendar, fields, options)

  return regulateIsoDateTimeFields({
    ...plainDateTimeInternals,
    ...timeFieldsToIso(fields),
  })
}

export function plainDateTimeWithBag(plainDate, bag, options) {
  const [calendar, fields] = mergeBag(plainDate, bag, dateTimeFieldNames)
  const plainDateTimeInternals = dateFieldsToIso(calendar, fields, options)

  return regulateIsoDateTimeFields({
    ...plainDateTimeInternals,
    ...timeFieldsToIso(fields),
  })
}

// to PlainYearMonth/PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function dateToPlainYearMonth(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  return createPlainYearMonth(yearMonthFieldsToIso(...pluckFields(dateObj, yearMonthBasicNames)))
}

export function dateToPlainMonthDay(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  return createPlainMonthDay(monthDayFieldsToIso(...pluckFields(dateObj, monthDayBasicNames)))
}

// to PlainDate
// -------------------------------------------------------------------------------------------------

export function plainYearMonthToPlainDateFirst(plainYearMonth) {
  return plainYearMonthToPlainDate(plainYearMonth, { day: 1 })
}

export function plainYearMonthToPlainDate(plainYearMonth, bag) {
  return mergeToPlainDate(plainYearMonth, yearMonthBasicNames, bag, ['day'])
}

export function plainMonthDayToPlainDate(plainMonthDay, bag) {
  return mergeToPlainDate(plainMonthDay, monthDayBasicNames, bag, ['year'])
}

// to PlainDateTime
// -------------------------------------------------------------------------------------------------

// bad name now. should have something with 'slots'
export function zonedDateTimeInternalsToIso(internals) {
  // use timeZone2.js
  /*
  return instantToPlainDateTime(
    internals.timeZone,
    internals.calendar,
    createInstant(internals.epochNanoseconds),
  )
  */
}

// to ZonedDateTime
// -------------------------------------------------------------------------------------------------

export function createZonedDateTimeConverter(getRequiredInternals) {
  return (internals, options) => {
    const refinedOptions = toObject(options) // required!!!
    const epochNanoseconds = plainDateTimeToEpochNanoseconds(
      refinedOptions.timeZone,
      createPlainDateTime({
        ...internals,
        ...getRequiredInternals(refinedOptions),
      }),
    )

    return createZonedDateTime({
      epochNanoseconds,
      timeZone: internals.timeZone,
      calendar: internals.calendar,
    })
  }
}

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

export function refineBag(
  bag,
  validFieldNames,
  requiredFieldNames = [],
  forcedValidFieldNames = [],
) {
  const calendar = extractCalendar(bag) || isoCalendarId
  const fieldNames = transformFieldNames(calendar, validFieldNames)
    .concat(requiredFieldNames, forcedValidFieldNames)
  const fields = prepareFields(bag, fieldNames, requiredFieldNames)
  return [calendar, fields]
}

export function mergeBag(
  obj,
  bag,
  validFieldNames,
  requiredFieldNames = [],
) {
  // TODO: check bag doesn't have timezone/calendar
  const { calendar } = getInternals(obj)
  const fieldNames = transformFieldNames(calendar, validFieldNames)
  fieldNames.push(...requiredFieldNames)
  let fields = prepareFields(obj, fieldNames, requiredFieldNames)
  const additionalFields = prepareFields(bag, fieldNames) // partial
  fields = mergeFields(calendar, fields, additionalFields)
  fields = prepareFields(fields, fieldNames, requiredFieldNames)
  return [calendar, fields]
}

function mergeToPlainDate(
  obj,
  objFieldNames,
  other, // bag or obj
  otherFieldNames,
) {
  const { calendar } = getInternals(obj)
  const receiverFieldNames = transformFieldNames(calendar, objFieldNames)
  const receiverFields = pluckProps(obj, receiverFieldNames)
  const inputFieldNames = transformFieldNames(calendar, otherFieldNames)
  const inputFields = prepareFields(other, inputFieldNames, [])
  const mergedFieldNames = removeDuplicateStrings(receiverFieldNames.concat(inputFieldNames))
  let mergedFields = mergeFields(calendar, receiverFields, inputFields)
  mergedFields = prepareFields(mergedFields, mergedFieldNames, [])
  return createPlainDate(mergedFields, { overflow: 'reject' })
}

function pluckFields(obj, validFieldNames) {
  const { calendar } = getInternals(obj)
  const fieldNames = transformFieldNames(calendar, validFieldNames)
  return [calendar, pluckProps(obj, fieldNames)]
}

// ahhh
// -------------------------------------------------------------------------------------------------

const builtinRefiners = {
  ...dateTimeFieldRefiners,
  ...durationFieldRefiners,
  era: toString,
  eraYear: toInteger,
  offset: toString,
}

const builtinDefaults = timeFieldDefaults

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

/*
If requiredFields not given, then assumed to be 'partial'
*/
export function prepareFields(bag, fieldNames, requiredFields) {
  console.log(builtinRefiners)
  console.log(builtinDefaults)
  // TODO: error-out if no valid vields
}

export function isStringCastsEqual(obj0, obj1) {
  return obj0 === obj1 || // optimization
    String(obj0) === String(obj1)
}

/*
Won't default to iso
*/
function extractCalendar(bag) {
  const internals = getInternals(bag)
  const { calendar } = internals || {}
  if (calendar) {
    return calendar
  }
  ({ calendar }) = bag
  if (calendar) {
    return toCalendarSlot(calendar)
  }
}

export function mapRefiners(input, refinerMap) {
  // loops get driven props of input
}
