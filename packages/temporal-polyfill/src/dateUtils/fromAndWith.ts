import { extractCalendar } from '../argParse/calendar'
import { dateFieldMap, timeFieldMap, yearMonthFieldMap } from '../argParse/fieldStr'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { refineFields } from '../argParse/refine'
import { extractTimeZone } from '../argParse/timeZone'
import { Calendar } from '../public/calendar'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainYearMonth } from '../public/plainYearMonth'
import {
  DateLike,
  DateTimeISOFields,
  DateTimeLike,
  DateTimeOverrides,
  MonthDayOverrides,
  OverflowOptions,
  TimeLike,
  YearMonthLike,
  YearMonthOverrides,
  ZonedDateTimeLike,
  ZonedDateTimeOptions,
  ZonedDateTimeOverrides,
} from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { mapHash } from '../utils/obj'
import { isoEpochLeapYear } from './isoMath'
import { monthDayFieldMap } from './monthDay'
import { parseOffsetNano } from './parse'
import { TimeFields, TimeISOEssentials, timeFieldsToConstrainedISO } from './time'
import { ZonedDateTimeISOEssentials } from './zonedDateTime'

// ::from

export function processMonthDayFromFields(
  fields: any, // MonthDayLike,
  options?: OverflowOptions,
): PlainMonthDay {
  const calendar = extractCalendar(fields)
  fields = processFromFields(fields, calendar, monthDayFieldMap)

  // be nice and guess year if no calendar specified
  if (fields.year === undefined && fields.calendar === undefined) {
    fields.year = isoEpochLeapYear
  }

  return calendar.monthDayFromFields(fields, options)
}

export function processYearMonthFromFields(
  fields: YearMonthLike,
  options?: OverflowOptions,
): PlainYearMonth {
  const calendar = extractCalendar(fields)

  return calendar.yearMonthFromFields(
    processFromFields(fields, calendar, yearMonthFieldMap),
    options,
  )
}

export function processDateFromFields(arg: DateLike, options?: OverflowOptions): PlainDate {
  const calendar = extractCalendar(arg)

  return calendar.dateFromFields(
    processFromFields(arg, calendar, dateFieldMap),
    options,
  )
}

export function processDateTimeFromFields(
  fields: DateTimeLike,
  overflowHandling: OverflowHandlingInt,
  origOptions?: OverflowOptions,
): DateTimeISOFields {
  return {
    ...processDateFromFields(fields, origOptions).getISOFields(),
    ...processTimeFromFields(fields, overflowHandling),
  }
}

export function processZonedDateTimeFromFields(
  fields: ZonedDateTimeLike,
  overflowHandling: OverflowHandlingInt,
  origOptions?: OverflowOptions,
): ZonedDateTimeISOEssentials {
  return {
    ...processDateFromFields(fields, origOptions).getISOFields(),
    ...processTimeFromFields(fields, overflowHandling),
    timeZone: extractTimeZone(fields),
    offset: fields.offset ? parseOffsetNano(fields.offset) : undefined,
  }
}

export function processTimeFromFields(
  fields: any,
  overflowHandling: OverflowHandlingInt,
): TimeISOEssentials {
  return timeFieldsToConstrainedISO(
    refineFields(fields, timeFieldMap),
    overflowHandling,
  )
}

function processFromFields(fields: any, calendar: Calendar, fieldMap: any): any {
  let fieldNames = Object.keys(fieldMap)

  if (calendar.fields) { // can be a minimal Calendar 'protocol'
    fieldNames = calendar.fields(fieldNames)
  }

  return filterFromFields(fields, fieldNames)
}

function filterFromFields(fields: any, whitelist: string[]): any {
  const filtered = {} as any
  let cnt = 0

  for (const propName of whitelist) {
    if (fields[propName] !== undefined) {
      filtered[propName] = fields[propName]
      cnt++
    }
  }

  if (!cnt) {
    throw new TypeError('Invalid object, no keys')
  }

  return filtered
}

// ::with

export function processMonthDayWithFields(
  plainMonthDay: PlainMonthDay,
  fields: MonthDayOverrides,
  options?: OverflowOptions,
): PlainMonthDay {
  const { calendar } = plainMonthDay

  return calendar.monthDayFromFields(
    processWithFields(plainMonthDay, calendar, fields, monthDayFieldMap),
    options,
  )
}

export function processYearMonthWithFields(
  plainYearMonth: PlainYearMonth,
  fields: YearMonthOverrides,
  options?: OverflowOptions,
): PlainYearMonth {
  const { calendar } = plainYearMonth

  return calendar.yearMonthFromFields(
    processWithFields(plainYearMonth, calendar, fields, yearMonthFieldMap),
    options,
  )
}

export function processDateWithFields(
  plainDate: any, // !!!
  fields: MonthDayOverrides,
  options?: OverflowOptions,
): PlainDate {
  const { calendar } = plainDate

  return calendar.dateFromFields(
    processWithFields(plainDate, calendar, fields, dateFieldMap),
    options,
  )
}

export function processDateTimeWithFields(
  plainDateTime: PlainDateTime,
  fields: DateTimeOverrides,
  overflowHandling: OverflowHandlingInt,
  origOptions?: OverflowOptions,
): DateTimeISOFields {
  return {
    ...processDateWithFields(plainDateTime, fields, origOptions).getISOFields(),
    ...processTimeWithFields(plainDateTime, fields, overflowHandling),
  }
}

export function processZonedDateTimeWithFields(
  zonedDateTime: ZonedDateTime,
  fields: ZonedDateTimeOverrides,
  overflowHandling: OverflowHandlingInt,
  origOptions?: ZonedDateTimeOptions, // need this specificity?
): ZonedDateTimeISOEssentials {
  return {
    ...processDateWithFields(zonedDateTime, fields, origOptions).getISOFields(),
    ...processTimeWithFields(zonedDateTime, fields, overflowHandling),
    timeZone: zonedDateTime.timeZone,
    offset: fields.offset ? parseOffsetNano(fields.offset) : zonedDateTime.offsetNanoseconds,
  }
}

export function processTimeWithFields(
  plainTime: any, // !!!
  fields: TimeLike,
  overflowHandling: OverflowHandlingInt,
): TimeISOEssentials {
  const refinedTimeFields = refineFields(fields, timeFieldMap)
  const mergedTimeFields = mergeTimeFields(plainTime, refinedTimeFields)

  return timeFieldsToConstrainedISO(mergedTimeFields, overflowHandling)
}

function mergeTimeFields(base: TimeFields, fields: Partial<TimeFields>): TimeFields {
  return mapHash(timeFieldMap, (_refineFunc, fieldName) => (
    fields[fieldName as keyof TimeFields] ?? base[fieldName as keyof TimeFields]
  ))
}

function processWithFields(base: any, calendar: Calendar, fields: any, fieldMap: any): any {
  let fieldNames = Object.keys(fieldMap)

  if (calendar.fields) { // can be a minimal Calendar 'protocol'
    fieldNames = calendar.fields(fieldNames)
  }

  const validFields = filterWithFields(fields, fieldNames)

  return calendar.mergeFields(base, validFields)
}

const invalidWithFields = ['calendar', 'timeZone']

function filterWithFields(fields: any, whitelist: string[]): any {
  for (const fieldName of invalidWithFields) {
    if (fields[fieldName] !== undefined) {
      throw new TypeError(`Disallowed field ${fieldName}`)
    }
  }

  return filterFromFields(fields, whitelist)
}
