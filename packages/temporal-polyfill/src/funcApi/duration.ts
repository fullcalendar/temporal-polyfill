import { durationWithFields, refineDurationBag } from '../internal/bagRefine'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { compareDurations } from '../internal/compare'
import { constructDurationSlots } from '../internal/construct'
import {
  absDuration,
  addDurations,
  getDurationBlank,
  negateDuration,
  roundDuration,
} from '../internal/durationMath'
import { DurationBag } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatDurationIso } from '../internal/isoFormat'
import { parseDuration } from '../internal/isoParse'
import {
  DurationRoundOptions,
  RelativeToOptions,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
} from '../internal/optionsRefine'
import { DurationSlots } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { totalDuration } from '../internal/total'
import { UnitName } from '../internal/units'
import { NumberSign, bindArgs, identity } from '../internal/utils'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = Readonly<DurationSlots>
export type Bag = DurationBag
export type RelativeToArg =
  | ZonedDateTimeFns.Record
  | PlainDateTimeFns.Record
  | PlainDateFns.Record

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructDurationSlots as (
  years?: number,
  months?: number,
  weeks?: number,
  days?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number,
  microseconds?: number,
  nanoseconds?: number,
) => Record

export const fromFields = refineDurationBag as (bag: Bag) => Record

export const fromString = parseDuration as (s: string) => Record

// Getters
// -----------------------------------------------------------------------------

export const blank = getDurationBlank as (record: Record) => boolean

// Setters
// -----------------------------------------------------------------------------

export const withFields = durationWithFields as (
  record: Record,
  bag: Bag,
) => Record

// Math
// -----------------------------------------------------------------------------

export const negated = negateDuration as (record: Record) => Record

export const abs = absDuration as (record: Record) => Record

export const add = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: RelativeToOptions<RelativeToArg>,
) => Record

export const subtract = bindArgs(
  addDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: RelativeToOptions<RelativeToArg>,
) => Record

export const round = bindArgs(
  roundDuration<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (record: Record, options?: DurationRoundOptions<RelativeToArg>) => Record

export const total = bindArgs(
  totalDuration<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (
  record: Record,
  options?: TotalUnitOptionsWithRel<RelativeToArg> | UnitName,
) => number

export const compare = bindArgs(
  compareDurations<RelativeToArg, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (
  record0: Record,
  record1: Record,
  options?: RelativeToOptions<RelativeToArg>,
) => NumberSign

// Formatting
// -----------------------------------------------------------------------------

export const toString = formatDurationIso as (
  record: Record,
  options?: TimeDisplayOptions,
) => string

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(record)
    : formatDurationIso(record)
}
