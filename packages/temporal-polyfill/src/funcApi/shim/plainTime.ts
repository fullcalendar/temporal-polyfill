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
import {
  getPlainTimeRecordIfPresent,
  setPlainTimeRecord,
} from '../temporalRecords'
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
  invalidRecordType,
} from './recordUtils'
import { rejectInvalidBag } from './temporalRecords'

type Format = DateTimeFormatLike<PlainTimeShimRecord>

type PlainTimeShimSlots = ReturnType<typeof constructTimeSlots>

class _PlainTimeShimRecord implements TimeFields {
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
  setPlainTimeRecord(instance, slots)
  attachDebugString(instance, slots, formatTimeIsoAuto)
}

export function createPlainTimeShimRecord(
  slots: PlainTimeShimSlots,
): PlainTimeShimRecord {
  const instance = Object.create(PlainTimeShimRecord.prototype)
  setPlainTimeShimRecordSlots(instance, slots)
  return instance
}

export function getPlainTimeShimRecordSlots(
  record: unknown,
): PlainTimeShimSlots {
  return getPlainTimeRecordIfPresent(record) || invalidRecordType()
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

export function toSimpleString(record: PlainTimeShimRecord): string {
  return formatTimeIsoAuto(getPlainTimeShimRecordSlots(record))
}
