import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOpsQuery'
import { diffInstants } from './diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { negateDurationInternals } from './durationFields'
import { formatInstantIso } from './isoFormat'
import { createToLocaleStringMethod } from './intlFormat'
import { checkEpochNanoInBounds } from './isoMath'
import { parseInstant } from './isoParse'
import { moveEpochNano } from './move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from './options'
import { toBigInt, ensureObjectlike, ensureStringViaPrimitive } from './cast'
import { roundInstant } from './round'
import { queryTimeZoneOps } from './timeZoneOps'
import { NumSign, defineGetters, defineProps, isObjectlike } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { UnitName, nanoInMicro, nanoInMilli, nanoInSec } from './units'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from './dayTimeNano'
import { DurationBranding, InstantBranding, InstantSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createEpochGetterMethods, createViaSlots, getSlots, getSpecificSlots, neverValueOf, setSlots } from './slots'

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
        toInstantSlots(this).epochNanoseconds,
        toDurationSlots(durationArg),
      ),
    })
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: moveEpochNano(
        toInstantSlots(this).epochNanoseconds,
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
        options,
      ),
    })
  }

  since(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffInstants(
        getInstantSlots(this).epochNanoseconds,
        toInstantSlots(otherArg).epochNanoseconds,
        options,
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
      timeZone: queryTimeZoneOps(timeZoneArg),
      calendar: queryCalendarOps(isoCalendarId),
    })
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
    const slots = getInstantSlots(this)
    const refinedObj = ensureObjectlike(options)

    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      epochNanoseconds: slots.epochNanoseconds,
      timeZone: queryTimeZoneOps(refinedObj.timeZone),
      calendar: queryCalendarOps(refinedObj.calendar),
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

defineProps(Instant.prototype, {
  [Symbol.toStringTag]: 'Temporal.' + InstantBranding,
  toLocaleString: createToLocaleStringMethod(InstantBranding),
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
