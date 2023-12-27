import {
  DurationRoundOptions,
  RelativeToOptions,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
} from '../internal/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { UnitName } from '../internal/units'
import { DurationBag } from '../internal/calendarFields'
import * as DurationFuncs from '../genericApi/duration'
import { BrandingSlots, DurationBranding, DurationSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, ZonedDateTimeBranding, ZonedDateTimeSlots } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { durationGettersMethods, neverValueOf } from './mixins'
import { PlainDateArg } from './plainDate'
import { ZonedDateTimeArg } from './zonedDateTime'
import { createDateRefineOps, createDiffOps } from './calendarOpsQuery'
import { createTimeZoneOps } from './timeZoneOpsQuery'
import { LocalesArg } from '../internal/formatIntl'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { CalendarSlot, getCalendarSlotFromBag } from './calendarSlot'
import { MarkerSlots } from '../internal/durationMath'
import { isoDateFieldNamesDesc } from '../internal/calendarIsoFields'
import { CalendarArg } from './calendar'
import { TimeZoneArg } from './timeZone'
import { ensureString } from '../internal/cast'
import { parseZonedOrPlainDateTime } from '../internal/parseIso'
import { ZonedDateTimeBag, refineMaybeZonedDateTimeBag } from '../internal/bag'

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
    setSlots(this, DurationFuncs.create(
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
    return createDuration(DurationFuncs.withFields(getDurationSlots(this), mod))
  }

  add(otherArg: DurationArg, options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>) {
    return createDuration(
      DurationFuncs.add(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        getDurationSlots(this),
        toDurationSlots(otherArg),
        options,
      )
    )
  }

  subtract(otherArg: DurationArg, options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>) {
    return createDuration(
      DurationFuncs.subtract(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        getDurationSlots(this),
        toDurationSlots(otherArg),
        options,
      )
    )
  }

  negated(): Duration {
    return createDuration(DurationFuncs.negated(getDurationSlots(this)))
  }

  abs(): Duration {
    return createDuration(DurationFuncs.abs(getDurationSlots(this)))
  }

  round(options: DurationRoundOptions<PlainDateArg | ZonedDateTimeArg>): Duration {
    return createDuration(
      DurationFuncs.round(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        getDurationSlots(this),
        options,
      )
    )
  }

  total(options: TotalUnitOptionsWithRel<PlainDateArg | ZonedDateTimeArg> | UnitName): number {
    return DurationFuncs.total(
      refinePublicRelativeTo,
      createDiffOps,
      createTimeZoneOps,
      getDurationSlots(this),
      options,
    )
  }

  toString(options?: TimeDisplayOptions): string {
    return DurationFuncs.toString(getDurationSlots(this), options)
  }

  toLocaleString(locales?: LocalesArg, options?: any): string {
    getDurationSlots(this) // check type
    return new (Intl as any).DurationFormat(locales, options).format(this)
  }

  // TODO: toLocaleString

  toJSON(): string {
    return DurationFuncs.toJSON(getDurationSlots(this))
  }

  get blank(): boolean {
    return DurationFuncs.blank(getDurationSlots(this))
  }

  get sign(): NumSign {
    return DurationFuncs.sign(getDurationSlots(this))
  }

  static from(arg: DurationArg): Duration {
    return createDuration(toDurationSlots(arg))
  }

  static compare(
    durationArg0: DurationArg,
    durationArg1: DurationArg,
    options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
  ): NumSign {
    return DurationFuncs.compare(
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

    return DurationFuncs.fromFields(arg as DurationBag)
  }

  return DurationFuncs.fromString(arg)
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
          return pluckProps([...isoDateFieldNamesDesc, 'calendar'], slots as any)
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

    return parseZonedOrPlainDateTime(ensureString(relativeTo))
  }
}
