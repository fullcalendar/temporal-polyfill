import { NumSign, bindArgs, identityFunc } from '../internal/utils'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DurationSlots, PlainDateSlots, ZonedDateTimeSlots } from '../internal/slots'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { constructDurationSlots } from '../internal/construct'
import { parseDuration } from '../internal/isoParse'
import { durationWithFields, refineDurationBag } from '../internal/bagRefine'
import { absDuration, addDurations, negateDuration, queryDurationBlank, queryDurationSign, roundDuration } from '../internal/durationMath'
import { totalDuration } from '../internal/total'
import { formatDurationIso } from '../internal/isoFormat'
import { compareDurations } from '../internal/compare'

export type RelativeToArg = ZonedDateTimeSlots<string, string> | PlainDateSlots<string>

export const create = constructDurationSlots

export const fromString = parseDuration

export const fromFields = refineDurationBag

export const withFields = durationWithFields

export const add = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identityFunc,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
)

export const subtract = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identityFunc,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
)

export const negated = negateDuration

export const abs = absDuration

export const round = bindArgs(
  roundDuration<RelativeToArg, string, string>,
  identityFunc,
  createNativeDiffOps,
  queryNativeTimeZone,
)

export const total = bindArgs(
  totalDuration<RelativeToArg, string, string>,
  identityFunc,
  createNativeDiffOps,
  queryNativeTimeZone,
)

export const toString = formatDurationIso

// TODO: toLocaleString

export const sign = queryDurationSign as (slots: DurationSlots) => NumSign

export const blank = queryDurationBlank as (slots: DurationSlots) => boolean

export const compare = bindArgs(
  compareDurations<RelativeToArg, string, string>,
  identityFunc,
  createNativeDiffOps,
  queryNativeTimeZone,
)
