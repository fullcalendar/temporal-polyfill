import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/calendarFields'
import { LocalesArg, prepCachedPlainMonthDayFormat } from '../internal/formatIntl'
import { DateTimeDisplayOptions, OverflowOptions } from '../genericApi/optionsRefine'
import { PlainDateSlots, PlainMonthDaySlots } from '../genericApi/slotsGeneric'
import { extractCalendarIdFromBag, refineCalendarSlotString } from '../genericApi/calendarSlotString'
import * as PlainMonthDayFuncs from '../genericApi/plainMonthDay'
import { createNativeDateModOps, createNativeMonthDayModOps, createNativeMonthDayParseOps, createNativeMonthDayRefineOps, createNativePartOps } from '../internal/calendarNativeQuery'
import { computeMonthDayFields } from '../internal/calendarNative'

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.create(
    refineCalendarSlotString,
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromString(s: string): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.fromString(createNativeMonthDayParseOps, s)
}

export function fromFields(
  fields: MonthDayBag & { calendar?: string },
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendar = calendarMaybe || isoCalendarId // TODO: DRY-up this logic

  return PlainMonthDayFuncs.fromFields(
    createNativeMonthDayRefineOps,
    calendar,
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
  return PlainMonthDayFuncs.withFields(
    createNativeMonthDayModOps,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    modFields,
    options,
  )
}

export function equals(
  plainMonthDaySlots0: PlainMonthDaySlots<string>,
  plainMonthDaySlots1: PlainMonthDaySlots<string>,
): boolean {
  return PlainMonthDayFuncs.equals(plainMonthDaySlots0, plainMonthDaySlots1)
}

export function toString(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  options?: DateTimeDisplayOptions,
): string {
  return PlainMonthDayFuncs.toString(plainMonthDaySlots, options)
}

export function toJSON(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
): string {
  return PlainMonthDayFuncs.toJSON(plainMonthDaySlots)
}

export function toPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  bag: YearFields,
): PlainDateSlots<string> {
  return PlainMonthDayFuncs.toPlainDate(
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
