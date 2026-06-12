import type { Temporal } from 'temporal-spec'
import { DurationBranding } from '../../apiHelpers/branding'
import { compareDurations } from '../../internal/compare'
import { constructDurationSlots } from '../../internal/construct'
import { refineDurationObjectLike } from '../../internal/createFromFields'
import { DurationFields } from '../../internal/durationFields'
import {
  absDuration,
  addDurationsWithoutRelativeTo,
  negateDuration,
  roundDuration,
} from '../../internal/durationMath'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  formatDurationIso,
  formatDurationIsoAuto,
} from '../../internal/isoFormat'
import { parseDuration } from '../../internal/isoParse'
import { mergeDurationFields } from '../../internal/merge'
import { RelativeToSlots } from '../../internal/relativeMath'
import type {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
} from '../../internal/temporalSpecHelpers'
import { totalDuration } from '../../internal/total'
import { NumberSign } from '../../internal/utils'
import { RelativeToRecord } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getDurationSlots,
  getPlainDateSlotsIfPresent,
  getPlainDateTimeSlotsIfPresent,
  getZonedDateTimeSlotsIfPresent,
  setDurationSlots,
} from '../temporalRecords'
import {
  ForbiddenValueOfMixin,
  attachDebugString,
  defineTemporalClass,
} from './recordUtils'

type ShimDurationSlots = ReturnType<typeof constructDurationSlots>

export const getShimDurationSlots: (record: unknown) => ShimDurationSlots =
  getDurationSlots

export type ShimDurationRecord = InstanceType<typeof ShimDurationRecord> &
  RecordTypes.DurationRecord
export const ShimDurationRecord = defineTemporalClass(
  DurationBranding,
  class implements DurationFields {
    declare readonly [RecordTypes.DurationRecordBrand]: undefined

    get years() {
      return getShimDurationSlots(this).years
    }

    get months() {
      return getShimDurationSlots(this).months
    }

    get weeks() {
      return getShimDurationSlots(this).weeks
    }

    get days() {
      return getShimDurationSlots(this).days
    }

    get hours() {
      return getShimDurationSlots(this).hours
    }

    get minutes() {
      return getShimDurationSlots(this).minutes
    }

    get seconds() {
      return getShimDurationSlots(this).seconds
    }

    get milliseconds() {
      return getShimDurationSlots(this).milliseconds
    }

    get microseconds() {
      return getShimDurationSlots(this).microseconds
    }

    get nanoseconds() {
      return getShimDurationSlots(this).nanoseconds
    }

    toJSON() {
      return formatDurationIsoAuto(getShimDurationSlots(this))
    }
  },
  ForbiddenValueOfMixin,
)

export function createShimDurationRecord(
  slots: ShimDurationSlots,
): ShimDurationRecord {
  const instance = Object.create(ShimDurationRecord.prototype)
  setDurationSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

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
): ShimDurationRecord {
  return createShimDurationRecord(
    constructDurationSlots(
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
    ),
  )
}

export function fromFields(
  fields: Partial<DurationFields>,
): ShimDurationRecord {
  return createShimDurationRecord(refineDurationObjectLike(fields))
}

export function fromString(s: string): ShimDurationRecord {
  return createShimDurationRecord(parseDuration(s))
}

export function sign(duration: ShimDurationRecord): NumberSign {
  const slots = getShimDurationSlots(duration)
  return slots.sign
}

export function blank(duration: ShimDurationRecord): boolean {
  const slots = getShimDurationSlots(duration)
  return !slots.sign
}

export function withFields(
  duration: ShimDurationRecord,
  mod: Partial<DurationFields>,
): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  const resSlots = mergeDurationFields(slots, mod)
  return createShimDurationRecord(resSlots)
}

export function negated(duration: ShimDurationRecord): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  const resSlots = negateDuration(slots)
  return createShimDurationRecord(resSlots)
}

export function abs(duration: ShimDurationRecord): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  return createShimDurationRecord(absDuration(slots))
}

export function add(
  duration: ShimDurationRecord,
  otherDuration: ShimDurationRecord,
): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  const otherSlots = getShimDurationSlots(otherDuration)
  const resSlots = addDurationsWithoutRelativeTo(false, slots, otherSlots)
  return createShimDurationRecord(resSlots)
}

export function subtract(
  duration: ShimDurationRecord,
  otherDuration: ShimDurationRecord,
): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  const otherSlots = getShimDurationSlots(otherDuration)
  const resSlots = addDurationsWithoutRelativeTo(true, slots, otherSlots)
  return createShimDurationRecord(resSlots)
}

export function round(
  duration: ShimDurationRecord,
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationRoundingOptions<ShimRelativeToRecord>,
): ShimDurationRecord {
  const slots = getShimDurationSlots(duration)
  const resSlots = roundDuration(refineRelativeTo, slots, options)
  return createShimDurationRecord(resSlots)
}

export function total(
  duration: ShimDurationRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<ShimRelativeToRecord>,
): number {
  return totalDuration(
    refineRelativeTo,
    getShimDurationSlots(duration),
    options,
  )
}

export function compare(
  duration: ShimDurationRecord,
  otherDuration: ShimDurationRecord,
  options?: RelativeToOptions<ShimRelativeToRecord>,
): NumberSign {
  const slots = getShimDurationSlots(duration)
  const otherSlots = getShimDurationSlots(otherDuration)
  return compareDurations(refineRelativeTo, slots, otherSlots, options)
}

export function toLocaleString(
  duration: ShimDurationRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const slots = getShimDurationSlots(duration)

  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(slots)
    : formatDurationIso(slots, options)
}

export function toString(
  duration: ShimDurationRecord,
  options?: Temporal.DurationToStringOptions,
): string {
  return formatDurationIso(getShimDurationSlots(duration), options)
}

export function toBasicString(duration: ShimDurationRecord): string {
  return formatDurationIsoAuto(getShimDurationSlots(duration))
}

// Util
// ----

type ShimRelativeToRecord = RelativeToRecord<
  RecordTypes.ZonedDateTimeRecord,
  RecordTypes.PlainDateTimeRecord,
  RecordTypes.PlainDateRecord
>

function refineRelativeTo(
  arg?: ShimRelativeToRecord,
): RelativeToSlots | undefined {
  if (arg) {
    const slots =
      getZonedDateTimeSlotsIfPresent(arg) ||
      getPlainDateTimeSlotsIfPresent(arg) ||
      getPlainDateSlotsIfPresent(arg)

    if (slots) {
      return slots as RelativeToSlots
    }
    // otherwise, throw error?
  }
}
