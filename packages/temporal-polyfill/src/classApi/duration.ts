import {
  DurationRoundOptions,
  RelativeToOptions,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
} from '../internal/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { UnitName } from '../internal/units'
import { DurationBag } from '../internal/calendarFields'
import { BrandingSlots, DurationBranding, DurationSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateSlots } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { durationGettersMethods, neverValueOf } from './mixins'
import { PlainDateArg } from './plainDate'
import { ZonedDateTimeArg } from './zonedDateTime'
import { createDateRefineOps, createDiffOps } from './calendarOpsQuery'
import { createTimeZoneOps } from './timeZoneOpsQuery'
import { LocalesArg } from '../internal/formatIntl'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag } from './slotsForClasses'
import { MarkerSlots, absDuration, addDurations, negateDuration, queryDurationBlank, queryDurationSign, roundDuration } from '../internal/durationMath'
import { CalendarArg } from './calendar'
import { TimeZoneArg } from './timeZone'
import { parseDuration, parseZonedOrPlainDateTime } from '../internal/parseIso'
import { ZonedDateTimeBag, durationWithFields, refineDurationBag, refineMaybeZonedDateTimeBag } from '../internal/bag'
import { constructDurationSlots } from '../internal/construct'
import { totalDuration } from '../internal/total'
import { formatDurationIso } from '../internal/formatIso'
import { compareDurations } from '../internal/compare'

export type DurationArg = Duration | DurationBag | string

export class Duration {
  constructor(
    years?: number,
    months?: number,
    weeks?: number,
    days?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number,
    microseconds?: number,
    nanoseconds?: number,
  ) {
    setSlots(this, constructDurationSlots(
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
    ))
  }

  with(mod: DurationBag): Duration {
    return createDuration(durationWithFields(getDurationSlots(this), mod))
  }

  add(otherArg: DurationArg, options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>) {
    return createDuration(
      addDurations(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        false,
        getDurationSlots(this),
        toDurationSlots(otherArg),
        options,
      )
    )
  }

  subtract(otherArg: DurationArg, options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>) {
    return createDuration(
      addDurations(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        true,
        getDurationSlots(this),
        toDurationSlots(otherArg),
        options,
      )
    )
  }

  negated(): Duration {
    return createDuration(negateDuration(getDurationSlots(this)))
  }

  abs(): Duration {
    return createDuration(absDuration(getDurationSlots(this)))
  }

  round(options: DurationRoundOptions<PlainDateArg | ZonedDateTimeArg>): Duration {
    return createDuration(
      roundDuration(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        getDurationSlots(this),
        options,
      )
    )
  }

  total(options: TotalUnitOptionsWithRel<PlainDateArg | ZonedDateTimeArg> | UnitName): number {
    return totalDuration(
      refinePublicRelativeTo,
      createDiffOps,
      createTimeZoneOps,
      getDurationSlots(this),
      options,
    )
  }

  toString(options?: TimeDisplayOptions): string {
    return formatDurationIso(getDurationSlots(this), options)
  }

  toLocaleString(locales?: LocalesArg, options?: any): string {
    getDurationSlots(this) // check type
    return new (Intl as any).DurationFormat(locales, options).format(this)
  }

  toJSON(): string {
    return formatDurationIso(getDurationSlots(this))
  }

  get blank(): boolean {
    return queryDurationBlank(getDurationSlots(this))
  }

  get sign(): NumSign {
    return queryDurationSign(getDurationSlots(this))
  }

  static from(arg: DurationArg): Duration {
    return createDuration(toDurationSlots(arg))
  }

  static compare(
    durationArg0: DurationArg,
    durationArg1: DurationArg,
    options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
  ): NumSign {
    return compareDurations(
      refinePublicRelativeTo,
      createDiffOps,
      createTimeZoneOps,
      toDurationSlots(durationArg0),
      toDurationSlots(durationArg1),
      options,
    )
  }
}

defineStringTag(Duration.prototype, DurationBranding)

defineProps(Duration.prototype, {
  valueOf: neverValueOf,
})

defineGetters(
  Duration.prototype,
  durationGettersMethods,
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createDuration(slots: DurationSlots): Duration {
  return createViaSlots(Duration, slots)
}

export function getDurationSlots(duration: Duration): DurationSlots {
  return getSpecificSlots(DurationBranding, duration) as DurationSlots
}

export function toDurationSlots(arg: DurationArg): DurationSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === DurationBranding) {
      return slots as DurationSlots
    }

    return refineDurationBag(arg as DurationBag)
  }

  return parseDuration(arg)
}

function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateArg | undefined,
): MarkerSlots<CalendarSlot, TimeZoneSlot> | undefined {
  if (relativeTo !== undefined) {
    if (isObjectlike(relativeTo)) {
      const slots = (getSlots(relativeTo) || {}) as Partial<BrandingSlots>

      switch (slots.branding) {
        case ZonedDateTimeBranding:
        case PlainDateBranding:
          return slots as (ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> | PlainDateSlots<CalendarSlot>)

        case PlainDateTimeBranding:
          return createPlainDateSlots(slots as PlainDateTimeSlots<CalendarSlot>)
      }

      const calendar = getCalendarSlotFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeBag(
        refineTimeZoneSlot,
        createTimeZoneOps,
        createDateRefineOps(calendar),
        relativeTo as unknown as ZonedDateTimeBag<CalendarArg, TimeZoneArg>, // !!!
      )

      return { ...res, calendar }
    }

    return parseZonedOrPlainDateTime(relativeTo)
  }
}
