import { durationFieldGetters } from '../../classApi/mixins'
import { createSlotClass, getBrandingAndSlots } from '../../classApi/slotClass'
import { constructDurationSlots } from '../../internal/construct'
import { DurationFields } from '../../internal/durationFields'
import {
  addDurations,
  negateDuration,
  roundDuration,
} from '../../internal/durationMath'
import { formatDurationIso } from '../../internal/isoFormat'
import { mergeDurationFields } from '../../internal/merge'
import {
  DurationRoundingOptions,
  RelativeToOptions,
} from '../../internal/optionsModel'
import { RelativeToSlots } from '../../internal/relativeMath'
import { NumberSign } from '../../internal/utils'
import {
  DurationRecordBranding,
  PlainDateRecordBranding,
  PlainDateTimeRecordBranding,
  ZonedDateTimeRecordBranding,
} from '../common-branding'
import { PlainDateShimRecord } from './plainDate'
import { PlainDateTimeShimRecord } from './plainDateTime'
import { ZonedDateTimeShimRecord } from './zonedDateTime'

export type DurationShimRecord = any & DurationFields

export const [
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
] = createSlotClass(
  DurationRecordBranding,
  constructDurationSlots,
  formatDurationIso,
  durationFieldGetters,
  {},
  {},
)

export function sign(duration: DurationShimRecord): NumberSign {
  const slots = getDurationShimRecordSlots(duration)
  return slots.sign
}

export function blank(duration: DurationShimRecord): boolean {
  const slots = getDurationShimRecordSlots(duration)
  return !slots.sign
}

export function withFields(
  duration: DurationShimRecord,
  mod: Partial<DurationFields>,
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const resSlots = mergeDurationFields(slots, mod)
  return createDurationShimRecord(resSlots)
}

export function negated(duration: DurationShimRecord): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const resSlots = negateDuration(slots)
  return createDurationShimRecord(resSlots)
}

export function add(
  duration: DurationShimRecord,
  otherDuration: DurationShimRecord,
  options?: RelativeToOptions<RelativeToShimRecord>,
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const otherSlots = getDurationShimRecordSlots(otherDuration)
  const resSlots = addDurations(
    refineRelativeTo,
    false, // doSubtract
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function subtract(
  duration: DurationShimRecord,
  otherDuration: DurationShimRecord,
  options?: RelativeToOptions<RelativeToShimRecord>,
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const otherSlots = getDurationShimRecordSlots(otherDuration)
  const resSlots = addDurations(
    refineRelativeTo,
    true, // doSubtract
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function round(
  duration: DurationShimRecord,
  options: DurationRoundingOptions<RelativeToShimRecord>,
) {
  const slots = getDurationShimRecordSlots(duration)
  const resSlots = roundDuration(refineRelativeTo, slots, options)
  return createDurationShimRecord(resSlots)
}

// Util
// ----

type RelativeToShimRecord =
  | ZonedDateTimeShimRecord
  | PlainDateTimeShimRecord
  | PlainDateShimRecord

function refineRelativeTo(
  arg?: RelativeToShimRecord,
): RelativeToSlots | undefined {
  if (arg) {
    const brandingAndSlots = getBrandingAndSlots(arg)
    if (brandingAndSlots) {
      const [branding, slots] = brandingAndSlots
      if (
        branding === ZonedDateTimeRecordBranding ||
        branding === PlainDateTimeRecordBranding ||
        branding === PlainDateRecordBranding
      ) {
        return slots as RelativeToSlots
      }
    }
    // otherwise, throw error?
  }
}
