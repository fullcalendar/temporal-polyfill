import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { InstantBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import {
  bigNanoInHour,
  bigNanoInMicro,
  bigNanoInMilli,
  bigNanoInMinute,
  bigNanoInSec,
} from '../../internal/bigNano'
import { toBigInt, toStrictInteger } from '../../internal/cast'
import { compareInstants, instantsEqual } from '../../internal/compare'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../../internal/convert'
import { diffInstants } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import { transformInstantOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import {
  formatInstantIso,
  formatInstantIsoAuto,
} from '../../internal/isoFormat'
import { parseInstant } from '../../internal/isoParse'
import { moveEpochNano } from '../../internal/move'
import {
  computeBigNanoInc,
  roundBigNanoToDayOriginInc,
} from '../../internal/round'
import {
  EpochNanoFields,
  createEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import type { InstantStringTimeZoneDisplayOptions } from '../../internal/temporalSpecHelpers'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
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
import { getInstantSlots, setInstantSlots } from '../temporalRecords'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  adaptRecordTimeUnitDiff,
  diffInstantEpochNanoTimeUnit,
} from './diffUtils'
import {
  ShimDurationRecord,
  createShimDurationRecord,
  getShimDurationSlots,
} from './duration'
import { refineRoundToOptions } from './roundUtils'
import {
  ShimZonedDateTimeRecord,
  createShimZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<ShimInstantRecord>
type ShimInstantSlots = EpochNanoFields

export const getShimInstantSlots: (record: unknown) => ShimInstantSlots =
  getInstantSlots

export type ShimInstantRecord = InstanceType<typeof ShimInstantRecord> &
  RecordTypes.InstantRecord
export const ShimInstantRecord = defineTemporalClass(
  InstantBranding,
  class {
    declare readonly [RecordTypes.InstantRecordBrand]: undefined

    get epochMilliseconds() {
      return getEpochMilli(getShimInstantSlots(this))
    }

    get epochNanoseconds() {
      return getEpochNano(getShimInstantSlots(this))
    }

    toJSON() {
      return formatInstantIsoAuto(getShimInstantSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
)

export function createShimInstantRecord(
  slots: ShimInstantSlots,
): ShimInstantRecord {
  const instance = Object.create(ShimInstantRecord.prototype)
  setInstantSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(epochNanoseconds: bigint): ShimInstantRecord {
  const epochNano = checkEpochNanoInBounds(toBigInt(epochNanoseconds))
  return createShimInstantRecord(createEpochNanoSlots(epochNano))
}

export function fromEpochMilliseconds(
  epochMilliseconds: number,
): ShimInstantRecord {
  const resSlots = epochMilliToInstant(epochMilliseconds)
  return createShimInstantRecord(resSlots)
}

export function fromEpochNanoseconds(
  epochNanoseconds: bigint,
): ShimInstantRecord {
  const resSlots = epochNanoToInstant(epochNanoseconds)
  return createShimInstantRecord(resSlots)
}

export function fromString(s: string): ShimInstantRecord {
  const resSlots = parseInstant(s)
  return createShimInstantRecord(resSlots)
}

export function add(
  record: ShimInstantRecord,
  durationRecord: ShimDurationRecord,
): ShimInstantRecord {
  const slots = getShimInstantSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createEpochNanoSlots(
    moveEpochNano(slots.epochNanoseconds, durationSlots),
  )
  return createShimInstantRecord(resSlots)
}

export function subtract(
  record: ShimInstantRecord,
  durationRecord: ShimDurationRecord,
): ShimInstantRecord {
  const slots = getShimInstantSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createEpochNanoSlots(
    moveEpochNano(slots.epochNanoseconds, negateDurationFields(durationSlots)),
  )
  return createShimInstantRecord(resSlots)
}

function moveByNanoseconds(
  record: ShimInstantRecord,
  nanoseconds: bigint,
): ShimInstantRecord {
  const slots = getShimInstantSlots(record)
  const resSlots = createEpochNanoSlots(
    checkEpochNanoInBounds(slots.epochNanoseconds + nanoseconds),
  )
  return createShimInstantRecord(resSlots)
}

export function addHours(
  record: ShimInstantRecord,
  hours: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(hours)) * bigNanoInHour,
  )
}

export function addMinutes(
  record: ShimInstantRecord,
  minutes: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(minutes)) * bigNanoInMinute,
  )
}

export function addSeconds(
  record: ShimInstantRecord,
  seconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(seconds)) * bigNanoInSec,
  )
}

export function addMilliseconds(
  record: ShimInstantRecord,
  milliseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(milliseconds)) * bigNanoInMilli,
  )
}

export function addMicroseconds(
  record: ShimInstantRecord,
  microseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    BigInt(toStrictInteger(microseconds)) * bigNanoInMicro,
  )
}

export function addNanoseconds(
  record: ShimInstantRecord,
  nanoseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(record, BigInt(toStrictInteger(nanoseconds)))
}

export function subtractHours(
  record: ShimInstantRecord,
  hours: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(hours)) * bigNanoInHour,
  )
}

export function subtractMinutes(
  record: ShimInstantRecord,
  minutes: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(minutes)) * bigNanoInMinute,
  )
}

export function subtractSeconds(
  record: ShimInstantRecord,
  seconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(seconds)) * bigNanoInSec,
  )
}

export function subtractMilliseconds(
  record: ShimInstantRecord,
  milliseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(milliseconds)) * bigNanoInMilli,
  )
}

export function subtractMicroseconds(
  record: ShimInstantRecord,
  microseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(
    record,
    -BigInt(toStrictInteger(microseconds)) * bigNanoInMicro,
  )
}

export function subtractNanoseconds(
  record: ShimInstantRecord,
  nanoseconds: number,
): ShimInstantRecord {
  return moveByNanoseconds(record, -BigInt(toStrictInteger(nanoseconds)))
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimInstantRecord,
  otherRecord: ShimInstantRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): ShimDurationRecord {
  const slots = getShimInstantSlots(record)
  const otherSlots = getShimInstantSlots(otherRecord)
  const resSlots = diffInstants(false, slots, otherSlots, options)
  return createShimDurationRecord(resSlots)
}

const diffRecordTimeUnit = adaptRecordTimeUnitDiff<
  ShimInstantRecord,
  ShimInstantSlots
>(diffInstantEpochNanoTimeUnit, getShimInstantSlots)

export const diffHours = bindArgs(diffRecordTimeUnit, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(
  diffRecordTimeUnit,
  Unit.Minute,
  nanoInMinute,
)
export const diffSeconds = bindArgs(diffRecordTimeUnit, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffRecordTimeUnit,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffRecordTimeUnit,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffRecordTimeUnit, Unit.Nanosecond, 1)

function roundToUnit(
  smallestUnit: TimeUnit,
  record: ShimInstantRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimInstantRecord {
  const slots = getShimInstantSlots(record)
  // We already hold smallestUnit as a separate arg, so refine the options
  // directly instead of synthesizing a raw options bag for re-parsing.
  // solarMode: Instant validates increments against a full UTC day.
  const [roundingInc, roundingMode] = refineRoundToOptions(
    smallestUnit,
    options,
    true, // solarMode
  )
  return createShimInstantRecord(
    createEpochNanoSlots(
      roundBigNanoToDayOriginInc(
        slots.epochNanoseconds,
        computeBigNanoInc(smallestUnit, roundingInc),
        roundingMode,
      ),
    ),
  )
}

export const roundToHour = bindArgs(roundToUnit, Unit.Hour)
export const roundToMinute = bindArgs(roundToUnit, Unit.Minute)
export const roundToSecond = bindArgs(roundToUnit, Unit.Second)
export const roundToMillisecond = bindArgs(roundToUnit, Unit.Millisecond)
export const roundToMicrosecond = bindArgs(roundToUnit, Unit.Microsecond)

export function equals(
  record: ShimInstantRecord,
  otherRecord: ShimInstantRecord,
): boolean {
  const slots = getShimInstantSlots(record)
  const otherSlots = getShimInstantSlots(otherRecord)
  return instantsEqual(slots, otherSlots)
}

export function compare(
  record: ShimInstantRecord,
  otherRecord: ShimInstantRecord,
): NumberSign {
  const slots = getShimInstantSlots(record)
  const otherSlots = getShimInstantSlots(otherRecord)
  return compareInstants(slots, otherSlots)
}

export function toZonedDateTimeISO(
  record: ShimInstantRecord,
  timeZoneId: string,
): ShimZonedDateTimeRecord {
  const resSlots = instantToZonedDateTime(
    getShimInstantSlots(record),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createShimZonedDateTimeRecord(resSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimInstantRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimInstantSlots(record)
      return [internals.baseFormat, getEpochMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimInstantSlots(record0)
      const slots1 = getShimInstantSlots(record1)
      return [
        internals.baseFormat,
        getEpochMilli(slots0),
        getEpochMilli(slots1),
      ]
    },
  }),
  (options) =>
    transformInstantOptions(options, /* allowPartialOverlap = */ true),
)

export function toLocaleString(
  record: ShimInstantRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimInstantSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    transformInstantOptions(options),
  )
  return format.format(getEpochMilli(slots))
}

export function toString(
  record: ShimInstantRecord,
  options?: InstantStringTimeZoneDisplayOptions,
): string {
  return formatInstantIso(
    refineTimeZoneId,
    getShimInstantSlots(record),
    options,
  )
}

export function toBasicString(record: ShimInstantRecord): string {
  return formatInstantIsoAuto(getShimInstantSlots(record))
}
