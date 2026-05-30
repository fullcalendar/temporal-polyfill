import type { Temporal } from 'temporal-spec'
import {
  bigNanoInUtcDay,
  divideBigNanoToExactNumber,
} from '../../internal/bigNano'
import { toStrictInteger } from '../../internal/cast'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import { TimeFields } from '../../internal/fieldTypes'
import { createFormatPrepper, timeConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso, formatTimeIsoAuto } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { movePlainTime } from '../../internal/move'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import { roundBigNanoToInc, roundPlainTime } from '../../internal/round'
import { createTimeSlots } from '../../internal/slots'
import type {
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/temporalSpecHelpers'
import {
  nanoToTimeAndDay,
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
import { createRoundToOptions } from '../roundTo'
import { getPlainTimeSlots, setPlainTimeSlots } from '../temporalRecords'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import { reversedMove } from './moveUtils'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import { rejectInvalidBag } from './temporalRecords'

type PlainTimeRecord = RecordTypes.PlainTimeRecord
type Format = DateTimeFormatLike<PlainTimeShimRecord>

type PlainTimeShimSlots = ReturnType<typeof constructTimeSlots>

export const getPlainTimeShimRecordSlots: (
  record: unknown,
) => PlainTimeShimSlots = getPlainTimeSlots

class _PlainTimeShimRecord implements TimeFields, PlainTimeRecord {
  declare readonly [RecordTypes.PlainTimeRecordBrand]: undefined

  constructor(
    hour?: number,
    minute?: number,
    second?: number,
    millisecond?: number,
    microsecond?: number,
    nanosecond?: number,
  ) {
    setPlainTimeShimRecordSlots(
      this,
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

  get hour() {
    return getPlainTimeShimRecordSlots(this).hour
  }

  get minute() {
    return getPlainTimeShimRecordSlots(this).minute
  }

  get second() {
    return getPlainTimeShimRecordSlots(this).second
  }

  get millisecond() {
    return getPlainTimeShimRecordSlots(this).millisecond
  }

  get microsecond() {
    return getPlainTimeShimRecordSlots(this).microsecond
  }

  get nanosecond() {
    return getPlainTimeShimRecordSlots(this).nanosecond
  }

  toJSON() {
    return formatTimeIsoAuto(getPlainTimeShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainTimeShimRecordSlots(
  instance: object,
  slots: PlainTimeShimSlots,
) {
  setPlainTimeSlots(instance, slots)
  attachDebugString(instance, slots, formatTimeIsoAuto)
}

export function createPlainTimeShimRecord(
  slots: PlainTimeShimSlots,
): PlainTimeShimRecord {
  const instance = Object.create(PlainTimeShimRecord.prototype)
  setPlainTimeShimRecordSlots(instance, slots)
  return instance
}

export type PlainTimeShimRecord = _PlainTimeShimRecord
export const PlainTimeShimRecord = defineTemporalClass(
  _PlainTimeShimRecord,
  'PlainTime',
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
  options?: Temporal.OverflowOptions,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord(refinePlainTimeObjectLike(fields, options))
}

export function fromString(s: string): PlainTimeShimRecord {
  return createPlainTimeShimRecord(parsePlainTime(s))
}

export function withFields(
  record: PlainTimeShimRecord,
  mod: Partial<TimeFields>,
  options?: Temporal.OverflowOptions,
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

function moveByTimeUnit(
  nanoInUnit: number,
  record: PlainTimeShimRecord,
  units: number,
): PlainTimeShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const movedNano =
    BigInt(timeFieldsToNano(slots)) +
    BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)

  // Like nanoToTimeAndDay's floor-mod day split, but kept in bigint space until
  // after wrapping. These two paths should probably converge someday.
  // PlainTime has no date component, so overflowing past midnight wraps within
  // the ISO day and deliberately discards the day delta.
  const wrappedNano =
    ((movedNano % bigNanoInUtcDay) + bigNanoInUtcDay) % bigNanoInUtcDay

  return createPlainTimeShimRecord(
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
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationShimRecord {
  const slots = getPlainTimeShimRecordSlots(record)
  const otherSlots = getPlainTimeShimRecordSlots(otherRecord)
  return createDurationShimRecord(
    diffPlainTimes(false, slots, otherSlots, options),
  )
}

// PlainTime diffs are within one ISO day, matching Temporal.PlainTime.until.
// Unlike PlainTime add/subtract, diffing does not wrap across midnight.
function diffTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number,
  record: PlainTimeShimRecord,
  otherRecord: PlainTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const nano0 = timeFieldsToNano(getPlainTimeShimRecordSlots(record))
  const nano1 = timeFieldsToNano(getPlainTimeShimRecordSlots(otherRecord))

  let nanoDiff = BigInt(nano1 - nano0)

  if (roundingInc) {
    nanoDiff = roundBigNanoToInc(
      nanoDiff,
      BigInt(nanoInUnit * roundingInc),
      roundingMode!,
    )
  }

  return roundingInc
    ? Number(nanoDiff / BigInt(nanoInUnit))
    : divideBigNanoToExactNumber(nanoDiff, nanoInUnit)
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

function round(
  record: PlainTimeShimRecord,
  options:
    | Temporal.PluralizeUnit<Temporal.TimeUnit>
    | Temporal.RoundingOptions<Temporal.TimeUnit>,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord(
    roundPlainTime(getPlainTimeShimRecordSlots(record), options),
  )
}

function roundToUnit(
  smallestUnit: Temporal.PluralizeUnit<Temporal.TimeUnit>,
  record: PlainTimeShimRecord,
  options?: RoundingMathOptions,
): PlainTimeShimRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToHour = bindArgs(roundToUnit, 'hour')
export const roundToMinute = bindArgs(roundToUnit, 'minute')
export const roundToSecond = bindArgs(roundToUnit, 'second')
export const roundToMillisecond = bindArgs(roundToUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToUnit, 'microsecond')

export function startOfHour(record: PlainTimeShimRecord): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMinute(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfSecond(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMillisecond(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    microsecond: 0,
    nanosecond: 0,
  })
}

export function startOfMicrosecond(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    nanosecond: 0,
  })
}

export function endOfHour(record: PlainTimeShimRecord): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    minute: 59,
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMinute(record: PlainTimeShimRecord): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfSecond(record: PlainTimeShimRecord): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMillisecond(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMicrosecond(
  record: PlainTimeShimRecord,
): PlainTimeShimRecord {
  return createPlainTimeShimRecord({
    ...getPlainTimeShimRecordSlots(record),
    nanosecond: 999,
  })
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

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory(
  timeConfig,
  getPlainTimeShimRecordSlots,
)

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
  options?: Temporal.PlainTimeToStringOptions,
): string {
  return formatPlainTimeIso(getPlainTimeShimRecordSlots(record), options)
}

export function toSimpleString(record: PlainTimeShimRecord): string {
  return formatTimeIsoAuto(getPlainTimeShimRecordSlots(record))
}
