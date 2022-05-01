import { Temporal } from 'temporal-spec'
import { extractCalendar } from '../argParse/calendar'
import {
  dateFieldMap,
  durationFieldMap,
  monthDayFieldMap,
  timeFieldMap,
  yearMonthFieldMap,
} from '../argParse/fieldStr'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { isObjectLike, refineFields } from '../argParse/refine'
import { extractTimeZone } from '../argParse/timeZone'
import { Calendar, mergeCalFields } from '../public/calendar'
import { PlainDate } from '../public/plainDate'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainYearMonth } from '../public/plainYearMonth'
import { ZonedDateTime } from '../public/zonedDateTime'
import { mapHash } from '../utils/obj'
import { constrainTimeISO } from './constrain'
import { partialLocalTimeToISO, zeroISOTimeFields } from './dayAndTime'
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
  const dateRes = tryDateFromFields(rawFields, options)
  const timeRes = tryTimeFromFields(rawFields, overflowHandling)

  if (dateRes) {
    return {
      ...dateRes.getISOFields(),
      ...(timeRes || zeroISOTimeFields),
    }
  }
}

function tryDateFromFields(
  rawFields: Temporal.PlainDateLike,
  options?: Temporal.AssignmentOptions,
): PlainDate | undefined {
  const calendar = extractCalendar(rawFields)
  const filteredFields = filterFieldsViaCalendar(rawFields, dateFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    return calendar.dateFromFields(filteredFields, options)
  }
}

function tryYearMonthFromFields(
  rawFields: Temporal.PlainYearMonthLike,
  options?: Temporal.AssignmentOptions,
): PlainYearMonth | undefined {
  const calendar = extractCalendar(rawFields)
  const filteredFields = filterFieldsViaCalendar(rawFields, yearMonthFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    return calendar.yearMonthFromFields(filteredFields, options)
  }
}

function tryMonthDayFromFields(
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainMonthDay | undefined {
  const calendar = extractCalendar(rawFields)
  const filteredFields = filterFieldsViaCalendar(rawFields, monthDayFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    if (rawFields.year === undefined && rawFields.calendar === undefined) {
      filteredFields.year = isoEpochLeapYear
    }

    return calendar.monthDayFromFields(filteredFields, options)
  }
}

function tryTimeFromFields(
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
): ISOTimeFields | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)

  if (hasAnyProps(refinedFields)) {
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
  const dateRes = tryDateWithFields(plainDateTime, rawFields, options)
  const timeRes = tryTimeWithFields(plainDateTime, rawFields, overflowHandling)

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
): PlainDate | undefined {
  const calendar: Calendar = plainDate.calendar
  const filteredFields = filterFieldsViaCalendar(rawFields, dateFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    const mergedFields = mergeFieldsViaCalendar(plainDate, filteredFields, dateFieldMap, calendar)
    return calendar.dateFromFields(mergedFields, options)
  }
}

function tryYearMonthWithFields(
  plainYearMonth: any,
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainYearMonth | undefined {
  const calendar: Calendar = plainYearMonth.calendar
  const filteredFields = filterFieldsViaCalendar(rawFields, yearMonthFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    const mergedFields = mergeFieldsViaCalendar(
      plainYearMonth,
      rawFields,
      yearMonthFieldMap,
      calendar,
    )
    return calendar.yearMonthFromFields(mergedFields, options)
  }
}

function tryMonthDayWithFields(
  plainMonthDay: any,
  rawFields: any,
  options?: Temporal.AssignmentOptions,
): PlainMonthDay | undefined {
  const calendar: Calendar = plainMonthDay.calendar
  const filteredFields = filterFieldsViaCalendar(rawFields, monthDayFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    const mergedFields = mergeFieldsViaCalendar(
      plainMonthDay,
      rawFields,
      monthDayFieldMap,
      calendar,
    )
    return calendar.monthDayFromFields(mergedFields, options)
  }
}

function tryTimeWithFields(
  plainTime: any,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
): ISOTimeFields | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)

  if (hasAnyProps(refinedFields)) {
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

function filterFieldsViaCalendar(
  objOrFields: any,
  fieldMap: any,
  calendar: Temporal.CalendarProtocol,
): any {
  let fieldNames = Object.keys(fieldMap)

  if (calendar.fields) {
    // convert Iterable<string> to string[]... better way?
    fieldNames = Array.prototype.slice.call(calendar.fields(fieldNames))
  } else {
    // a Calendar 'protocol'
    // filter by method names
    fieldNames = Object.keys(filterFieldsViaWhitelist(calendar, fieldNames))
  }

  return filterFieldsViaWhitelist(objOrFields, fieldNames)
}

function filterFieldsViaWhitelist(objOrFields: any, whitelist: string[]): any {
  const filtered = {} as any

  for (const propName of whitelist) {
    if (objOrFields[propName] !== undefined) {
      filtered[propName] = objOrFields[propName]
    }
  }

  return filtered
}

function mergeFieldsViaCalendar(
  existingObj: any,
  fields: any,
  fieldMap: any,
  calendar: Temporal.CalendarProtocol,
): any {
  const existingFields = filterFieldsViaCalendar(existingObj, fieldMap, calendar)

  if (calendar.mergeFields) {
    return calendar.mergeFields(existingFields, fields)
  }

  return mergeCalFields(existingFields, fields)
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
      if (rawFields.calendar !== undefined) {
        throw new TypeError('calendar not allowed')
      }
      if (rawFields.timeZone !== undefined) {
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
  return Object.keys(fields).length > 0
}
