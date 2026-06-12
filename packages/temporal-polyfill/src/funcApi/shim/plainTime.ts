import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { PlainTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { createTimeGetters } from '../../apiHelpers/mixins'
import { bigNanoInUtcDay } from '../../internal/bigNano'
import { toStrictInteger } from '../../internal/cast'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import { TimeFields } from '../../internal/fieldTypes'
import { applyPlainFormatTimeZone } from '../../internal/intlFormatArgs'
import { transformTimeOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso, formatTimeIsoAuto } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { movePlainTime } from '../../internal/move'
import { roundPlainTimeToUnit } from '../../internal/round'
import { createTimeSlots } from '../../internal/slots'
import {
  nanoToTimeAndDay,
  timeFieldsToMilli,
  timeFieldsToNano,
} from '../../internal/timeFieldMath'
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { getPlainTimeSlots, setPlainTimeSlots } from '../temporalRecords'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  ShimDurationRecord,
  createShimDurationRecord,
  getShimDurationSlots,
} from './duration'
import { reversedMove } from './moveUtils'
import { nanoToRoundedTimeUnit, refineRoundToOptions } from './roundUtils'
import { rejectInvalidBag } from './temporalRecords'

type Format = DateTimeFormatLike<ShimPlainTimeRecord>
type ShimPlainTimeSlots = ReturnType<typeof constructTimeSlots>

export const getShimPlainTimeSlots: (record: unknown) => ShimPlainTimeSlots =
  getPlainTimeSlots

export type ShimPlainTimeRecord = InstanceType<typeof ShimPlainTimeRecord> &
  RecordTypes.PlainTimeRecord
export const ShimPlainTimeRecord = defineTemporalClass(
  PlainTimeBranding,
  class {
    declare readonly [RecordTypes.PlainTimeRecordBrand]: undefined

    toJSON() {
      return formatTimeIsoAuto(getShimPlainTimeSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  createTimeGetters(getShimPlainTimeSlots),
)

export function createShimPlainTimeRecord(
  slots: ShimPlainTimeSlots,
): ShimPlainTimeRecord {
  const instance = Object.create(ShimPlainTimeRecord.prototype)
  setPlainTimeSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord(
    constructTimeSlots(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
    ),
  )
}

export function fromFields(
  fields: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord(refinePlainTimeObjectLike(fields, options))
}

export function fromString(s: string): ShimPlainTimeRecord {
  return createShimPlainTimeRecord(parsePlainTime(s))
}

export function withFields(
  record: ShimPlainTimeRecord,
  mod: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
): ShimPlainTimeRecord {
  const slots = getShimPlainTimeSlots(record)
  const resSlots = mergePlainTimeFields(slots, rejectInvalidBag(mod), options)
  return createShimPlainTimeRecord(resSlots)
}

export function add(
  record: ShimPlainTimeRecord,
  durationRecord: ShimDurationRecord,
): ShimPlainTimeRecord {
  const slots = getShimPlainTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = movePlainTime(false, slots, durationSlots)
  return createShimPlainTimeRecord(resSlots)
}

export function subtract(
  record: ShimPlainTimeRecord,
  durationRecord: ShimDurationRecord,
): ShimPlainTimeRecord {
  const slots = getShimPlainTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = movePlainTime(true, slots, durationSlots)
  return createShimPlainTimeRecord(resSlots)
}

function moveByTimeUnit(
  nanoInUnit: number,
  record: ShimPlainTimeRecord,
  units: number,
): ShimPlainTimeRecord {
  const slots = getShimPlainTimeSlots(record)
  const movedNano =
    BigInt(timeFieldsToNano(slots)) +
    BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)

  // Like nanoToTimeAndDay's floor-mod day split, but kept in bigint space until
  // after wrapping. These two paths should probably converge someday.
  // PlainTime has no date component, so overflowing past midnight wraps within
  // the ISO day and deliberately discards the day delta.
  const wrappedNano =
    ((movedNano % bigNanoInUtcDay) + bigNanoInUtcDay) % bigNanoInUtcDay

  return createShimPlainTimeRecord(
    createTimeSlots(nanoToTimeAndDay(Number(wrappedNano))[0]),
  )
}

export const addHours = bindArgs(moveByTimeUnit, nanoInHour)
export const addMinutes = bindArgs(moveByTimeUnit, nanoInMinute)
export const addSeconds = bindArgs(moveByTimeUnit, nanoInSec)
export const addMilliseconds = bindArgs(moveByTimeUnit, nanoInMilli)
export const addMicroseconds = bindArgs(moveByTimeUnit, nanoInMicro)
export const addNanoseconds = bindArgs(moveByTimeUnit, 1)

export const subtractHours = reversedMove(addHours)
export const subtractMinutes = reversedMove(addMinutes)
export const subtractSeconds = reversedMove(addSeconds)
export const subtractMilliseconds = reversedMove(addMilliseconds)
export const subtractMicroseconds = reversedMove(addMicroseconds)
export const subtractNanoseconds = reversedMove(addNanoseconds)

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimPlainTimeRecord,
  otherRecord: ShimPlainTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): ShimDurationRecord {
  const slots = getShimPlainTimeSlots(record)
  const otherSlots = getShimPlainTimeSlots(otherRecord)
  return createShimDurationRecord(
    diffPlainTimes(false, slots, otherSlots, options),
  )
}

// PlainTime diffs are within one ISO day, matching Temporal.PlainTime.until.
// Unlike PlainTime add/subtract, diffing does not wrap across midnight.
function diffTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number,
  record: ShimPlainTimeRecord,
  otherRecord: ShimPlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const nano0 = timeFieldsToNano(getShimPlainTimeSlots(record))
  const nano1 = timeFieldsToNano(getShimPlainTimeSlots(otherRecord))

  return nanoToRoundedTimeUnit(unit, nanoInUnit, nano1 - nano0, options)
}

export const diffHours = bindArgs(diffTimeUnit, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(diffTimeUnit, Unit.Minute, nanoInMinute)
export const diffSeconds = bindArgs(diffTimeUnit, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffTimeUnit,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffTimeUnit,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffTimeUnit, Unit.Nanosecond, 1)

function roundToUnit(
  smallestUnit: TimeUnit,
  record: ShimPlainTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainTimeRecord {
  // We already hold smallestUnit as a separate arg, so refine the options
  // directly instead of synthesizing a raw options bag for re-parsing.
  const [roundingInc, roundingMode] = refineRoundToOptions(
    smallestUnit,
    options,
  )
  return createShimPlainTimeRecord(
    roundPlainTimeToUnit(
      getShimPlainTimeSlots(record),
      smallestUnit,
      roundingInc,
      roundingMode,
    ),
  )
}

export const roundToHour = bindArgs(roundToUnit, Unit.Hour)
export const roundToMinute = bindArgs(roundToUnit, Unit.Minute)
export const roundToSecond = bindArgs(roundToUnit, Unit.Second)
export const roundToMillisecond = bindArgs(roundToUnit, Unit.Millisecond)
export const roundToMicrosecond = bindArgs(roundToUnit, Unit.Microsecond)

export function startOfHour(record: ShimPlainTimeRecord): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMinute(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfSecond(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMillisecond(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMicrosecond(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    nanosecond: 0,
  })
}

export function endOfHour(record: ShimPlainTimeRecord): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    minute: 59,
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMinute(record: ShimPlainTimeRecord): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfSecond(record: ShimPlainTimeRecord): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMillisecond(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMicrosecond(
  record: ShimPlainTimeRecord,
): ShimPlainTimeRecord {
  return createShimPlainTimeRecord({
    ...getShimPlainTimeSlots(record),
    nanosecond: 999,
  })
}

export function equals(
  record: ShimPlainTimeRecord,
  otherRecord: ShimPlainTimeRecord,
): boolean {
  const slots = getShimPlainTimeSlots(record)
  const otherSlots = getShimPlainTimeSlots(otherRecord)
  return plainTimesEqual(slots, otherSlots)
}

export function compare(
  record: ShimPlainTimeRecord,
  otherRecord: ShimPlainTimeRecord,
): NumberSign {
  const slots = getShimPlainTimeSlots(record)
  const otherSlots = getShimPlainTimeSlots(otherRecord)
  return compareTimeFields(slots, otherSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimPlainTimeRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimPlainTimeSlots(record)
      return [internals.baseFormat, timeFieldsToMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimPlainTimeSlots(record0)
      const slots1 = getShimPlainTimeSlots(record1)
      return [
        internals.baseFormat,
        timeFieldsToMilli(slots0),
        timeFieldsToMilli(slots1),
      ]
    },
  }),
  (options) =>
    applyPlainFormatTimeZone(
      transformTimeOptions(options, /* allowPartialOverlap = */ true),
    ),
)

export function toLocaleString(
  record: ShimPlainTimeRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimPlainTimeSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(
      transformTimeOptions(options, /* allowPartialOverlap = */ false),
    ),
  )
  return format.format(timeFieldsToMilli(slots))
}

export function toString(
  record: ShimPlainTimeRecord,
  options?: Temporal.PlainTimeToStringOptions,
): string {
  return formatPlainTimeIso(getShimPlainTimeSlots(record), options)
}

export function toBasicString(record: ShimPlainTimeRecord): string {
  return formatTimeIsoAuto(getShimPlainTimeSlots(record))
}
