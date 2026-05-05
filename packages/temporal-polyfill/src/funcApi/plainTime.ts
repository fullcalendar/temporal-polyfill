import { compareTimeFields, plainTimesEqual } from '../internal/compare'
import { constructPlainTimeSlots } from '../internal/construct'
import { plainTimeToZonedDateTime } from '../internal/convert'
import { refinePlainTimeObjectLike } from '../internal/createFromFields'
import { diffPlainTimes } from '../internal/diff'
import { TimeFields } from '../internal/fieldTypes'
import { createFormatPrepper, timeConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { mergePlainTimeFields } from '../internal/merge'
import { movePlainTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../internal/optionsModel'
import { roundPlainTime } from '../internal/round'
import {
  PlainDateSlots,
  PlainTimeBranding,
  PlainTimeSlots,
} from '../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../internal/slotsFromRefinedFields'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { TimeUnitName } from '../internal/units'
import { NumberSign, bindArgs, identity } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = PlainTimeSlots

export type Fields = TimeFields
export type FromFields = Partial<TimeFields>
export type WithFields = Partial<TimeFields>
export type AssignmentOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<TimeUnitName>
export type RoundOptions = RoundingOptions<TimeUnitName>
export type ToStringOptions = TimeDisplayOptions
export type ToZonedDateTimeOptions = {
  timeZone: string
  plainDate: PlainDateFns.Record
}

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructPlainTimeSlots as (
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

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = ((record: Record) => record) as (
  record: Record,
) => Fields

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return mergePlainTimeFields(getFields(record), fields, options)
}

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

// Conversion
// -----------------------------------------------------------------------------

export const toZonedDateTime = bindArgs(
  plainTimeToZonedDateTime<PlainDateSlots>,
  refineTimeZoneId,
  identity,
) as (
  plainTimeRecord: Record,
  options: ToZonedDateTimeOptions,
) => ZonedDateTimeFns.Record

export function toPlainDateTime(
  plainTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
): PlainDateTimeFns.Record {
  return createPlainDateTimeFromRefinedFields(
    plainDateRecord,
    plainTimeRecord,
    plainDateRecord.calendarId,
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  timeConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRangeToParts(epochMilli0, epochMilli1!)
}

export const toString = formatPlainTimeIso as (
  record: Record,
  options?: ToStringOptions,
) => string
