import type { Temporal } from 'temporal-spec'
import { DurationBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import { durationGetters } from '../../apiHelpers/mixins'
import { toStrictInteger } from '../../internal/cast'
import { compareDurations } from '../../internal/compare'
import {
  refineDurationObjectLike,
  refineMaybeZonedDateTimeObjectLike,
} from '../../internal/createFromFields'
import { DurationFields } from '../../internal/durationFields'
import {
  absDuration,
  addDurations,
  negateDuration,
  roundDuration,
  validateDurationFields,
} from '../../internal/durationMath'
import { ZonedDateTimeLikeObject } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatDurationIso } from '../../internal/isoFormat'
import { parseDuration, parseRelativeToSlots } from '../../internal/isoParse'
import { mergeDurationFields } from '../../internal/merge'
import { RelativeToSlots } from '../../internal/relativeMath'
import { createDateSlots, createDurationSlots } from '../../internal/slots'
import { totalDuration } from '../../internal/total'
import { NumberSign, isObjectLike, mapProps } from '../../internal/utils'
import { getCalendarFromBag } from './calendarArg'
import { resolveAnyCalendarId } from './calendarResolve'
import { PlainDateArg, getPlainDateSlotsIfPresent } from './plainDate'
import {
  PlainDateTimeArg,
  getPlainDateTimeSlotsIfPresent,
} from './plainDateTime'
import { refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTimeArg,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type DurationArg = Duration | Partial<DurationFields> | string

type DurationSlots = DurationFields & { sign: NumberSign }

const durationSlotsMap = new WeakMap<object, DurationSlots>()

export type Duration = InstanceType<typeof Duration>
export const Duration = defineTemporalClass(
  DurationBranding,
  class {
    constructor(
      years = 0,
      months = 0,
      weeks = 0,
      days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
      milliseconds = 0,
      microseconds = 0,
      nanoseconds = 0,
    ) {
      const fields = validateDurationFields(
        mapProps(toStrictInteger, {
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
        }),
      )
      initDuration(this, createDurationSlots(fields))
    }

    static from(arg: DurationArg): Duration {
      return createDuration(toDurationSlots(arg))
    }

    static compare(
      durationArg0: DurationArg,
      durationArg1: DurationArg,
      options: Temporal.DurationRelativeToOptions | undefined = undefined,
    ): NumberSign {
      return compareDurations(
        refinePublicRelativeTo,
        toDurationSlots(durationArg0),
        toDurationSlots(durationArg1),
        options,
      )
    }

    get sign(): NumberSign {
      return getDurationSlots(this).sign
    }

    get blank(): boolean {
      return !getDurationSlots(this).sign
    }

    with(mod: Partial<DurationFields>): Duration {
      return createDuration(mergeDurationFields(getDurationSlots(this), mod))
    }

    negated(): Duration {
      return createDuration(negateDuration(getDurationSlots(this)))
    }

    abs(): Duration {
      return createDuration(absDuration(getDurationSlots(this)))
    }

    add(
      otherArg: DurationArg,
      options: Temporal.DurationRelativeToOptions | undefined = undefined,
    ): Duration {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          false,
          getDurationSlots(this),
          toDurationSlots(otherArg),
          options,
        ),
      )
    }

    subtract(
      otherArg: DurationArg,
      options: Temporal.DurationRelativeToOptions | undefined = undefined,
    ): Duration {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          true,
          getDurationSlots(this),
          toDurationSlots(otherArg),
          options,
        ),
      )
    }

    round(roundTo: Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>): Duration
    round(roundTo: Temporal.DurationRoundingOptions): Duration
    round(
      roundTo:
        | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
        | Temporal.DurationRoundingOptions,
    ): Duration {
      return createDuration(
        roundDuration(refinePublicRelativeTo, getDurationSlots(this), roundTo),
      )
    }

    total(totalOf: Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>): number
    total(totalOf: Temporal.DurationTotalOptions): number
    total(
      totalOf:
        | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
        | Temporal.DurationTotalOptions,
    ): number {
      return totalDuration(
        refinePublicRelativeTo,
        getDurationSlots(this),
        totalOf,
      )
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options?: any,
    ): string {
      const slots = getDurationSlots(this)

      return (Intl as any).DurationFormat
        ? new (Intl as any).DurationFormat(locales, options).format(slots)
        : formatDurationIso(slots, options)
    }

    toString(
      options: Temporal.DurationToStringOptions | undefined = undefined,
    ): string {
      return formatDurationIso(getDurationSlots(this), options)
    }

    toJSON(): string {
      return formatDurationIso(getDurationSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getDurationSlots,
  durationGetters,
)

export function createDuration(slots: DurationSlots): Duration {
  return initDuration(Object.create(Duration.prototype), slots)
}

export function getDurationSlots(obj: unknown): DurationSlots {
  return getDurationSlotsIfPresent(obj) || invalidRecordType()
}

export function getDurationSlotsIfPresent(
  obj: unknown,
): DurationSlots | undefined {
  return durationSlotsMap.get(obj as object)
}

export function toDurationSlots(arg: DurationArg): DurationSlots {
  if (isObjectLike(arg)) {
    const ownSlots = getDurationSlotsIfPresent(arg)

    if (ownSlots) {
      return ownSlots
    }

    return refineDurationObjectLike(arg as Partial<DurationFields>)
  }

  return parseDuration(arg)
}

function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateTimeArg | PlainDateArg | undefined,
): RelativeToSlots | undefined {
  if (relativeTo !== undefined) {
    if (isObjectLike(relativeTo)) {
      const zonedDateTimeSlots = getZonedDateTimeSlotsIfPresent(relativeTo)

      if (zonedDateTimeSlots) {
        return zonedDateTimeSlots
      }

      const dateSlots = getPlainDateSlotsIfPresent(relativeTo)

      if (dateSlots) {
        return dateSlots
      }

      const dateTimeSlots = getPlainDateTimeSlotsIfPresent(relativeTo)

      if (dateTimeSlots) {
        return createDateSlots(dateTimeSlots, dateTimeSlots.calendar)
      }

      const calendar = getCalendarFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeObjectLike(
        refineTimeZoneArg,
        calendar,
        relativeTo as unknown as ZonedDateTimeLikeObject, // !!!
      )

      return res
    }

    return parseRelativeToSlots(relativeTo, resolveAnyCalendarId)
  }
}

function initDuration(instance: object, slots: DurationSlots): Duration {
  durationSlotsMap.set(instance, slots)
  attachDebugString(instance as Duration)
  return instance as Duration
}
