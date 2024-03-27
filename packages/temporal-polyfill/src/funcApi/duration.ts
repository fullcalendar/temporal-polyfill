import { durationWithFields, refineDurationBag } from '../internal/bagRefine'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { compareDurations } from '../internal/compare'
import { constructDurationSlots } from '../internal/construct'
import { DurationFields } from '../internal/durationFields'
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
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
  TimeDisplayOptions,
} from '../internal/optionsRefine'
import { DurationBranding } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { totalDuration } from '../internal/total'
import { UnitName } from '../internal/units'
import { NumberSign, bindArgs, identity } from '../internal/utils'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = Readonly<DurationFields> & {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof DurationBranding

  readonly sign: NumberSign
}

export type FromFields = DurationBag
export type WithFields = DurationBag
export type RelativeToRecord =
  | ZonedDateTimeFns.Record
  | PlainDateTimeFns.Record
  | PlainDateFns.Record

export type ArithmeticOptions = RelativeToOptions<RelativeToRecord>
export type RoundOptions = DurationRoundingOptions<RelativeToRecord>
export type TotalOptions = DurationTotalOptions<RelativeToRecord>
export type CompareOptions = RelativeToOptions<RelativeToRecord>
export type ToStringOptions = TimeDisplayOptions

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

export const fromFields = refineDurationBag as (fields: FromFields) => Record

export const fromString = parseDuration as (s: string) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === DurationBranding
}

// Getters
// -----------------------------------------------------------------------------

export const blank = getDurationBlank as (record: Record) => boolean

// Setters
// -----------------------------------------------------------------------------

export const withFields = durationWithFields as (
  record: Record,
  fields: WithFields,
) => Record

// Math
// -----------------------------------------------------------------------------

export const negated = negateDuration as (record: Record) => Record

export const abs = absDuration as (record: Record) => Record

export const add = bindArgs(
  addDurations<RelativeToRecord, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
) as (record0: Record, record1: Record, options?: ArithmeticOptions) => Record

export const subtract = bindArgs(
  addDurations<RelativeToRecord, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
) as (record0: Record, record1: Record, options?: ArithmeticOptions) => Record

export const round = bindArgs(
  roundDuration<RelativeToRecord, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (record: Record, options?: RoundOptions) => Record

export const total = bindArgs(
  totalDuration<RelativeToRecord, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (record: Record, options?: UnitName | TotalOptions) => number

export const compare = bindArgs(
  compareDurations<RelativeToRecord, string, string>,
  identity,
  createNativeDiffOps,
  queryNativeTimeZone,
) as (record0: Record, record1: Record, options?: CompareOptions) => NumberSign

// Formatting
// -----------------------------------------------------------------------------

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(record)
    : formatDurationIso(record)
}

export const toString = formatDurationIso as (
  record: Record,
  options?: ToStringOptions,
) => string
