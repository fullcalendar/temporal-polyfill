import { NumSign, identityFunc } from '../internal/utils'
import { UnitName } from '../internal/units'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DurationRoundOptions, RelativeToOptions, TotalUnitOptionsWithRel } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, ZonedDateTimeSlots } from '../internal/slots'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { createDurationSlots } from '../internal/slotsCreate'
import { parseDuration } from '../internal/parseIso'
import { durationWithFields, refineDurationBag } from '../internal/bag'
import { absDuration, addToDuration, negateDuration, queryDurationBlank, queryDurationSign, roundDuration } from '../internal/durationMath'
import { totalDuration } from '../internal/total'
import { formatDurationIso } from '../internal/formatIso'
import { compareDurations } from '../internal/compare'

type RelativeToArg = ZonedDateTimeSlots<string, string> | PlainDateSlots<string>

export const create = createDurationSlots

export const fromString = parseDuration

export const fromFields = refineDurationBag

export const withFields = durationWithFields

export function add(
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RelativeToArg>,
): DurationSlots {
  return addToDuration(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    false,
    slots,
    otherSlots,
    options,
  )
}

export function subtract(
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RelativeToArg>,
): DurationSlots {
  return addToDuration(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    true,
    slots,
    otherSlots,
    options,
  )
}

export const negated = negateDuration

export const abs = absDuration

export function round(
  slots: DurationSlots,
  options: DurationRoundOptions<RelativeToArg>,
): DurationSlots {
  return roundDuration(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    slots,
    options,
  )
}

export function total(
  slots: DurationSlots,
  options: TotalUnitOptionsWithRel<RelativeToArg> | UnitName,
): number {
  return totalDuration(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    slots,
    options,
  )
}

export const toString = formatDurationIso

export function toJSON(slots: DurationSlots): string {
  return toString(slots)
}

export const sign = queryDurationSign // TODO: prevent other args

export const blank = queryDurationBlank // TODO: prevent other args

export function compare(
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RelativeToArg>,
): NumSign {
  return compareDurations(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    durationSlots0,
    durationSlots1,
    options,
  )
}
