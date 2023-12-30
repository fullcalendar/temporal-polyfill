import { LocalesArg } from '../internal/formatIntl'
import { DiffOptions, InstantDisplayOptions, RoundingOptions } from '../internal/optionsRefine'
import { requireObjectlike } from '../internal/cast'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName, nanoInMilli } from '../internal/units'
import { numberToDayTimeNano } from '../internal/dayTimeNano'
import { InstantBranding, InstantSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createInstantSlots } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { CalendarSlot, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createEpochGetterMethods, neverValueOf } from './mixins'
import { createSimpleTimeZoneOps } from './timeZoneOpsQuery'
import { constructInstantSlots } from '../internal/construct'
import { moveInstant } from '../internal/move'
import { diffInstants } from '../internal/diff'
import { roundInstant } from '../internal/round'
import { compareInstants, instantsEqual } from '../internal/compare'
import { formatInstantIso } from '../internal/formatIso'
import { epochMicroToInstant, epochMilliToInstant, epochNanoToInstant, epochSecToInstant, instantToZonedDateTime } from '../internal/convert'
import { parseInstant } from '../internal/parseIso'
import { prepInstantFormat } from './dateTimeFormat'

export type InstantArg = Instant | string

export class Instant {
  constructor(epochNano: bigint) {
    setSlots(
      this,
      constructInstantSlots(epochNano),
    )
  }

  add(durationArg: DurationArg): Instant {
    return createInstant(
      moveInstant(
        false,
        getInstantSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant(
      moveInstant(
        true,
        getInstantSlots(this),
        toDurationSlots(durationArg),
      ),
    )
  }

  until(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration(
      diffInstants(
        getInstantSlots(this),
        toInstantSlots(otherArg),
        options,
      ),
    )
  }

  since(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration(
      diffInstants(
        getInstantSlots(this),
        toInstantSlots(otherArg),
        options,
        true,
      ),
    )
  }

  round(options: RoundingOptions | UnitName): Instant {
    return createInstant(
      roundInstant(
        getInstantSlots(this),
        options,
      ),
    )
  }

  equals(otherArg: InstantArg): boolean {
    return instantsEqual(getInstantSlots(this), toInstantSlots(otherArg))
  }

  toString(options?: InstantDisplayOptions<TimeZoneSlot>): string {
    return formatInstantIso(
      refineTimeZoneSlot,
      createSimpleTimeZoneOps,
      getInstantSlots(this),
      options,
    )
  }

  toJSON(): string {
    return formatInstantIso(
      refineTimeZoneSlot,
      createSimpleTimeZoneOps,
      getInstantSlots(this),
    )
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] =  prepInstantFormat(locales, options, getInstantSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime(
      instantToZonedDateTime(
        getInstantSlots(this),
        refineTimeZoneSlot(timeZoneArg),
      ),
    )
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
    const slots = getInstantSlots(this)
    const refinedObj = requireObjectlike(options)

    return createZonedDateTime(
      instantToZonedDateTime(
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
    return createInstant(epochSecToInstant(epochSec))
  }

  static fromEpochMilliseconds(epochMilli: number): Instant {
    return createInstant(epochMilliToInstant(epochMilli))
  }

  static fromEpochMicroseconds(epochMicro: bigint): Instant {
    return createInstant(epochMicroToInstant(epochMicro))
  }

  static fromEpochNanoseconds(epochNano: bigint): Instant {
    return createInstant(epochNanoToInstant(epochNano))
  }

  static compare(a: InstantArg, b: InstantArg): NumSign {
    return compareInstants(toInstantSlots(a), toInstantSlots(b))
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
          return createInstantSlots((slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).epochNanoseconds)
      }
    }
  }
  return parseInstant(arg as any)
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

// TODO: more DRY
export function toTemporalInstant(this: Date): Instant {
  return createInstant(
    createInstantSlots(
      numberToDayTimeNano(this.valueOf(), nanoInMilli),
    )
  )
}
