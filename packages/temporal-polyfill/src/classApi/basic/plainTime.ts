import type { Temporal } from 'temporal-spec'
import { PlainTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { createTimeGetters } from '../../apiHelpers/mixins'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { constructTimeSlots } from '../../internal/construct'
import { zonedDateTimeToPlainTime } from '../../internal/convert'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import * as errorMessages from '../../internal/errorMessages'
import { TimeFields } from '../../internal/fieldTypes'
import { applyPlainFormatTimeZone } from '../../internal/intlFormatArgs'
import { transformTimeOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { movePlainTime } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { roundPlainTime } from '../../internal/round'
import { createTimeSlots } from '../../internal/slots'
import { timeFieldsToMilli } from '../../internal/timeFieldMath'
import { NumberSign, isObjectLike, throwTypeError } from '../../internal/utils'
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

export type PlainTime = InstanceType<typeof PlainTime>
export const PlainTime = defineTemporalClass(
  PlainTimeBranding,
  class {
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

    static from(
      arg: PlainTimeArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainTime {
      return createPlainTime(toPlainTimeSlots(arg, options))
    }

    static compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumberSign {
      return compareTimeFields(toPlainTimeSlots(arg0), toPlainTimeSlots(arg1))
    }

    with(
      mod: Partial<TimeFields>,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainTime {
      return createPlainTime(
        mergePlainTimeFields(
          this as unknown as PlainTime,
          rejectInvalidBag(mod),
          options,
        ),
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

    until(
      otherArg: PlainTimeArg,
      options:
        | Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
        | undefined = undefined,
    ): Duration {
      return createDuration(
        diffPlainTimes(
          false,
          getPlainTimeSlots(this),
          toPlainTimeSlots(otherArg),
          options,
        ),
      )
    }

    since(
      otherArg: PlainTimeArg,
      options:
        | Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
        | undefined = undefined,
    ): Duration {
      return createDuration(
        diffPlainTimes(
          true,
          getPlainTimeSlots(this),
          toPlainTimeSlots(otherArg),
          options,
        ),
      )
    }

    round(
      options:
        | Temporal.PluralizeUnit<Temporal.TimeUnit>
        | Temporal.RoundingOptions<Temporal.TimeUnit>,
    ): PlainTime {
      return createPlainTime(roundPlainTime(getPlainTimeSlots(this), options))
    }

    equals(other: PlainTimeArg): boolean {
      return plainTimesEqual(getPlainTimeSlots(this), toPlainTimeSlots(other))
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getPlainTimeSlots(this)
      const format = new RawDateTimeFormat(
        locales,
        applyPlainFormatTimeZone(
          transformTimeOptions(options, /* allowPartialOverlap = */ false),
        ),
      )
      return format.format(timeFieldsToMilli(slots))
    }

    toString(
      options: Temporal.PlainTimeToStringOptions | undefined = undefined,
    ): string {
      return formatPlainTimeIso(getPlainTimeSlots(this), options)
    }

    toJSON(): string {
      return formatPlainTimeIso(getPlainTimeSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  createTimeGetters(getPlainTimeSlots),
)

export function createPlainTime(slots: TimeFields): PlainTime {
  return initPlainTime(Object.create(PlainTime.prototype), slots)
}

export function getPlainTimeSlots(obj: unknown): TimeFields {
  const slots = plainTimeSlotsMap.get(obj as object)
  if (!slots) {
    throwTypeError(errorMessages.invalidCallingContext)
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
  options?: Temporal.OverflowOptions,
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

function initPlainTime(instance: object, slots: TimeFields): PlainTime {
  plainTimeSlotsMap.set(instance, slots)
  attachDebugString(instance as PlainTime)
  return instance as PlainTime
}
