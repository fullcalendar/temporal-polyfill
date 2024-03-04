import {
  PlainMonthDayBag,
  plainMonthDayWithFields,
  refinePlainMonthDayBag,
} from '../internal/bagRefine'
import { isoCalendarId } from '../internal/calendarConfig'
import {
  createNativeDateModOps,
  createNativeMonthDayModOps,
  createNativeMonthDayParseOps,
  createNativeMonthDayRefineOps,
} from '../internal/calendarNativeQuery'
import { plainMonthDaysEqual } from '../internal/compare'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { plainMonthDayToPlainDate } from '../internal/convert'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/fields'
import { createFormatPrepper, monthDayConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../internal/optionsRefine'
import { PlainMonthDaySlots } from '../internal/slots'
import { bindArgs, memoize } from '../internal/utils'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
import {
  computeMonthDayFields,
  extractCalendarIdFromBag,
  refineCalendarIdString,
} from './utils'

export type Record = Readonly<PlainMonthDaySlots<string>>
export type Fields = MonthDayFields
export type Bag = MonthDayBag
export type BagWithCalendar = PlainMonthDayBag<string>

export const create = bindArgs(
  constructPlainMonthDaySlots<string, string>,
  refineCalendarIdString,
) as (
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
) => Record

export const fromString = bindArgs(
  parsePlainMonthDay,
  createNativeMonthDayParseOps,
) as (s: string) => Record

export function fromFields(
  fields: BagWithCalendar,
  options?: OverflowOptions,
): Record {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendar = calendarMaybe || isoCalendarId

  return refinePlainMonthDayBag(
    createNativeMonthDayRefineOps(calendar),
    !calendarMaybe,
    fields,
    options,
  )
}

export const getFields = memoize(computeMonthDayFields, WeakMap) as (
  record: Record,
) => Fields

export function withFields(
  record: Record,
  bag: Bag,
  options?: OverflowOptions,
): Record {
  return plainMonthDayWithFields(
    createNativeMonthDayModOps,
    record,
    getFields(record),
    bag,
    options,
  )
}

export const equals = plainMonthDaysEqual<string> as (
  record0: Record,
  record1: Record,
) => boolean

export function toPlainDate(
  record: Record,
  bag: YearFields,
): PlainDateFns.Record {
  return plainMonthDayToPlainDate(
    createNativeDateModOps,
    record,
    getFields(record),
    bag,
  )
}

export const toString = formatPlainMonthDayIso<string> as (
  record: Record,
  options?: CalendarDisplayOptions,
) => string

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  monthDayConfig,
  /*@__PURE__*/ createFormatCache(),
)

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
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
