import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { compareDurations } from '../../internal/compare'
import { constructDurationSlots } from '../../internal/construct'
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
} from '../../internal/durationMath'
import * as errorMessages from '../../internal/errorMessages'
import { ZonedDateTimeLikeObject } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatDurationIso } from '../../internal/isoFormat'
import { parseDuration, parseRelativeToSlots } from '../../internal/isoParse'
import { mergeDurationFields } from '../../internal/merge'
import {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
  TimeDisplayOptions,
} from '../../internal/optionsModel'
import { RelativeToSlots } from '../../internal/relativeMath'
import { createDateSlots } from '../../internal/slots'
import { totalDuration } from '../../internal/total'
import { UnitName } from '../../internal/units'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { getCalendarFromBag } from './calendarArg'
import { resolveAnyCalendar } from './calendarResolve'
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

export class Duration implements DurationFields {
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
    initDuration(
      this,
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

  static from(arg: DurationArg): Duration {
    return createDuration(toDurationSlots(arg))
  }

  static compare(
    durationArg0: DurationArg,
    durationArg1: DurationArg,
    options:
      | RelativeToOptions<PlainDateArg | ZonedDateTimeArg>
      | undefined = undefined,
  ): NumberSign {
    return compareDurations(
      refinePublicRelativeTo,
      toDurationSlots(durationArg0),
      toDurationSlots(durationArg1),
      options,
    )
  }

  get years(): number {
    return getDurationSlots(this).years
  }

  get months(): number {
    return getDurationSlots(this).months
  }

  get weeks(): number {
    return getDurationSlots(this).weeks
  }

  get days(): number {
    return getDurationSlots(this).days
  }

  get hours(): number {
    return getDurationSlots(this).hours
  }

  get minutes(): number {
    return getDurationSlots(this).minutes
  }

  get seconds(): number {
    return getDurationSlots(this).seconds
  }

  get milliseconds(): number {
    return getDurationSlots(this).milliseconds
  }

  get microseconds(): number {
    return getDurationSlots(this).microseconds
  }

  get nanoseconds(): number {
    return getDurationSlots(this).nanoseconds
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
    options:
      | RelativeToOptions<PlainDateArg | ZonedDateTimeArg>
      | undefined = undefined,
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
    options:
      | RelativeToOptions<PlainDateArg | ZonedDateTimeArg>
      | undefined = undefined,
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

  round(
    options: DurationRoundingOptions<PlainDateArg | ZonedDateTimeArg>,
  ): Duration {
    return createDuration(
      roundDuration(refinePublicRelativeTo, getDurationSlots(this), options),
    )
  }

  total(
    options: UnitName | DurationTotalOptions<PlainDateArg | ZonedDateTimeArg>,
  ): number {
    return totalDuration(
      refinePublicRelativeTo,
      getDurationSlots(this),
      options,
    )
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options?: any,
  ): string {
    return (Intl as any).DurationFormat
      ? new (Intl as any).DurationFormat(locales, options).format(this)
      : formatDurationIso(getDurationSlots(this), options)
  }

  toString(options: TimeDisplayOptions | undefined = undefined): string {
    return formatDurationIso(getDurationSlots(this), options)
  }

  toJSON(): string {
    return formatDurationIso(getDurationSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(Duration, 'Duration')
export function createDuration(slots: DurationSlots): Duration {
  return initDuration(Object.create(Duration.prototype), slots)
}

export function getDurationSlots(obj: unknown): DurationSlots {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = durationSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
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

    return parseRelativeToSlots(relativeTo, resolveAnyCalendar)
  }
}

function initDuration(instance: Duration, slots: DurationSlots): Duration {
  durationSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatDurationIso)
  return instance
}
