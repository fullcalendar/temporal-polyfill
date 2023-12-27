import { NumSign, identityFunc } from '../internal/utils'
import { UnitName } from '../internal/units'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DurationRoundOptions, RelativeToOptions, TotalUnitOptionsWithRel } from '../genericApi/optionsRefine'
import { DurationSlots, PlainDateSlots, ZonedDateTimeSlots } from '../internal/slots'
import * as DurationFuncs from '../genericApi/duration'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'

type RelativeToArg = ZonedDateTimeSlots<string, string> | PlainDateSlots<string>

export const create = DurationFuncs.create

export const fromString = DurationFuncs.fromString

export const fromFields = DurationFuncs.fromFields

export const withFields = DurationFuncs.withFields

export function add(
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RelativeToArg>,
): DurationSlots {
  return DurationFuncs.add(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
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
  return DurationFuncs.subtract(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    slots,
    otherSlots,
    options,
  )
}

export const negated = DurationFuncs.negated

export const abs = DurationFuncs.abs

export function round(
  slots: DurationSlots,
  options: DurationRoundOptions<RelativeToArg>,
): DurationSlots {
  return DurationFuncs.round(
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
  return DurationFuncs.total(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    slots,
    options,
  )
}

export const toString = DurationFuncs.toString

export const toJSON = DurationFuncs.toJSON

export const blank = DurationFuncs.blank

export function compare(
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RelativeToArg>,
): NumSign {
  return DurationFuncs.compare(
    identityFunc,
    createNativeDiffOps,
    queryNativeTimeZone,
    durationSlots0,
    durationSlots1,
    options,
  )
}
