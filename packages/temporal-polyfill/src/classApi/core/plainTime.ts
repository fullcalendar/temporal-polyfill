import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { zonedDateTimeToPlainTime } from '../../internal/convert'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import * as errorMessages from '../../internal/errorMessages'
import { TimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { movePlainTime } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import type {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
} from '../../internal/optionsInput'
import { roundPlainTime } from '../../internal/round'
import { createTimeSlots } from '../../internal/slots'
import { TimeUnitName } from '../../internal/units'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { prepPlainTimeFormat } from '../intlFormatConfig'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { getPlainDateTimeSlotsIfPresent } from './plainDateTime'
import { rejectInvalidBag } from './temporalSlots'
import { getZonedDateTimeSlotsIfPresent } from './zonedDateTime'

export type PlainTimeArg = PlainTime | Partial<TimeFields> | string

const plainTimeSlotsMap = new WeakMap<object, TimeFields>()

export class PlainTime implements TimeFields {
  constructor(
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
  ) {
    initPlainTime(
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

  static from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
    return createPlainTime(toPlainTimeSlots(arg, options))
  }

  static compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumberSign {
    return compareTimeFields(toPlainTimeSlots(arg0), toPlainTimeSlots(arg1))
  }

  get hour(): number {
    return getPlainTimeSlots(this).hour
  }

  get minute(): number {
    return getPlainTimeSlots(this).minute
  }

  get second(): number {
    return getPlainTimeSlots(this).second
  }

  get millisecond(): number {
    return getPlainTimeSlots(this).millisecond
  }

  get microsecond(): number {
    return getPlainTimeSlots(this).microsecond
  }

  get nanosecond(): number {
    return getPlainTimeSlots(this).nanosecond
  }

  with(mod: Partial<TimeFields>, options?: OverflowOptions): PlainTime {
    return createPlainTime(
      mergePlainTimeFields(this, rejectInvalidBag(mod), options),
    )
  }

  add(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      movePlainTime(
        false,
        getPlainTimeSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  subtract(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      movePlainTime(
        true,
        getPlainTimeSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  until(otherArg: PlainTimeArg, options?: DiffOptions<TimeUnitName>): Duration {
    return createDuration(
      diffPlainTimes(
        false,
        getPlainTimeSlots(this),
        toPlainTimeSlots(otherArg),
        options,
      ),
    )
  }

  since(otherArg: PlainTimeArg, options?: DiffOptions<TimeUnitName>): Duration {
    return createDuration(
      diffPlainTimes(
        true,
        getPlainTimeSlots(this),
        toPlainTimeSlots(otherArg),
        options,
      ),
    )
  }

  round(options: TimeUnitName | RoundingOptions<TimeUnitName>): PlainTime {
    return createPlainTime(roundPlainTime(getPlainTimeSlots(this), options))
  }

  equals(other: PlainTimeArg): boolean {
    return plainTimesEqual(getPlainTimeSlots(this), toPlainTimeSlots(other))
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const [format, epochMilli] = prepPlainTimeFormat(
      locales,
      options,
      getPlainTimeSlots(this),
    )
    return format.format(epochMilli)
  }

  toString(options: TimeDisplayOptions | undefined = undefined): string {
    return formatPlainTimeIso(getPlainTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainTimeIso(getPlainTimeSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(PlainTime, 'PlainTime')
export function createPlainTime(slots: TimeFields): PlainTime {
  return initPlainTime(Object.create(PlainTime.prototype), slots)
}

export function getPlainTimeSlots(obj: unknown): TimeFields {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = plainTimeSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
}

export function getPlainTimeSlotsIfPresent(
  obj: unknown,
): TimeFields | undefined {
  return plainTimeSlotsMap.get(obj as object)
}

export function toPlainTimeSlots(
  arg: PlainTimeArg,
  options?: OverflowOptions,
): TimeFields {
  if (isObjectLike(arg)) {
    const ownSlots = getPlainTimeSlotsIfPresent(arg)

    if (ownSlots) {
      refineOverflowOptions(options) // parse unused options
      return ownSlots
    }

    const dateTimeSlots = getPlainDateTimeSlotsIfPresent(arg)

    if (dateTimeSlots) {
      refineOverflowOptions(options) // parse unused options
      return createTimeSlots(dateTimeSlots)
    }

    const zonedDateTimeSlots = getZonedDateTimeSlotsIfPresent(arg)

    if (zonedDateTimeSlots) {
      refineOverflowOptions(options) // parse unused options
      return zonedDateTimeToPlainTime(zonedDateTimeSlots)
    }

    return refinePlainTimeObjectLike(arg as Partial<TimeFields>, options)
  }

  const timeSlots = parsePlainTime(arg)

  // parse unused options, but AFTER time-string parsing
  refineOverflowOptions(options)

  return timeSlots
}

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): TimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}

function initPlainTime(instance: PlainTime, slots: TimeFields): PlainTime {
  plainTimeSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatPlainTimeIso)
  return instance
}
