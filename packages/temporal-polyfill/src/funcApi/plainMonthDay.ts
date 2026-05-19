import { plainMonthDaysEqual } from '../internal/compare'
import { constructMonthDaySlots } from '../internal/construct'
import { convertPlainMonthDayToDate } from '../internal/convert'
import { refinePlainMonthDayObjectLike } from '../internal/createFromFields'
import {
  InternalCalendar,
  getInternalCalendar,
} from '../internal/externalCalendar'
import { CalendarDateFields, MonthDayLikeObject } from '../internal/fieldTypes'
import { EraYearOrYear, MonthDayFields } from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { createFormatPrepper, monthDayConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import { mergePlainMonthDayFields } from '../internal/merge'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../internal/optionsModel'
import { identity, memoize } from '../internal/utils'
import {
  computeMonthDayFields,
  extractCalendarIdFromBag,
} from './calendarUtils'
import { DateTimeFormatLike, createDateTimeFormat } from './dateTimeFormat'
import * as PlainDateFns from './plainDate'

export type Record = CalendarDateFields & { calendar: InternalCalendar }

export type Fields = MonthDayFields
export type FromFields = MonthDayLikeObject
export type WithFields = Partial<MonthDayFields>
export type ToPlainDateFields = EraYearOrYear

export type AssignmentOptions = OverflowOptions
export type ToStringOptions = CalendarDisplayOptions
export type Format = DateTimeFormatLike<Record>

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructMonthDaySlots as (
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendarId = calendarMaybe || isoCalendarId
  const calendar = getInternalCalendar(calendarId)

  return refinePlainMonthDayObjectLike(
    calendar,
    !calendarMaybe,
    fields,
    options,
  )
}

export const fromString = parsePlainMonthDay as (s: string) => Record

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(computeMonthDayFields, WeakMap) as (
  record: Record,
) => Fields

// Setters
// -----------------------------------------------------------------------------

export const withFields = mergePlainMonthDayFields as (
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
) => Record

// Math
// -----------------------------------------------------------------------------

export const equals = plainMonthDaysEqual as (
  record0: Record,
  record1: Record,
) => boolean

// Conversion
// -----------------------------------------------------------------------------

export function toPlainDate(
  record: Record,
  fields: ToPlainDateFields,
): PlainDateFns.Record {
  return convertPlainMonthDayToDate(record.calendar, getFields(record), fields)
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(monthDayConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(monthDayConfig, identity, locales, options)
}

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRangeToParts(epochMilli0, epochMilli1!)
}

export const toString = formatPlainMonthDayIso as (
  record: Record,
  options?: ToStringOptions,
) => string
