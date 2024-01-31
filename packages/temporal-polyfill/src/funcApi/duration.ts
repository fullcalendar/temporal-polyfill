import { durationWithFields, refineDurationBag } from '../internal/bagRefine'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { compareDurations } from '../internal/compare'
import { constructDurationSlots } from '../internal/construct'
import {
  absDuration,
  addDurations,
  negateDuration,
  queryDurationBlank,
  queryDurationSign,
  roundDuration,
} from '../internal/durationMath'
import { formatDurationIso } from '../internal/isoFormat'
import { parseDuration } from '../internal/isoParse'
import {
  DurationSlots,
  PlainDateSlots,
  ZonedDateTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { totalDuration } from '../internal/total'
import { NumberSign, bindArgs, identity } from '../internal/utils'

export type RelativeToArg =
  | ZonedDateTimeSlots<string, string>
  | PlainDateSlots<string>

export const create = constructDurationSlots

export const fromString = parseDuration

export const fromFields = refineDurationBag

export const withFields = durationWithFields

export const add = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
)

export const subtract = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
)

export const negated = negateDuration

export const abs = absDuration

export const round = bindArgs(
  roundDuration<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
)

export const total = bindArgs(
  totalDuration<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
)

export const toString = formatDurationIso

export const sign = queryDurationSign as (slots: DurationSlots) => NumberSign

export const blank = queryDurationBlank as (slots: DurationSlots) => boolean

export const compare = bindArgs(
  compareDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
)
