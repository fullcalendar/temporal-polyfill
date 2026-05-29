import {
  bigNanoInHour,
  bigNanoInMicro,
  bigNanoInMilli,
  bigNanoInMinute,
  bigNanoInSec,
  divideBigNanoToExactNumber,
} from '../../internal/bigNano'
import { toStrictInteger } from '../../internal/cast'
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
import {
  formatInstantIso,
  formatInstantIsoAuto,
} from '../../internal/isoFormat'
import { parseInstant } from '../../internal/isoParse'
import { moveInstant } from '../../internal/move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
} from '../../internal/optionsModel'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import { roundBigNanoToInc, roundInstant } from '../../internal/round'
import {
  createEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import {
  TimeUnit,
  TimeUnitName,
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
import { RoundToOptions, createRoundToOptions } from '../roundTo'
import { getInstantSlots, setInstantSlots } from '../temporalRecords'
import { createDateTimeFormat } from './dateTimeFormat'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

type InstantRecord = RecordTypes.InstantRecord

type Format = DateTimeFormatLike<InstantShimRecord>

type InstantShimSlots = ReturnType<typeof constructEpochNanoSlots>

export const getInstantShimRecordSlots: (record: unknown) => InstantShimSlots =
  getInstantSlots

class _InstantShimRecord implements InstantRecord {
  declare readonly [RecordTypes.InstantRecordBrand]: undefined

  constructor(epochNanoseconds: bigint) {
    setInstantShimRecordSlots(this, constructEpochNanoSlots(epochNanoseconds))
  }

  get epochMilliseconds() {
    return getEpochMilli(getInstantShimRecordSlots(this))
  }

  get epochNanoseconds() {
    return getEpochNano(getInstantShimRecordSlots(this))
  }

  toJSON() {
    return formatInstantIsoAuto(getInstantShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setInstantShimRecordSlots(instance: object, slots: InstantShimSlots) {
  setInstantSlots(instance, slots)
  attachDebugString(instance, slots, formatInstantIsoAuto)
}

export function createInstantShimRecord(
  slots: InstantShimSlots,
): InstantShimRecord {
  const instance = Object.create(InstantShimRecord.prototype)
  setInstantShimRecordSlots(instance, slots)
  return instance
}

export type InstantShimRecord = _InstantShimRecord
export const InstantShimRecord = defineTemporalClass(
  _InstantShimRecord,
  'Instant',
)

export function create(epochNanoseconds: bigint): InstantShimRecord {
  return new InstantShimRecord(epochNanoseconds)
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

function moveByNanoseconds(
  record: InstantShimRecord,
  nanoseconds: bigint,
): InstantShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const resSlots = createEpochNanoSlots(
    checkEpochNanoInBounds(slots.epochNanoseconds + nanoseconds),
  )
  return createInstantShimRecord(resSlots)
}

export function addHours(
  record: InstantShimRecord,
  hours: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(hours)) * bigNanoInHour,
  )
}

export function addMinutes(
  record: InstantShimRecord,
  minutes: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(minutes)) * bigNanoInMinute,
  )
}

export function addSeconds(
  record: InstantShimRecord,
  seconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(seconds)) * bigNanoInSec,
  )
}

export function addMilliseconds(
  record: InstantShimRecord,
  milliseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(milliseconds)) * bigNanoInMilli,
  )
}

export function addMicroseconds(
  record: InstantShimRecord,
  microseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(microseconds)) * bigNanoInMicro,
  )
}

export function addNanoseconds(
  record: InstantShimRecord,
  nanoseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(record, BigInt(toStrictInteger(nanoseconds)))
}

export function subtractHours(
  record: InstantShimRecord,
  hours: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(hours)) * bigNanoInHour,
  )
}

export function subtractMinutes(
  record: InstantShimRecord,
  minutes: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(minutes)) * bigNanoInMinute,
  )
}

export function subtractSeconds(
  record: InstantShimRecord,
  seconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(seconds)) * bigNanoInSec,
  )
}

export function subtractMilliseconds(
  record: InstantShimRecord,
  milliseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(milliseconds)) * bigNanoInMilli,
  )
}

export function subtractMicroseconds(
  record: InstantShimRecord,
  microseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(microseconds)) * bigNanoInMicro,
  )
}

export function subtractNanoseconds(
  record: InstantShimRecord,
  nanoseconds: number,
): InstantShimRecord {
  return moveByNanoseconds(record, -BigInt(toStrictInteger(nanoseconds)))
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

// Instants have no calendar or time-zone balancing, so unit diffs are exact
// epoch-nanosecond math until the caller opts into rounding.
// TODO: DRY with ZonedDateTime's
function diffTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number,
  record: InstantShimRecord,
  otherRecord: InstantShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const slots = getInstantShimRecordSlots(record)
  const otherSlots = getInstantShimRecordSlots(otherRecord)

  let nanoDiff = otherSlots.epochNanoseconds - slots.epochNanoseconds

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
  record: InstantShimRecord,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): InstantShimRecord {
  const slots = getInstantShimRecordSlots(record)
  const resSlots = roundInstant(slots, options)
  return createInstantShimRecord(resSlots)
}

function roundToUnit(
  smallestUnit: TimeUnitName,
  record: InstantShimRecord,
  options?: RoundToOptions,
): InstantShimRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToHour = bindArgs(roundToUnit, 'hour')
export const roundToMinute = bindArgs(roundToUnit, 'minute')
export const roundToSecond = bindArgs(roundToUnit, 'second')
export const roundToMillisecond = bindArgs(roundToUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToUnit, 'microsecond')

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

export function toSimpleString(record: InstantShimRecord): string {
  return formatInstantIsoAuto(getInstantShimRecordSlots(record))
}
