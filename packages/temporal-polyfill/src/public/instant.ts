import { isoCalendarId } from '../internal/calendarConfig'
import { diffInstants } from '../internal/diff'
import { negateDurationInternals } from '../internal/durationFields'
import { formatInstantIso } from '../internal/isoFormat'
import { createToLocaleStringMethods } from '../internal/intlFormat'
import { checkEpochNanoInBounds } from '../internal/isoMath'
import { parseInstant } from '../internal/isoParse'
import { moveEpochNano } from '../internal/move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
  prepareOptions,
} from '../internal/options'
import { toBigInt, ensureObjectlike, ensureStringViaPrimitive } from '../internal/cast'
import { roundInstant } from '../internal/round'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName, nanoInMicro, nanoInMilli, nanoInSec } from '../internal/units'
import { bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from '../internal/dayTimeNano'
import { DurationBranding, InstantBranding, InstantSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { refineCalendarSlot } from '../internal/calendarSlotUtils'
import { refineTimeZoneSlot } from '../internal/timeZoneSlotUtils'

// public
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createEpochGetterMethods, neverValueOf } from './publicMixins'

export type InstantArg = Instant | string

export class Instant {
  constructor(epochNano: bigint) {
    setSlots(this, {
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    } as InstantSlots)
  }

  add(durationArg: DurationArg): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: moveEpochNano(
        getInstantSlots(this).epochNanoseconds,
        toDurationSlots(durationArg),
      ),
    })
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: moveEpochNano(
        getInstantSlots(this).epochNanoseconds,
        negateDurationInternals(toDurationSlots(durationArg)),
      ),
    })
  }

  until(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffInstants(
        getInstantSlots(this).epochNanoseconds,
        toInstantSlots(otherArg).epochNanoseconds,
        prepareOptions(options),
      ),
    })
  }

  since(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffInstants(
        getInstantSlots(this).epochNanoseconds,
        toInstantSlots(otherArg).epochNanoseconds,
        prepareOptions(options),
        true,
      )
    })
  }

  round(options: RoundingOptions | UnitName): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: roundInstant(getInstantSlots(this).epochNanoseconds, options),
    })
  }

  equals(otherArg: InstantArg): boolean {
    return !compareDayTimeNanos(
      getInstantSlots(this).epochNanoseconds,
      toInstantSlots(otherArg).epochNanoseconds,
    )
  }

  toString(options?: InstantDisplayOptions): string {
    return formatInstantIso(getInstantSlots(this).epochNanoseconds, options)
  }

  toJSON(): string {
    return formatInstantIso(getInstantSlots(this).epochNanoseconds)
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      epochNanoseconds: getInstantSlots(this).epochNanoseconds,
      timeZone: refineTimeZoneSlot(timeZoneArg),
      calendar: isoCalendarId,
    })
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
    const slots = getInstantSlots(this)
    const refinedObj = ensureObjectlike(options)

    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      epochNanoseconds: slots.epochNanoseconds,
      timeZone: refineTimeZoneSlot(refinedObj.timeZone),
      calendar: refineCalendarSlot(refinedObj.calendar),
    })
  }

  static from(arg: InstantArg) {
    return createInstant(toInstantSlots(arg))
  }

  static fromEpochSeconds(epochSec: number): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec))
    })
  }

  static fromEpochMilliseconds(epochMilli: number): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
    })
  }

  static fromEpochMicroseconds(epochMicro: bigint): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro))
    })
  }

  static fromEpochNanoseconds(epochNano: bigint): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    })
  }

  static compare(a: InstantArg, b: InstantArg): NumSign {
    return compareDayTimeNanos(
      toInstantSlots(a).epochNanoseconds,
      toInstantSlots(b).epochNanoseconds,
    )
  }
}

defineStringTag(Instant.prototype, InstantBranding)

defineProps(Instant.prototype, {
  ...createToLocaleStringMethods(InstantBranding),
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
          return { epochNanoseconds: (slots as ZonedDateTimeSlots).epochNanoseconds, branding: InstantBranding }
      }
    }
  }
  return {
    branding: InstantBranding,
    epochNanoseconds: parseInstant(ensureStringViaPrimitive(arg as any)),
  }
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
