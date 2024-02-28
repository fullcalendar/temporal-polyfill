import {
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
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import { OverflowOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainMonthDaySlots } from '../internal/slots'
import { bindArgs, createLazyGenerator } from '../internal/utils'
import { prepCachedPlainMonthDayFormat } from './intlFormatCache'
import {
  computeMonthDayFields,
  extractCalendarIdFromBag,
  refineCalendarIdString,
} from './utils'

// TODO: rename to keep scope? Slots/Fields/Bag?
export type { PlainMonthDaySlots, MonthDayBag }

export const create = bindArgs(
  constructPlainMonthDaySlots<string, string>,
  refineCalendarIdString,
)

export const fromString = bindArgs(
  parsePlainMonthDay,
  createNativeMonthDayParseOps,
)

export function fromFields(
  fields: MonthDayBag & { calendar?: string },
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendar = calendarMaybe || isoCalendarId

  return refinePlainMonthDayBag(
    createNativeMonthDayRefineOps(calendar),
    !calendarMaybe,
    fields,
    options,
  )
}

export const getFields = createLazyGenerator(
  computeMonthDayFields,
  WeakMap,
) as (slots: PlainMonthDaySlots<string>) => MonthDayFields

export function withFields(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  return plainMonthDayWithFields(
    createNativeMonthDayModOps,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    modFields,
    options,
  )
}

export const equals = plainMonthDaysEqual<string>

export const toString = formatPlainMonthDayIso<string>

export function toPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  bag: YearFields,
): PlainDateSlots<string> {
  return plainMonthDayToPlainDate(
    createNativeDateModOps,
    plainMonthDaySlots,
    computeMonthDayFields(plainMonthDaySlots),
    bag,
  )
}

export function toLocaleString(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(
    locales,
    options,
    slots,
  )
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(
    locales,
    options,
    slots,
  )
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
