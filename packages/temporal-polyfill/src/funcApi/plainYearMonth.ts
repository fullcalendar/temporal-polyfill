import {
  plainYearMonthWithFields,
  refinePlainYearMonthBag,
} from '../internal/bagRefine'
import {
  createNativeDateModOps,
  createNativeYearMonthDiffOps,
  createNativeYearMonthModOps,
  createNativeYearMonthMoveOps,
  createNativeYearMonthParseOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { plainYearMonthToPlainDate } from '../internal/convert'
import { diffPlainYearMonth } from '../internal/diff'
import { YearMonthBag, YearMonthFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { movePlainYearMonth } from '../internal/move'
import { OverflowOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainYearMonthSlots } from '../internal/slots'
import { NumSign, bindArgs } from '../internal/utils'
import { prepCachedPlainYearMonthFormat } from './intlFormatCache'
import {
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeYearMonthFields,
  getCalendarIdFromBag,
  refineCalendarIdString,
} from './utils'

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
): PlainYearMonthSlots<string> {
  return constructPlainYearMonthSlots(
    refineCalendarIdString,
    isoYear,
    isoMonth,
    calendar,
    referenceIsoDay,
  )
}

export function fromString(s: string): PlainYearMonthSlots<string> {
  return parsePlainYearMonth(createNativeYearMonthParseOps, s)
}

export function fromFields(
  bag: YearMonthBag & { calendar?: string },
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return refinePlainYearMonthBag(
    createNativeYearMonthRefineOps(getCalendarIdFromBag(bag)),
    bag,
    options,
  )
}

export const getFields = computeYearMonthFields as (
  slots: PlainYearMonthSlots<string>,
) => YearMonthFields

export const daysInMonth = computeDaysInMonth as (
  slots: PlainYearMonthSlots<string>,
) => number
export const daysInYear = computeDaysInYear as (
  slots: PlainYearMonthSlots<string>,
) => number
export const monthsInYear = computeMonthsInYear as (
  slots: PlainYearMonthSlots<string>,
) => number
export const inLeapYear = computeInLeapYear as (
  slots: PlainYearMonthSlots<string>,
) => boolean

export function withFields(
  slots: PlainYearMonthSlots<string>,
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return plainYearMonthWithFields(
    createNativeYearMonthModOps,
    slots,
    computeYearMonthFields(slots),
    fields,
    options,
  )
}

export const add = bindArgs(
  movePlainYearMonth<string>,
  createNativeYearMonthMoveOps,
  false,
)
export const subtract = bindArgs(
  movePlainYearMonth<string>,
  createNativeYearMonthMoveOps,
  true,
)

export const until = bindArgs(
  diffPlainYearMonth<string>,
  createNativeYearMonthDiffOps,
  false,
)
export const since = bindArgs(
  diffPlainYearMonth<string>,
  createNativeYearMonthDiffOps,
  true,
)

export const equals = plainYearMonthsEqual<string>
export const compare = compareIsoDateFields as (
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>,
) => NumSign

export const toString = formatPlainYearMonthIso<string>

export function toPlainDate(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  plainYearMonthFields: YearMonthFields,
  bag: { day: number },
): PlainDateSlots<string> {
  return plainYearMonthToPlainDate(
    createNativeDateModOps,
    plainYearMonthSlots,
    plainYearMonthFields,
    bag,
  )
}

export function toLocaleString(
  slots: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainYearMonthFormat(
    locales,
    options,
    slots,
  )
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainYearMonthFormat(
    locales,
    options,
    slots,
  )
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainYearMonthFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainYearMonthFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
