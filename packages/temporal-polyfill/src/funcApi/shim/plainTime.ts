import { timeGetters } from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../../apiHelpers/slotClass'
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
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainTimeRecordBranding } from '../recordBranding'
import { createDateTimeFormat } from './dateTimeFormat'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'

export type PlainTimeShimRecord = any & TimeFields
type Format = DateTimeFormatLike<PlainTimeShimRecord>

export const [
  PlainTimeShimRecord,
  createPlainTimeShimRecord,
  getPlainTimeShimRecordSlots,
] = createSlotClass(
  PlainTimeRecordBranding,
  constructTimeSlots,
  formatPlainTimeIso,
  timeGetters,
  {},
  {},
)

export function create(
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
): PlainTimeShimRecord {
  return new PlainTimeShimRecord(
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  )
}

export function isRecord(arg: unknown): arg is PlainTimeShimRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === PlainTimeRecordBranding
}

export function fromFields(
  fields: Partial<TimeFields>,
  options?: OverflowOptions,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord(refinePlainTimeObjectLike(fields, options))
}

export function fromString(s: string): PlainTimeShimRecord {
  return createPlainTimeShimRecord(parsePlainTime(s))
}

export function withFields(
  record: PlainTimeShimRecord,
  mod: Partial<TimeFields>,
  options?: OverflowOptions,
): PlainTimeShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const resSlots = mergePlainTimeFields(slots, rejectInvalidBag(mod), options)
  return createPlainTimeShimRecord(resSlots)
}

export function add(
  record: PlainTimeShimRecord,
  durationRecord: DurationShimRecord,
): PlainTimeShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainTime(false, slots, durationSlots)
  return createPlainTimeShimRecord(resSlots)
}

export function subtract(
  record: PlainTimeShimRecord,
  durationRecord: DurationShimRecord,
): PlainTimeShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainTime(true, slots, durationSlots)
  return createPlainTimeShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const otherSlots = getPlainTimeShimRecordSlots(otherRecord)
  return createDurationShimRecord(
    diffPlainTimes(false, slots, otherSlots, options),
  )
}

export function round(
  record: PlainTimeShimRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord(
    roundPlainTime(getPlainTimeShimRecordSlots(record), options),
  )
}

export function equals(
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
): boolean {
  const slots = getPlainTimeShimRecordSlots(record)
  const otherSlots = getPlainTimeShimRecordSlots(otherRecord)
  return plainTimesEqual(slots, otherSlots)
}

export function compare(
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
): NumberSign {
  const slots = getPlainTimeShimRecordSlots(record)
  const otherSlots = getPlainTimeShimRecordSlots(otherRecord)
  return compareTimeFields(slots, otherSlots)
}

const prepFormat = createFormatPrepper(timeConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    timeConfig,
    getPlainTimeShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: PlainTimeShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainTimeShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

export function toString(
  record: PlainTimeShimRecord,
  options?: TimeDisplayOptions,
): string {
  return formatPlainTimeIso(getPlainTimeShimRecordSlots(record), options)
}
