import { durationFieldGetters } from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
} from '../../apiHelpers/slotClass'
import { compareDurations } from '../../internal/compare'
import { constructDurationSlots } from '../../internal/construct'
import { refineDurationObjectLike } from '../../internal/createFromFields'
import { DurationFields } from '../../internal/durationFields'
import {
  absDuration,
  addDurations,
  negateDuration,
  roundDuration,
} from '../../internal/durationMath'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatDurationIso } from '../../internal/isoFormat'
import { parseDuration } from '../../internal/isoParse'
import { mergeDurationFields } from '../../internal/merge'
import {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
  TimeDisplayOptions,
} from '../../internal/optionsModel'
import { RelativeToSlots } from '../../internal/relativeMath'
import { totalDuration } from '../../internal/total'
import { UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { RelativeToRecord } from '../commonTypes'
import {
  DurationRecordBranding,
  PlainDateRecordBranding,
  PlainDateTimeRecordBranding,
  ZonedDateTimeRecordBranding,
} from '../recordBranding'
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
  {
    ...durationFieldGetters,
    sign(slots: DurationFields & { sign: NumberSign }) {
      return slots.sign
    },
    blank(slots: DurationFields & { sign: NumberSign }) {
      return !slots.sign
    },
  },
  {},
  {},
)

export function create(
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
): DurationShimRecord {
  return new DurationShimRecord(
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  )
}

export function fromFields(
  fields: Partial<DurationFields>,
): DurationShimRecord {
  return createDurationShimRecord(refineDurationObjectLike(fields))
}

export function fromString(s: string): DurationShimRecord {
  return createDurationShimRecord(parseDuration(s))
}

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

export function abs(duration: DurationShimRecord): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  return createDurationShimRecord(absDuration(slots))
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
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const resSlots = roundDuration(refineRelativeTo, slots, options)
  return createDurationShimRecord(resSlots)
}

export function total(
  duration: DurationShimRecord,
  options: UnitName | DurationTotalOptions<RelativeToShimRecord>,
): number {
  return totalDuration(
    refineRelativeTo,
    getDurationShimRecordSlots(duration),
    options,
  )
}

export function compare(
  duration: DurationShimRecord,
  otherDuration: DurationShimRecord,
  options?: RelativeToOptions<RelativeToShimRecord>,
): NumberSign {
  const slots = getDurationShimRecordSlots(duration)
  const otherSlots = getDurationShimRecordSlots(otherDuration)
  return compareDurations(refineRelativeTo, slots, otherSlots, options)
}

export function toLocaleString(
  duration: DurationShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(duration)
    : toString(duration)
}

export function toString(
  duration: DurationShimRecord,
  options?: TimeDisplayOptions,
): string {
  return formatDurationIso(getDurationShimRecordSlots(duration), options)
}

// Util
// ----

type RelativeToShimRecord = RelativeToRecord<
  ZonedDateTimeShimRecord,
  PlainDateTimeShimRecord,
  PlainDateShimRecord
>

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
