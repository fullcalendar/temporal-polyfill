import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import { TimeFields } from '../../internal/fieldTypes'
import { createFormatPrepper, timeConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { movePlainTime } from '../../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../../internal/optionsModel'
import { roundPlainTime } from '../../internal/round'
import { TimeUnitName } from '../../internal/units'
import { NumberSign, bindArgs, identity } from '../../internal/utils'
import { DateTimeFormatLike, createDateTimeFormat } from '../dateTimeFormat'
import * as DurationFns from './duration'

export type Record = TimeFields

export type FromFields = Partial<TimeFields>
export type WithFields = Partial<TimeFields>
export type AssignmentOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<TimeUnitName>
export type RoundOptions = RoundingOptions<TimeUnitName>
export type ToStringOptions = TimeDisplayOptions
export type Format = DateTimeFormatLike<Record>

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructTimeSlots as (
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
) => Record

export const fromFields = refinePlainTimeObjectLike as (
  fields: FromFields,
  options?: AssignmentOptions,
) => Record

export const fromString = parsePlainTime as (s: string) => Record

// Setters
// -----------------------------------------------------------------------------

export const withFields = mergePlainTimeFields as (
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainTime, false) as (
  plainTimeRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const subtract = bindArgs(movePlainTime, true) as (
  plainTimeRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const until = bindArgs(diffPlainTimes, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffPlainTimes, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = roundPlainTime as (
  record: Record,
  options: TimeUnitName | RoundOptions,
) => Record

export const equals = plainTimesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareTimeFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(timeConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(timeConfig, identity, locales, options)
}

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export const toString = formatPlainTimeIso as (
  record: Record,
  options?: ToStringOptions,
) => string
