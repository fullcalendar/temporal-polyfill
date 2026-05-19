import { timeGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import { TimeFields } from '../../internal/fieldTypes'
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
import { PlainTimeRecordBranding } from '../common-branding'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'

export type PlainTimeShimRecord = any & TimeFields

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

export function until(
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

export function since(
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
  options?: DiffOptions<TimeUnitName>,
): DurationShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const otherSlots = getPlainTimeShimRecordSlots(otherRecord)
  return createDurationShimRecord(
    diffPlainTimes(true, slots, otherSlots, options),
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

export function toString(
  record: PlainTimeShimRecord,
  options?: TimeDisplayOptions,
): string {
  return formatPlainTimeIso(getPlainTimeShimRecordSlots(record), options)
}
