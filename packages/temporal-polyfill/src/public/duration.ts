import {
  DurationRoundOptions,
  RelativeToOptions,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
} from '../internal/options'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName } from '../internal/units'
import { DurationBag } from '../internal/calendarFields'
import * as DurationFuncs from '../genericApi/duration'
import { DurationBranding } from '../genericApi/branding'
import { DurationSlots } from '../genericApi/genericTypes'

// public
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'
import { durationGettersMethods, neverValueOf } from './publicMixins'

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

  add(otherArg: DurationArg, options?: RelativeToOptions) {
    return createDuration(DurationFuncs.add(
      getDurationSlots(this),
      toDurationSlots(otherArg),
      options,
    ))
  }

  subtract(otherArg: DurationArg, options?: RelativeToOptions) {
    return createDuration(DurationFuncs.subtract(
      getDurationSlots(this),
      toDurationSlots(otherArg),
      options,
    ))
  }

  negated(): Duration {
    return createDuration(DurationFuncs.negated(getDurationSlots(this)))
  }

  abs(): Duration {
    return createDuration(DurationFuncs.abs(getDurationSlots(this)))
  }

  round(options: DurationRoundOptions): Duration {
    return createDuration(DurationFuncs.round(getDurationSlots(this), options))
  }

  total(options: TotalUnitOptionsWithRel | UnitName): number {
    return DurationFuncs.total(getDurationSlots(this), options)
  }

  toString(options?: TimeDisplayOptions): string {
    return DurationFuncs.toString(getDurationSlots(this), options)
  }

  // TODO: toLocaleString

  toJSON(): string {
    return DurationFuncs.toJSON(getDurationSlots(this))
  }

  get blank(): boolean {
    return DurationFuncs.blank(getDurationSlots(this))
  }

  static from(arg: DurationArg): Duration {
    return createDuration(toDurationSlots(arg))
  }

  static compare(
    durationArg0: DurationArg,
    durationArg1: DurationArg,
    options?: RelativeToOptions,
  ): NumSign {
    return DurationFuncs.compare(
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
