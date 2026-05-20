import { compareInstants, instantsEqual } from '../../internal/compare'
import { constructEpochNanoSlots } from '../../internal/construct'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../../internal/convert'
import { diffInstants } from '../../internal/diff'
import {
  createFormatPrepper,
  instantConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatInstantIso } from '../../internal/isoFormat'
import { parseInstant } from '../../internal/isoParse'
import { moveInstant } from '../../internal/move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { roundInstant } from '../../internal/round'
import { EpochNanoFields } from '../../internal/slots'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import { TimeUnitName, UnitName } from '../../internal/units'
import { NumberSign, bindArgs, identity } from '../../internal/utils'
import { DateTimeFormatLike, createDateTimeFormat } from '../dateTimeFormat'
import * as DurationFns from './duration'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = EpochNanoFields

export type DifferenceOptions = DiffOptions<TimeUnitName>
export type RoundOptions = RoundingOptions<TimeUnitName>
export type ToStringOptions = InstantDisplayOptions
export type Format = DateTimeFormatLike<Record>

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructEpochNanoSlots as (
  epochNanoseconds: bigint,
) => Record

export const fromEpochMilliseconds = epochMilliToInstant as (
  epochMilliseconds: number,
) => Record

export const fromEpochNanoseconds = epochNanoToInstant as (
  epochNanoseconds: bigint,
) => Record

export const fromString = parseInstant as (s: string) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(moveInstant, false) as (
  instantRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const subtract = bindArgs(moveInstant, true) as (
  instantRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const until = bindArgs(diffInstants, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffInstants, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = roundInstant as (
  record: Record,
  options?: UnitName | RoundOptions,
) => Record

export const equals = instantsEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareInstants as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toZonedDateTimeISO(
  record: Record,
  timeZoneId: string,
): ZonedDateTimeFns.Record {
  return instantToZonedDateTime(
    record,
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(instantConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(instantConfig, identity, locales, options)
}

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export const toString = bindArgs(formatInstantIso, refineTimeZoneId) as (
  record: Record,
  options?: ToStringOptions,
) => string
