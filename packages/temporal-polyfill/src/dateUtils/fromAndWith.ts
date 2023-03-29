import { Temporal } from 'temporal-spec'
import { extractCalendar } from '../argParse/calendar'
import {
  dateFieldMap,
  dateTimeFieldMap,
  durationFieldMap,
  monthDayFieldMap,
  timeFieldMap,
  yearMonthFieldMap,
} from '../argParse/fieldStr'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { isObjectLike, refineFields } from '../argParse/refine'
import { extractTimeZone } from '../argParse/timeZone'
import { Calendar, calendarFrom, getCalendarImpl, mergeCalFields } from '../public/calendar'
import { PlainDate } from '../public/plainDate'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainYearMonth } from '../public/plainYearMonth'
import { ZonedDateTime } from '../public/zonedDateTime'
import { mapHash } from '../utils/obj'
import { safeDateFromFields } from './calendar'
import { constrainTimeISO } from './constrain'
import { partialLocalTimeToISO } from './dayAndTime'
import { DurationFields } from './durationFields'
import { isoEpochLeapYear } from './epoch'
import { ISOTimeFields } from './isoFields'
import { LocalTimeFields } from './localFields'
import { OffsetComputableFields } from './offset'
import { parseOffsetNano } from './parse'

export const processZonedDateTimeFromFields = buildSafeFunc(tryZonedDateTimeFromFields)
export const processDateTimeFromFields = buildSafeFunc(tryDateTimeFromFields)
export const processDateFromFields = buildSafeFunc(tryDateFromFields)
export const processYearMonthFromFields = buildSafeFunc(tryYearMonthFromFields)
export const processMonthDayFromFields = buildSafeFunc(tryMonthDayFromFields)
export const processTimeFromFields = buildSafeFunc(tryTimeFromFields)

export const processZonedDateTimeWithFields = buildSafeFunc(tryZonedDateTimeWithFields, true)
export const processDateTimeWithFields = buildSafeFunc(tryDateTimeWithFields, true)
export const processDateWithFields = buildSafeFunc(tryDateWithFields, true)
export const processYearMonthWithFields = buildSafeFunc(tryYearMonthWithFields, true)
export const processMonthDayWithFields = buildSafeFunc(tryMonthDayWithFields, true)
export const processTimeWithFields = buildSafeFunc(tryTimeWithFields, true)

export const processDurationFields = buildSafeFunc(tryDurationFields)

// ::from (UNSAFE verions)

function tryZonedDateTimeFromFields(
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  options?: Temporal.AssignmentOptions,
): OffsetComputableFields | undefined {
  const res = tryDateTimeFromFields(rawFields, overflowHandling, options)

  if (res) {
    return {
      ...res,
      timeZone: extractTimeZone(rawFields),
      offsetNanoseconds: rawFields.offset !== undefined
        ? parseOffsetNano(String(rawFields.offset))
        : undefined,
    }
  }
}

function tryDateTimeFromFields(
  rawFields: Temporal.PlainDateLike,
  overflowHandling: OverflowHandlingInt,
  options?: Temporal.AssignmentOptions,
): Temporal.PlainDateTimeISOFields | undefined {
  const calendar = extractCalendar(rawFields)
  const refinedFields = refineFieldsViaCalendar(rawFields, dateTimeFieldMap, calendar)

  return {
    // TODO: more DRY with tryTimeFromFields
    // ALSO: very important time-fields are read from refinedFields before passing
    // refinedFields to dateFromFields, because dateFromFields has potential to mutate it
    ...constrainTimeISO(partialLocalTimeToISO(refinedFields), overflowHandling),
    //
    ...safeDateFromFields(calendar, refinedFields, options).getISOFields(),
  }
}

function tryDateFromFields(
  rawFields: Temporal.PlainDateLike,
  options?: Temporal.AssignmentOptions,
): PlainDate | undefined {
  const calendar = extractCalendar(rawFields)
  const refinedFields = refineFieldsViaCalendar(rawFields, dateFieldMap, calendar)

  return safeDateFromFields(calendar, refinedFields, options)
}

function tryYearMonthFromFields(
  rawFields: Temporal.PlainYearMonthLike,
  options?: Temporal.AssignmentOptions,
): PlainYearMonth | undefined {
  const calendar = extractCalendar(rawFields)
  const refinedFields = refineFieldsViaCalendar(rawFields, yearMonthFieldMap, calendar)

  return calendar.yearMonthFromFields(refinedFields, options)
}

function tryMonthDayFromFields(
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainMonthDay | undefined {
  const calendar = extractCalendar(rawFields)
  const refinedFields = refineFieldsViaCalendar(rawFields, monthDayFieldMap, calendar)

  if (rawFields.year === undefined && rawFields.calendar === undefined) {
    refinedFields.year = isoEpochLeapYear
  }

  return calendar.monthDayFromFields(refinedFields, Object.assign(Object.create(null), options))
}

function tryTimeFromFields(
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  undefinedIfEmpty?: boolean,
): ISOTimeFields | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)

  let { calendar } = rawFields
  if (calendar !== undefined) {
    calendar = calendarFrom(calendar)
    if (calendar.toString() !== 'iso8601') {
      throw new RangeError('Cannot specify non-iso calendar for time')
    }
  }

  if (!undefinedIfEmpty || hasAnyProps(refinedFields)) {
    return constrainTimeISO(partialLocalTimeToISO(refinedFields), overflowHandling)
  }
}

// ::with (UNSAFE versions)

function tryZonedDateTimeWithFields(
  zonedDateTime: ZonedDateTime,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  options?: Temporal.AssignmentOptions,
): OffsetComputableFields | undefined {
  const res = tryDateTimeWithFields(zonedDateTime, rawFields, overflowHandling, options)
  const hasNewOffset = rawFields.offset !== undefined

  if (res || hasNewOffset) {
    return {
      ...(res || zonedDateTime.getISOFields()),
      timeZone: zonedDateTime.timeZone,
      offsetNanoseconds: hasNewOffset
        ? parseOffsetNano(String(rawFields.offset))
        : zonedDateTime.offsetNanoseconds,
    }
  }
}

function tryDateTimeWithFields(
  plainDateTime: any,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  options?: Temporal.AssignmentOptions,
): Temporal.PlainDateTimeISOFields | undefined {
  const dateRes = tryDateWithFields(plainDateTime, rawFields, options, true)
  const timeRes = tryTimeWithFields(plainDateTime, rawFields, overflowHandling, true)

  if (dateRes || timeRes) {
    return {
      ...plainDateTime.getISOFields(),
      ...(dateRes ? dateRes.getISOFields() : {}),
      ...timeRes,
    }
  }
}

function tryDateWithFields(
  plainDate: any,
  rawFields: any,
  options?: Temporal.AssignmentOptions,
  undefinedIfEmpty?: boolean,
): PlainDate | undefined {
  const calendar: Calendar = plainDate.calendar
  const filteredFields = refineFieldsViaCalendar(rawFields, dateFieldMap, calendar)

  if (!undefinedIfEmpty || hasAnyProps(filteredFields)) {
    const mergedFields = mergeFieldsViaCalendar(plainDate, filteredFields, dateFieldMap, calendar)
    return safeDateFromFields(calendar, mergedFields, options)
  }
}

function tryYearMonthWithFields(
  plainYearMonth: any,
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainYearMonth | undefined {
  const calendar: Calendar = plainYearMonth.calendar
  const mergedFields = mergeFieldsViaCalendar(
    plainYearMonth,
    rawFields,
    yearMonthFieldMap,
    calendar,
  )
  return calendar.yearMonthFromFields(mergedFields, Object.assign(Object.create(null), options))
}

function tryMonthDayWithFields(
  plainMonthDay: any,
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainMonthDay | undefined {
  const calendar: Calendar = plainMonthDay.calendar
  const mergedFields = mergeFieldsViaCalendar(
    plainMonthDay,
    rawFields,
    monthDayFieldMap,
    calendar,
  )
  return calendar.monthDayFromFields(mergedFields, Object.assign(Object.create(null), options))
}

function tryTimeWithFields(
  plainTime: any,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  undefinedIfEmpty?: boolean,
): ISOTimeFields | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)

  if (!undefinedIfEmpty || hasAnyProps(refinedFields)) {
    const mergedFields = mergeLocalTimeFields(plainTime, refinedFields)
    return constrainTimeISO(partialLocalTimeToISO(mergedFields), overflowHandling)
  }
}

// duration (used for ::from and ::with)

function tryDurationFields(rawFields: any): DurationFields | undefined {
  const refinedFields = refineFields(rawFields, durationFieldMap) as any // !!!

  if (hasAnyProps(refinedFields)) {
    return refinedFields
  }
}

// utils

function refineFieldsViaCalendar(
  objOrFields: any,
  fieldMap: any,
  calendar: Temporal.CalendarProtocol,
): any {
  let fieldNames = Object.keys(fieldMap)

  const fieldsMethod = calendar.fields // access right away (no `has`)
  if (fieldsMethod) {
    // Calendar::fields tests always expect alphabetical order
    fieldNames.sort()

    // convert to array and/or copy (done twice?)
    // (convert `fieldNames` result to Iterable as well?)
    fieldNames = [...fieldsMethod.call(calendar, fieldNames)]

    // guarantee order of access later
    fieldNames.sort()
  }

  // TODO: more DRY with refineFields
  const refinedFields: any = Object.create(null) // must be null-prototype for dateFromFields,etc
  for (const fieldName of fieldNames) {
    const rawValue = objOrFields[fieldName]
    if (rawValue !== undefined) {
      refinedFields[fieldName] = (fieldMap[fieldName] || identifyFunc)(rawValue)
    } else {
      refinedFields[fieldName] = undefined
    }
  }

  return refinedFields
}

function identifyFunc(a: any): any {
  return a
}

function mergeFieldsViaCalendar(
  existingObj: any,
  fields: any,
  fieldMap: any,
  calendar: Temporal.CalendarProtocol,
): any {
  const existingFields = refineFieldsViaCalendar(existingObj, fieldMap, calendar)

  const mergeFields = calendar.mergeFields
  if (mergeFields) {
    return mergeFields.call(calendar, existingFields, fields)
  }

  return mergeCalFields(
    existingFields,
    fields,
    getCalendarImpl(calendar as any)?.id || calendar.toString(), // HACK
  )
}

function mergeLocalTimeFields(
  base: LocalTimeFields,
  fields: Partial<LocalTimeFields>,
): LocalTimeFields {
  return mapHash(timeFieldMap, (_refineFunc, fieldName) => (
    fields[fieldName as keyof LocalTimeFields] ?? base[fieldName as keyof LocalTimeFields]
  ))
}

// TODO: use chaining instead of flag
function buildSafeFunc<Args extends any[], Res>(
  func: (...args: Args) => Res | undefined,
  isWith?: boolean,
): (...args: Args) => Res {
  return (...args: Args) => {
    if (isWith) {
      const rawFields = args[1]
      if (!isObjectLike(rawFields)) {
        throw new TypeError('must be object-like')
      }
      if (rawFields.calendar !== undefined) { // TODO: use `in` ?
        throw new TypeError('calendar not allowed')
      }
      if (rawFields.timeZone !== undefined) { // TODO: use `in` ?
        throw new TypeError('timeZone not allowed')
      }
    }
    const res = func(...args)
    if (!res) {
      throw new TypeError('No valid fields')
    }
    return res
  }
}

function hasAnyProps(fields: any): boolean {
  return Object.keys(filterAwayUndefined(fields)).length > 0
}

// hack
function filterAwayUndefined(obj: any) {
  const res: any = {}
  for (const key in obj) {
    const val = obj[key]
    if (val !== undefined) {
      res[key] = val
    }
  }
  return res
}
