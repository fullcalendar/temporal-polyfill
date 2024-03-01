import {
  isoTimeFieldsToCal,
  plainDateTimeWithFields,
  refinePlainDateTimeBag,
} from '../internal/bagRefine'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  plainDateTimeToPlainMonthDay,
  plainDateTimeToPlainYearMonth,
  plainDateTimeToZonedDateTime,
} from '../internal/convert'
import { diffPlainDateTimes } from '../internal/diff'
import { DateTimeBag, DateTimeFields } from '../internal/fields'
import {
  createFormatPrepper,
  isoDateFieldsToEpochNano,
  transformDateTimeOptions,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDateTime } from '../internal/isoParse'
import {
  plainDateTimeWithPlainDate,
  plainDateTimeWithPlainTime,
  slotsWithCalendar,
} from '../internal/modify'
import { movePlainDateTime } from '../internal/move'
import { OverflowOptions } from '../internal/optionsRefine'
import { roundPlainDateTime } from '../internal/round'
import {
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  createPlainDateSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { NumberSign, bindArgs, memoize } from '../internal/utils'
import { createFormatCache } from './intlFormatCache'
import {
  computeDateFields,
  computeDayOfYear,
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeWeekOfYear,
  computeYearOfWeek,
  getCalendarIdFromBag,
  refineCalendarIdString,
} from './utils'

// TODO: rename to keep scope? Slots/Fields/Bag?
export type { PlainDateTimeSlots, DateTimeBag }

export const create = bindArgs(
  constructPlainDateTimeSlots<string, string>,
  refineCalendarIdString,
)

export const fromString = parsePlainDateTime

export function fromFields(
  fields: DateTimeBag & { calendar?: string },
  options?: OverflowOptions,
): PlainDateTimeSlots<string> {
  return refinePlainDateTimeBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const getFields = memoize(
  (slots: PlainDateTimeSlots<string>): DateTimeFields => {
    return {
      ...computeDateFields(slots),
      ...isoTimeFieldsToCal(slots),
    }
  },
  WeakMap,
)

export const dayOfWeek = computeIsoDayOfWeek as (
  slots: PlainDateTimeSlots<string>,
) => number
export const daysInWeek = computeIsoDaysInWeek as (
  slots: PlainDateTimeSlots<string>,
) => number
export const weekOfYear = computeWeekOfYear as (
  slots: PlainDateTimeSlots<string>,
) => number | undefined
export const yearOfWeek = computeYearOfWeek as (
  slots: PlainDateTimeSlots<string>,
) => number | undefined
export const dayOfYear = computeDayOfYear as (
  slots: PlainDateTimeSlots<string>,
) => number
export const daysInMonth = computeDaysInMonth as (
  slots: PlainDateTimeSlots<string>,
) => number
export const daysInYear = computeDaysInYear as (
  slots: PlainDateTimeSlots<string>,
) => number
export const monthsInYear = computeMonthsInYear as (
  slots: PlainDateTimeSlots<string>,
) => number
export const inLeapYear = computeInLeapYear as (
  slots: PlainDateTimeSlots<string>,
) => boolean

export function withFields(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  newFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<string> {
  return plainDateTimeWithFields(
    createNativeDateModOps,
    plainDateTimeSlots,
    getFields(plainDateTimeSlots),
    newFields,
    options,
  )
}

export const withPlainDate = plainDateTimeWithPlainDate as (
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  plainDateSlots: PlainDateSlots<string>,
) => PlainDateTimeSlots<string>

export const withPlainTime = plainDateTimeWithPlainTime as (
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  plainTimeSlots?: PlainTimeSlots,
) => PlainDateTimeSlots<string>

export function withCalendar(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  calendarId: string,
): PlainDateTimeSlots<string> {
  return slotsWithCalendar(
    plainDateTimeSlots,
    refineCalendarIdString(calendarId),
  )
}

export const add = bindArgs(
  movePlainDateTime<string>,
  createNativeMoveOps,
  false,
)
export const subtract = bindArgs(
  movePlainDateTime<string>,
  createNativeMoveOps,
  true,
)

export const until = bindArgs(
  diffPlainDateTimes<string>,
  createNativeDiffOps,
  false,
)
export const since = bindArgs(
  diffPlainDateTimes<string>,
  createNativeDiffOps,
  true,
)

export const round = roundPlainDateTime<string>

export const equals = plainDateTimesEqual<string>

export const compare = compareIsoDateTimeFields as (
  plainDateTimeSlots0: PlainDateTimeSlots<string>,
  plainDateTimeSlots1: PlainDateTimeSlots<string>,
) => NumberSign

export const toZonedDateTime = bindArgs(
  plainDateTimeToZonedDateTime<string, string>,
  queryNativeTimeZone,
)

export const toPlainDate = createPlainDateSlots as (
  plainDateTimeSlots: PlainDateTimeSlots<string>,
) => PlainDateSlots<string>

export const toPlainTime = createPlainTimeSlots as (
  slots: PlainDateTimeSlots<string>,
) => PlainTimeSlots

export function toPlainYearMonth(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
): PlainYearMonthSlots<string> {
  return plainDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    plainDateTimeSlots,
    computeDateFields(plainDateTimeSlots),
  )
}

export function toPlainMonthDay(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
): PlainMonthDaySlots<string> {
  return plainDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    plainDateTimeSlots,
    computeDateFields(plainDateTimeSlots),
  )
}

export const toString = formatPlainDateTimeIso<string>

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  [transformDateTimeOptions, isoDateFieldsToEpochNano],
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  slots: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainDateTimeSlots<string>,
  slots1: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainDateTimeSlots<string>,
  slots1: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
