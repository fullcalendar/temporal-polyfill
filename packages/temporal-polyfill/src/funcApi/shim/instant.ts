import { epochGetters } from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
} from '../../apiHelpers/slotClass'
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
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { TimeUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { InstantRecordBranding } from '../recordBranding'
import { createDateTimeFormat } from './dateTimeFormat'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

export type InstantShimRecord = any
type Format = DateTimeFormatLike<InstantShimRecord>

export const [
  InstantShimRecord,
  createInstantShimRecord,
  getInstantShimRecordSlots,
] = createSlotClass(
  InstantRecordBranding,
  constructEpochNanoSlots,
  (slots, options) => formatInstantIso(refineTimeZoneId, slots, options),
  epochGetters,
  {},
  {},
)

export function create(epochNanoseconds: bigint): InstantShimRecord {
  return new InstantShimRecord(epochNanoseconds)
}

export function isRecord(arg: unknown): arg is InstantShimRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === InstantRecordBranding
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): InstantShimRecord {
  const resSlots = epochMilliToInstant(epochMilliseconds)
  return createInstantShimRecord(resSlots)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): InstantShimRecord {
  const resSlots = epochNanoToInstant(epochNanoseconds)
  return createInstantShimRecord(resSlots)
}

export function fromString(s: string): InstantShimRecord {
  const resSlots = parseInstant(s)
  return createInstantShimRecord(resSlots)
}

export function add(
  record: InstantShimRecord,
  durationRecord: DurationShimRecord,
): InstantShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveInstant(false, slots, durationSlots)
  return createInstantShimRecord(resSlots)
}

export function subtract(
  record: InstantShimRecord,
  durationRecord: DurationShimRecord,
): InstantShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveInstant(true, slots, durationSlots)
  return createInstantShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: InstantShimRecord,
  otherRecord: InstantShimRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const otherSlots = getInstantShimRecordSlots(otherRecord)
  const resSlots = diffInstants(false, slots, otherSlots, options)
  return createDurationShimRecord(resSlots)
}

export function round(
  record: InstantShimRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): InstantShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const resSlots = roundInstant(slots, options)
  return createInstantShimRecord(resSlots)
}

export function equals(
  record: InstantShimRecord,
  otherRecord: InstantShimRecord,
): boolean {
  const slots = getInstantShimRecordSlots(record)
  const otherSlots = getInstantShimRecordSlots(otherRecord)
  return instantsEqual(slots, otherSlots)
}

export function compare(
  record: InstantShimRecord,
  otherRecord: InstantShimRecord,
): NumberSign {
  const slots = getInstantShimRecordSlots(record)
  const otherSlots = getInstantShimRecordSlots(otherRecord)
  return compareInstants(slots, otherSlots)
}

export function toZonedDateTimeISO(
  record: InstantShimRecord,
  timeZoneId: string,
): ZonedDateTimeShimRecord {
  const resSlots = instantToZonedDateTime(
    getInstantShimRecordSlots(record),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createZonedDateTimeShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(instantConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    instantConfig,
    getInstantShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: InstantShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getInstantShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

export function toString(
  record: InstantShimRecord,
  options?: InstantDisplayOptions,
): string {
  return formatInstantIso(
    refineTimeZoneId,
    getInstantShimRecordSlots(record),
    options,
  )
}
