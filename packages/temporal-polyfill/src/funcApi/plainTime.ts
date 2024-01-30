import { TimeBag, TimeFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormat'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { OverflowOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainTimeSlots, refineTimeZoneIdString } from '../internal/slots'
import { NumSign, bindArgs, identityFunc } from '../internal/utils'
import { constructPlainTimeSlots } from '../internal/construct'
import { isoTimeFieldsToCal, plainTimeWithFields, refinePlainTimeBag } from '../internal/bagRefine'
import { parsePlainTime } from '../internal/isoParse'
import { movePlainTime } from '../internal/move'
import { diffPlainTimes } from '../internal/diff'
import { roundPlainTime } from '../internal/round'
import { plainTimesEqual, compareIsoTimeFields } from '../internal/compare'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { plainTimeToPlainDateTime, plainTimeToZonedDateTime } from '../internal/convert'
import { prepCachedPlainTimeFormat } from './intlFormatCached'

export const create = constructPlainTimeSlots

export const fromFields = refinePlainTimeBag

export const fromString = parsePlainTime

export const getFields = isoTimeFieldsToCal as (
  slots: PlainTimeSlots
) => TimeFields

export function withFields(
  slots: PlainTimeSlots,
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return plainTimeWithFields(getFields(slots), mod, options)
}

export const add = bindArgs(movePlainTime, false)
export const subtract = bindArgs(movePlainTime, true)

export const until = bindArgs(diffPlainTimes, false)
export const since = bindArgs(diffPlainTimes, true)

export const round = roundPlainTime
export const equals = plainTimesEqual
export const compare = compareIsoTimeFields as (
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
) => NumSign

export const toString = formatPlainTimeIso

export const toZonedDateTime = bindArgs(
  plainTimeToZonedDateTime<string, string, string, PlainDateSlots<string>>,
  refineTimeZoneIdString,
  identityFunc,
  queryNativeTimeZone,
)

export const toPlainDateTime = plainTimeToPlainDateTime<string>

export function toLocaleString(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainTimeFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainTimeFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
