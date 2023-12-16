import {
  DurationRoundOptions,
  RelativeToOptions,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
} from '../genericApi/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName } from '../internal/units'
import { DurationBag } from '../internal/calendarFields'
import * as DurationFuncs from '../genericApi/duration'
import { DurationBranding } from '../genericApi/branding'
import { DurationSlots } from '../genericApi/slotsGeneric'

// public
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { durationGettersMethods, neverValueOf } from './mixins'
import { PlainDateArg } from './plainDate'
import { ZonedDateTimeArg } from './zonedDateTime'
import { refinePublicRelativeTo } from './markerRefine'
import { createDiffOps } from './calendarOpsQuery'
import { createTimeZoneOps } from './timeZoneOpsQuery'

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
