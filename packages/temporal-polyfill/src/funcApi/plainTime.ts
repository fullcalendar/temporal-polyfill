import {
  isoTimeFieldsToCal,
  plainTimeWithFields,
  refinePlainTimeBag,
} from '../internal/bagRefine'
import { compareIsoTimeFields, plainTimesEqual } from '../internal/compare'
import { constructPlainTimeSlots } from '../internal/construct'
import {
  plainTimeToPlainDateTime,
  plainTimeToZonedDateTime,
} from '../internal/convert'
import { diffPlainTimes } from '../internal/diff'
import { TimeBag, TimeFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { movePlainTime } from '../internal/move'
import { OverflowOptions } from '../internal/optionsRefine'
import { roundPlainTime } from '../internal/round'
import { PlainDateSlots, PlainTimeSlots } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import { prepCachedPlainTimeFormat } from './intlFormatCache'
import { refineTimeZoneIdString } from './utils'

// TODO: rename to keep scope? Slots/Fields/Bag?
export type { PlainTimeSlots, TimeBag }

export const create = constructPlainTimeSlots

export const fromString = parsePlainTime

export const fromFields = refinePlainTimeBag

export const getFields = memoize(isoTimeFieldsToCal, WeakMap) as (
  slots: PlainTimeSlots,
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
) => NumberSign

export const toPlainDateTime = plainTimeToPlainDateTime<string>

export const toZonedDateTime = bindArgs(
  plainTimeToZonedDateTime<string, string, string, PlainDateSlots<string>>,
  refineTimeZoneIdString,
  identity,
  queryNativeTimeZone,
)

export const toString = formatPlainTimeIso

export function toLocaleString(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainTimeFormat(
    locales,
    options,
    slots,
  )
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainTimeFormat(
    locales,
    options,
    slots,
  )
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainTimeSlots,
  slots1: PlainTimeSlots,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainTimeFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
