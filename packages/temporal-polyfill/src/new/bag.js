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
  addSignToDurationFields,
  durationFieldNames,
  durationFieldRefiners,
} from './durationFields'
import { epochNanoToIsoFields, isoEpochFirstLeapYear } from './isoMath'
import { parseOffsetNanoseconds } from './isoParse'
import {
  constrainIsoDateTimeFields,
  constrainIsoTimeFields,
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
import { createLazyMap, isObjectLike, pluckProps, removeDuplicateStrings } from './util'
import { createZonedDateTime } from './zonedDateTime'

// Duration
// -------------------------------------------------------------------------------------------------

export function bagToDurationFields(bag) {
  return prepareFields(bag, durationFieldNames, [])
}

export function durationWithBag(durationFields, bag) {
  const partialDurationFields = prepareFields(bag, durationFieldNames)
  return addSignToDurationFields({ ...durationFields, ...partialDurationFields })
}

// high level yo
// -------------------------------------------------------------------------------------------------

export function bagToZonedDateTimeInternals(bag, options) {
  const calendarOps = extractCalendarOpsFromBag(bag)
  const fields = refineBag(
    calendarOps,
    bag,
    dateTimeFieldNames,
    getRequiredDateFields(calendarOps).concat(['offset']),
    ['timeZone'],
  )

  const timeZone = queryTimeZoneOps(fields.timeZone)
  const isoDateFields = calendarOps.dateFromFields(fields, optionsToOverflow(options))

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    { ...isoDateFields, ...timeFieldsToIso(fields) },
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

export function zonedDateTimeWithBag(zonedDateTime, bag, options) {
  const { calendar, timeZone } = getInternals(zonedDateTime)
  const fields = mergeBag(calendar, zonedDateTime, bag, dateTimeFieldNames, ['offset'])
  const isoDateFields = calendar.dateFromFields(fields, optionsToOverflow(options))

  const epochNanoseconds = getMatchingInstantFor(
    timeZone,
    { ...isoDateFields, ...timeFieldsToIso(fields) },
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
  let calendar = extractCalendarFieldFromBag(bag)
  let calendarAbsent = !calendar

  if (calendarAbsent) {
    calendar = bag.calendar
    calendarAbsent = calendar === undefined
    calendar = queryCalendarOps(calendarAbsent ? isoCalendarId : calendar)
  }

  const fieldNames = calendar.fields(dateFieldNames)
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
    fields.year = isoEpochFirstLeapYear
  }

  return calendar.monthDayFromFields(calendar, fields, optionsToOverflow(options))
}

export function plainMonthDayWithBag(plainMonthDay, bag, options) {
  const { calendar } = getInternals(plainMonthDay)
  const fields = mergeBag(calendar, plainMonthDay, bag, dateFieldNames)
  return calendar.monthDayFromFields(fields, optionsToOverflow(options))
}

export function bagToPlainYearMonthInternals(bag, options) {
  const calendarOps = extractCalendarOpsFromBag(bag)
  const fields = refineBag(
    calendarOps,
    bag,
    yearMonthFieldNames,
    getRequiredYearMonthFields(calendarOps),
  )
  return calendarOps.yearMonthFromFields(fields, optionsToOverflow(options))
}

export function plainYearMonthWithBag(plainYearMonth, bag, options) {
  const { calendar } = getInternals(plainYearMonth)
  const fields = mergeBag(calendar, plainYearMonth, bag, yearMonthFieldNames)
  return calendar.yearMonthFromFields(fields, optionsToOverflow(options))
}

export function bagToPlainTimeInternals(bag, options) {
  const overflowOpt = toOverflowOptions(options) // TODO: single opt!

  return constrainIsoTimeFields(
    timeFieldsToIso(
      prepareFields(bag, timeFieldNames, []),
    ),
    overflowOpt,
  )
}

export function plainTimeWithBag(plainTime, bag, options) {
  const overflowOpt = toOverflowOptions(options) // TODO: single opt!
  const fields = pluckProps(timeFieldNames, plainTime)
  const additionalFields = prepareFields(bag, timeFieldNames)
  const newInternals = timeFieldsToIso({
    ...fields,
    ...additionalFields,
  })
  return createPlainTime(
    constrainIsoTimeFields(newInternals, overflowOpt),
  )
}

export function bagToPlainDateSlots(bag, options) {
  const calendarOps = extractCalendarOpsFromBag(bag)
  const fields = refineBag(
    calendarOps,
    bag,
    dateFieldNames,
    getRequiredDateFields(calendarOps),
  )

  return {
    calendar: calendarOps,
    ...calendarOps.dateFromFields(fields, optionsToOverflow(options)),
  }
}

export function plainDateWithBag(plainDate, bag, options) {
  const { calendar } = getInternals(plainDate)
  const fields = mergeBag(calendar, plainDate, bag, dateFieldNames)

  return {
    calendar,
    ...calendar.dateFromFields(fields, optionsToOverflow(options)),
  }
}

export function bagToPlainDateTimeInternals(bag, options) {
  const calendarOps = extractCalendarOpsFromBag(bag)
  const fields = refineBag(
    calendarOps,
    bag,
    dateTimeFieldNames,
    getRequiredDateFields(calendarOps),
  )
  const plainDateTimeInternals = calendarOps.dateFromFields(fields, optionsToOverflow(options))

  return constrainIsoDateTimeFields({
    ...plainDateTimeInternals,
    ...timeFieldsToIso(fields),
  })
}

export function plainDateTimeWithBag(plainDate, bag, options) {
  const { calendar } = getInternals(plainDate)
  const fields = mergeBag(calendar, plainDate, bag, dateTimeFieldNames)
  const plainDateTimeInternals = calendar.dateFromFields(fields, optionsToOverflow(options))

  return constrainIsoDateTimeFields({
    ...plainDateTimeInternals,
    ...timeFieldsToIso(fields),
  })
}

// to PlainYearMonth/PlainMonthDay
// -------------------------------------------------------------------------------------------------

export function dateToPlainYearMonth(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const calendarOps = getInternals(dateObj).calendar
  const fields = refineBag(
    calendarOps,
    dateObj,
    yearMonthBasicNames,
    getRequiredYearMonthFields(calendarOps),
  )
  return createPlainYearMonth(calendarOps.yearMonthFromFields(fields, 'constrain'))
}

export function dateToPlainMonthDay(
  dateObj, // PlainDate/PlainDateTime/ZonedDateTime
) {
  const calendarOps = getInternals(dateObj).calendar
  const fields = refineBag(
    calendarOps,
    dateObj,
    monthDayBasicNames,
    getRequiredMonthDayFields(calendarOps),
  )
  return createPlainMonthDay(calendarOps.monthDayFromFields(fields, 'constrain'))
}

// to PlainDate
// -------------------------------------------------------------------------------------------------

export function plainYearMonthToPlainDateFirst(plainYearMonth) {
  return plainYearMonthToPlainDate(plainYearMonth, { day: 1 })
}

export function plainYearMonthToPlainDate(plainYearMonth, bag) {
  return mergeToPlainDate(
    plainYearMonth,
    yearMonthBasicNames, // what to extract from plainYearMonth
    bag,
    ['day'], // what to extract from bag
  )
}

export function plainMonthDayToPlainDate(plainMonthDay, bag) {
  return mergeToPlainDate(
    plainMonthDay,
    monthDayBasicNames, // what to extract from plainMonthDay
    bag,
    ['year'], // what to extract from bag
  )
}

// to PlainDateTime
// -------------------------------------------------------------------------------------------------

export const zonedDateTimeInternalsToIso = createLazyMap((
  internals, // { epochNanoseconds, timeZone }
) => { // { isoYear..., offsetNanoseconds }
  const offsetNanoseconds = internals.timeZone.getOffsetNanosecondsFor(internals.epochNanoseconds)
  const isoDateTimeFields = epochNanoToIsoFields(
    internals.epochNanoseconds.sub(offsetNanoseconds), // subtraction correct?
  )

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
  }
})

// to ZonedDateTime
// -------------------------------------------------------------------------------------------------

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

// Calendar-field processing
// -------------------------------------------------------------------------------------------------

function refineBag(
  calendarOps,
  bag,
  validFieldNames,
  requiredFieldNames = [],
  forcedValidFieldNames = [],
) {
  const fieldNames = calendarOps.fields(validFieldNames)
    .concat(requiredFieldNames, forcedValidFieldNames)
  const fields = prepareFields(bag, fieldNames, requiredFieldNames)
  return fields
}

function mergeBag(
  calendarOps,
  obj,
  bag,
  validFieldNames,
  requiredFieldNames = [],
) {
  // TODO: check bag doesn't have timezone/calendar
  const fieldNames = calendarOps.fields(validFieldNames)
  fieldNames.push(...requiredFieldNames)
  let fields = prepareFields(obj, fieldNames, requiredFieldNames)
  const additionalFields = prepareFields(bag, fieldNames) // partial
  fields = calendarOps.mergeFields(fields, additionalFields)
  fields = prepareFields(fields, fieldNames, requiredFieldNames)
  return [fields]
}

function mergeToPlainDate(
  obj,
  objFieldNames,
  other, // bag or obj
  otherFieldNames,
) {
  const { calendar } = getInternals(obj)
  const receiverFieldNames = calendar.fields(objFieldNames)
  const receiverFields = pluckProps(receiverFieldNames, obj)
  const inputFieldNames = calendar.fields(otherFieldNames)
  const inputFields = prepareFields(other, inputFieldNames, getRequiredDateFields(calendar))
  const mergedFieldNames = removeDuplicateStrings(receiverFieldNames.concat(inputFieldNames))
  let mergedFields = calendar.mergeFields(receiverFields, inputFields)
  mergedFields = prepareFields(mergedFields, mergedFieldNames, [])
  return createPlainDate({
    ...calendar.dateFromFields(mergedFields, 'reject'),
    calendar,
  })
}

// ahhh
// -------------------------------------------------------------------------------------------------

const builtinRefiners = {
  ...eraYearFieldRefiners,
  ...dateTimeFieldRefiners,
  ...durationFieldRefiners,
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
If requiredFields not given, then assumed to be 'partial' (defaults won't be applied)
*/
export function prepareFields(bag, fieldNames, requiredFields) {
  console.log(builtinRefiners)
  console.log(builtinDefaults)
  // TODO: error-out if no valid vields
}

function extractCalendarOpsFromBag(bag) {
  return queryCalendarOps(extractCalendarFieldFromBag(bag) || isoCalendarId)
}

function extractCalendarFieldFromBag(bag) {
  const internals = getInternals(bag)
  const { calendar } = internals || {}
  if (calendar) {
    return calendar
  }
  ({ calendar }) = bag
  if (calendar) {
    return queryCalendarOps(calendar)
  }
}
