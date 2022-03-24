import { extractCalendar } from '../argParse/calendar'
import {
  dateFieldMap,
  durationFieldMap,
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
import { DateLike, DateTimeISOFields, OverflowOptions, YearMonthLike } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { mapHash } from '../utils/obj'
import { DurationFields } from './duration'
import { isoEpochLeapYear } from './isoMath'
import { monthDayFieldMap } from './monthDay'
import { parseOffsetNano } from './parse'
import {
  TimeFields,
  TimeISOEssentials,
  timeFieldsToConstrainedISO,
  zeroTimeISOFields,
} from './time'
import { ZonedDateTimeISOEssentials } from './zonedDateTime'

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
  options?: OverflowOptions,
): ZonedDateTimeISOEssentials | undefined {
  const res = tryDateTimeFromFields(rawFields, overflowHandling, options)

  if (res) {
    return {
      ...res,
      timeZone: extractTimeZone(rawFields),
      offset: rawFields.offset !== undefined
        ? parseOffsetNano(String(rawFields.offset))
        : undefined,
    }
  }
}

function tryDateTimeFromFields(
  rawFields: DateLike,
  overflowHandling: OverflowHandlingInt,
  options?: OverflowOptions,
): DateTimeISOFields | undefined {
  const dateRes = tryDateFromFields(rawFields, options)
  const timeRes = tryTimeFromFields(rawFields, overflowHandling)

  if (dateRes) {
    return {
      ...dateRes.getISOFields(),
      ...(timeRes || zeroTimeISOFields),
    }
  }
}

function tryDateFromFields(
  rawFields: DateLike,
  options?: OverflowOptions,
): PlainDate | undefined {
  const calendar = extractCalendar(rawFields)
  const filteredFields = filterFieldsViaCalendar(rawFields, dateFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    return calendar.dateFromFields(filteredFields, options)
  }
}

function tryYearMonthFromFields(
  rawFields: YearMonthLike,
  options?: OverflowOptions,
): PlainYearMonth | undefined {
  const calendar = extractCalendar(rawFields)
  const filteredFields = filterFieldsViaCalendar(rawFields, yearMonthFieldMap, calendar)

  if (hasAnyProps(filteredFields)) {
    return calendar.yearMonthFromFields(filteredFields, options)
  }
}

function tryMonthDayFromFields(
  rawFields: any,
  options?: OverflowOptions,
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
): TimeISOEssentials | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)

  if (hasAnyProps(refinedFields)) {
    return timeFieldsToConstrainedISO(refinedFields, overflowHandling)
  }
}

// ::with (UNSAFE versions)

function tryZonedDateTimeWithFields(
  zonedDateTime: ZonedDateTime,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  options?: OverflowOptions,
): ZonedDateTimeISOEssentials | undefined {
  const res = tryDateTimeWithFields(zonedDateTime, rawFields, overflowHandling, options)
  const hasNewOffset = rawFields.offset !== undefined

  if (res || hasNewOffset) {
    return {
      ...(res || zonedDateTime.getISOFields()),
      timeZone: zonedDateTime.timeZone,
      offset: hasNewOffset
        ? parseOffsetNano(String(rawFields.offset))
        : zonedDateTime.offsetNanoseconds,
    }
  }
}

function tryDateTimeWithFields(
  plainDateTime: any,
  rawFields: any,
  overflowHandling: OverflowHandlingInt,
  options?: OverflowOptions,
): DateTimeISOFields | undefined {
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
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
): TimeISOEssentials | undefined {
  const refinedFields = refineFields(rawFields, timeFieldMap)
  const mergedFields = mergeTimeFields(plainTime, refinedFields)

  if (hasAnyProps(refinedFields)) {
    return timeFieldsToConstrainedISO(mergedFields, overflowHandling)
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

function filterFieldsViaCalendar(fields: any, fieldMap: any, calendar: Calendar): any {
  let fieldNames = Object.keys(fieldMap)

  if (calendar.fields) { // can be a minimal Calendar 'protocol'
    fieldNames = calendar.fields(fieldNames)
  }

  return filterFieldsViaWhitelist(fields, fieldNames)
}

function filterFieldsViaWhitelist(fields: any, whitelist: string[]): any {
  const filtered = {} as any

  for (const propName of whitelist) {
    if (fields[propName] !== undefined) {
      filtered[propName] = fields[propName]
    }
  }

  return filtered
}

function mergeFieldsViaCalendar(
  existingObj: any,
  fields: any,
  fieldMap: any,
  calendar: Calendar,
): any {
  const existingFields = filterFieldsViaCalendar(existingObj, fieldMap, calendar)
  if (calendar.mergeFields) { // check not minimal Calendar 'protocol'
    return calendar.mergeFields(existingFields, fields)
  }
  return mergeCalFields(existingFields, fields)
}

function mergeTimeFields(base: TimeFields, fields: Partial<TimeFields>): TimeFields {
  return mapHash(timeFieldMap, (_refineFunc, fieldName) => (
    fields[fieldName as keyof TimeFields] ?? base[fieldName as keyof TimeFields]
  ))
}

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
