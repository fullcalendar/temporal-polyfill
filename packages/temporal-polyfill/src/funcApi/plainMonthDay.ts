import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { OverflowOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainMonthDaySlots, extractCalendarIdFromBag, refineCalendarSlotString } from '../internal/slots'
import { createNativeDateModOps, createNativeMonthDayModOps, createNativeMonthDayParseOps, createNativeMonthDayRefineOps, createNativePartOps } from '../internal/calendarNativeQuery'
import { computeMonthDayFields } from '../internal/calendarNative'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { parsePlainMonthDay } from '../internal/parseIso'
import { plainMonthDayWithFields, refinePlainMonthDayBag } from '../internal/bag'
import { plainMonthDaysEqual } from '../internal/compare'
import { formatPlainMonthDayIso } from '../internal/formatIso'
import { plainMonthDayToPlainDate } from '../internal/convert'
import { prepCachedPlainMonthDayFormat } from './formatIntlCached'

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
): PlainMonthDaySlots<string> {
  return constructPlainMonthDaySlots(
    refineCalendarSlotString,
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromString(s: string): PlainMonthDaySlots<string> {
  return parsePlainMonthDay(createNativeMonthDayParseOps, s)
}

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

// TODO: put this in utils
export function getFields(slots: PlainMonthDaySlots<string>): MonthDayFields {
  const calendarOps = createNativePartOps(slots.calendar)
  return computeMonthDayFields(calendarOps, slots)
}

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

export const equals = plainMonthDaysEqual

export const toString = formatPlainMonthDayIso

export function toPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  bag: YearFields,
): PlainDateSlots<string> {
  return plainMonthDayToPlainDate(
    createNativeDateModOps,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    bag,
  )
}

export function toLocaleString(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
