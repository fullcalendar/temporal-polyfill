import type { Temporal } from 'temporal-spec'
import { PlainTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import { timeGetters } from '../../apiHelpers/mixins'
import { toIntegerWithTrunc } from '../../internal/cast'
import { compareTimeFields, plainTimesEqual } from '../../internal/compare'
import { zonedDateTimeToPlainTime } from '../../internal/convert'
import { refinePlainTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainTimes } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import { TimeFields } from '../../internal/fieldTypes'
import { applyPlainFormatTimeZone } from '../../internal/intlFormatArgs'
import { transformTimeOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../../internal/isoFormat'
import { parsePlainTime } from '../../internal/isoParse'
import { mergePlainTimeFields } from '../../internal/merge'
import { moveTime } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { RoundingModeEnum } from '../../internal/optionsModel'
import { refineRoundingOptions } from '../../internal/optionsRoundingRefine'
import { computeNanoInc, roundTimeToNano } from '../../internal/round'
import { createTimeSlots } from '../../internal/slots'
import {
  timeFieldsToMilli,
  validateTimeFields,
} from '../../internal/timeFieldMath'
import { TimeUnit, Unit } from '../../internal/units'
import { NumberSign, isObjectLike, mapProps } from '../../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { getPlainDateTimeSlotsIfPresent } from './plainDateTime'
import { validateBag } from './temporalSlots'
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
      const fields = validateTimeFields(
        mapProps(toIntegerWithTrunc, {
          hour,
          minute,
          second,
          millisecond,
          microsecond,
          nanosecond,
        }),
      )
      initPlainTime(this, createTimeSlots(fields))
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
          getPlainTimeSlots(this),
          validateBag(mod),
          options,
        ),
      )
    }

    add(durationArg: DurationArg): PlainTime {
      const slots = getPlainTimeSlots(this)
      return createPlainTime(
        // result is guaranteed exact TimeFields shape
        moveTime(slots, toDurationSlots(durationArg))[0],
      )
    }

    subtract(durationArg: DurationArg): PlainTime {
      const slots = getPlainTimeSlots(this)
      return createPlainTime(
        // result is guaranteed exact TimeFields shape
        moveTime(slots, negateDurationFields(toDurationSlots(durationArg)))[0],
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
      const slots = getPlainTimeSlots(this)
      const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
        options,
        Unit.Hour,
      ) as [TimeUnit, number, RoundingModeEnum]
      return createPlainTime(
        roundTimeToNano(
          slots,
          computeNanoInc(smallestUnit, roundingInc),
          roundingMode,
        )[0],
      )
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
        applyPlainFormatTimeZone(transformTimeOptions(options)),
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
  getPlainTimeSlots,
  timeGetters,
)

export function createPlainTime(slots: TimeFields): PlainTime {
  return initPlainTime(Object.create(PlainTime.prototype), slots)
}

export function getPlainTimeSlots(obj: unknown): TimeFields {
  return getPlainTimeSlotsIfPresent(obj) || invalidRecordType()
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
