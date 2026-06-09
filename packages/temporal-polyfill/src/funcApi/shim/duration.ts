import type { Temporal } from 'temporal-spec'
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
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'

type DurationRecord = RecordTypes.DurationRecord

type DurationShimSlots = ReturnType<typeof constructDurationSlots>

export const getDurationShimRecordSlots: (
  record: unknown,
) => DurationShimSlots = getDurationSlots

class _DurationShimRecord implements DurationFields, DurationRecord {
  declare readonly [RecordTypes.DurationRecordBrand]: undefined

  get years() {
    return getDurationShimRecordSlots(this).years
  }

  get months() {
    return getDurationShimRecordSlots(this).months
  }

  get weeks() {
    return getDurationShimRecordSlots(this).weeks
  }

  get days() {
    return getDurationShimRecordSlots(this).days
  }

  get hours() {
    return getDurationShimRecordSlots(this).hours
  }

  get minutes() {
    return getDurationShimRecordSlots(this).minutes
  }

  get seconds() {
    return getDurationShimRecordSlots(this).seconds
  }

  get milliseconds() {
    return getDurationShimRecordSlots(this).milliseconds
  }

  get microseconds() {
    return getDurationShimRecordSlots(this).microseconds
  }

  get nanoseconds() {
    return getDurationShimRecordSlots(this).nanoseconds
  }

  toJSON() {
    return formatDurationIsoAuto(getDurationShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

export function createDurationShimRecord(
  slots: DurationShimSlots,
): DurationShimRecord {
  const instance = Object.create(DurationShimRecord.prototype)
  setDurationSlots(instance, slots)
  attachDebugString(instance, slots, formatDurationIsoAuto)
  return instance
}

export type DurationShimRecord = _DurationShimRecord
export const DurationShimRecord = defineTemporalClass(
  _DurationShimRecord,
  'Duration',
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
  return createDurationShimRecord(
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
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const otherSlots = getDurationShimRecordSlots(otherDuration)
  const resSlots = addDurationsWithoutRelativeTo(false, slots, otherSlots)
  return createDurationShimRecord(resSlots)
}

export function subtract(
  duration: DurationShimRecord,
  otherDuration: DurationShimRecord,
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const otherSlots = getDurationShimRecordSlots(otherDuration)
  const resSlots = addDurationsWithoutRelativeTo(true, slots, otherSlots)
  return createDurationShimRecord(resSlots)
}

export function round(
  duration: DurationShimRecord,
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationRoundingOptions<RelativeToShimRecord>,
): DurationShimRecord {
  const slots = getDurationShimRecordSlots(duration)
  const resSlots = roundDuration(refineRelativeTo, slots, options)
  return createDurationShimRecord(resSlots)
}

export function total(
  duration: DurationShimRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
    | DurationTotalOptions<RelativeToShimRecord>,
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
  const slots = getDurationShimRecordSlots(duration)

  return (Intl as any).DurationFormat
    ? new (Intl as any).DurationFormat(locales, options).format(slots)
    : formatDurationIso(slots, options)
}

export function toString(
  duration: DurationShimRecord,
  options?: Temporal.DurationToStringOptions,
): string {
  return formatDurationIso(getDurationShimRecordSlots(duration), options)
}

export function toBasicString(duration: DurationShimRecord): string {
  return formatDurationIsoAuto(getDurationShimRecordSlots(duration))
}

// Util
// ----

type RelativeToShimRecord = RelativeToRecord<
  RecordTypes.ZonedDateTimeRecord,
  RecordTypes.PlainDateTimeRecord,
  RecordTypes.PlainDateRecord
>

function refineRelativeTo(
  arg?: RelativeToShimRecord,
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
