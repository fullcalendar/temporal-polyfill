import { LocalesArg, prepInstantFormat } from '../internal/intlFormat'
import { DiffOptions, InstantDisplayOptions, RoundingOptions, prepareOptions } from '../genericApi/options'
import { ensureObjectlike } from '../internal/cast'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName, nanoInMilli } from '../internal/units'
import { numberToDayTimeNano } from '../internal/dayTimeNano'
import { InstantSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import { DurationBranding, InstantBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import * as InstantFuncs from '../genericApi/instant'

// public
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'
import { CalendarSlot, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createEpochGetterMethods, neverValueOf } from './publicMixins'
import { createSimpleTimeZoneRecord } from './recordCreators'

export type InstantArg = Instant | string

export class Instant {
  constructor(epochNano: bigint) {
    setSlots(
      this,
      InstantFuncs.create(epochNano),
    )
  }

  add(durationArg: DurationArg): Instant {
    return createInstant(
      InstantFuncs.add(
        getInstantSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant(
      InstantFuncs.subtract(
        getInstantSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  until(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration(
      InstantFuncs.until(
        getInstantSlots(this),
        toInstantSlots(otherArg),
        prepareOptions(options),
      ),
    )
  }

  since(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding, // !!!
      ...InstantFuncs.since(
        getInstantSlots(this),
        toInstantSlots(otherArg),
        prepareOptions(options),
      ),
    })
  }

  round(options: RoundingOptions | UnitName): Instant {
    return createInstant(
      InstantFuncs.round(
        getInstantSlots(this),
        options,
      ),
    )
  }

  equals(otherArg: InstantArg): boolean {
    return InstantFuncs.equals(getInstantSlots(this), toInstantSlots(otherArg))
  }

  toString(options?: InstantDisplayOptions<TimeZoneSlot>): string {
    return InstantFuncs.toString(
      refineTimeZoneSlot,
      createSimpleTimeZoneRecord,
      getInstantSlots(this),
      options,
    )
  }

  toJSON(): string {
    return InstantFuncs.toString(
      refineTimeZoneSlot,
      createSimpleTimeZoneRecord,
      getInstantSlots(this),
    )
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] =  prepInstantFormat(locales, options, getInstantSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime(
      InstantFuncs.toZonedDateTimeISO(
        getInstantSlots(this),
        refineTimeZoneSlot(timeZoneArg),
      ),
    )
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
    const slots = getInstantSlots(this)
    const refinedObj = ensureObjectlike(options)

    return createZonedDateTime(
      InstantFuncs.toZonedDateTime(
        slots,
        refineTimeZoneSlot(refinedObj.timeZone),
        refineCalendarSlot(refinedObj.calendar),
      )
    )
  }

  static from(arg: InstantArg) {
    return createInstant(toInstantSlots(arg))
  }

  static fromEpochSeconds(epochSec: number): Instant {
    return createInstant(InstantFuncs.fromEpochSeconds(epochSec))
  }

  static fromEpochMilliseconds(epochMilli: number): Instant {
    return createInstant(InstantFuncs.fromEpochMilliseconds(epochMilli))
  }

  static fromEpochMicroseconds(epochMicro: bigint): Instant {
    return createInstant(InstantFuncs.fromEpochMicroseconds(epochMicro))
  }

  static fromEpochNanoseconds(epochNano: bigint): Instant {
    return createInstant(InstantFuncs.fromEpochNanoseconds(epochNano))
  }

  static compare(a: InstantArg, b: InstantArg): NumSign {
    return InstantFuncs.compare(toInstantSlots(a), toInstantSlots(b))
  }
}

defineStringTag(Instant.prototype, InstantBranding)

defineProps(Instant.prototype, {
  valueOf: neverValueOf,
})

defineGetters(
  Instant.prototype,
  createEpochGetterMethods(InstantBranding),
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createInstant(slots: InstantSlots): Instant {
  return createViaSlots(Instant, slots)
}

export function getInstantSlots(instant: Instant): InstantSlots {
  return getSpecificSlots(InstantBranding, instant) as InstantSlots
}

export function toInstantSlots(arg: InstantArg): InstantSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case InstantBranding:
          return slots as InstantSlots
        case ZonedDateTimeBranding:
          return { epochNanoseconds: (slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).epochNanoseconds, branding: InstantBranding }
      }
    }
  }
  return InstantFuncs.fromString(arg as any)
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

// TODO: more DRY
export function toTemporalInstant(this: Date): Instant {
  return createInstant({
    branding: InstantBranding,
    epochNanoseconds: numberToDayTimeNano(this.valueOf(), nanoInMilli),
  })
}
